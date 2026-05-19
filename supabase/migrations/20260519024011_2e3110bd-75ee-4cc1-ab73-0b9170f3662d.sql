-- 1) journal_entries.retention_until
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS retention_until timestamptz;

CREATE OR REPLACE FUNCTION public.set_journal_retention()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.retention_until IS NULL THEN
    NEW.retention_until := COALESCE(NEW.created_at, now()) + interval '10 years';
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_set_journal_retention ON public.journal_entries;
CREATE TRIGGER trg_set_journal_retention
  BEFORE INSERT OR UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_journal_retention();

UPDATE public.journal_entries SET retention_until = created_at + interval '10 years' WHERE retention_until IS NULL;

-- 2) Signer address required for in-person acts
CREATE OR REPLACE FUNCTION public.require_signer_address_for_inperson()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF COALESCE(NEW.communication_technology, 'in-person') NOT IN ('audio-video', 'remote')
     AND (NEW.signer_address IS NULL OR length(trim(NEW.signer_address)) < 5) THEN
    RAISE EXCEPTION 'Ohio ORC §147.141: signer address is required for in-person notarial acts.';
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_require_signer_address ON public.journal_entries;
CREATE TRIGGER trg_require_signer_address
  BEFORE INSERT OR UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.require_signer_address_for_inperson();

-- 3) Signature method + 2-witness gate
ALTER TABLE public.notarization_sessions ADD COLUMN IF NOT EXISTS signature_method text DEFAULT 'standard';

CREATE OR REPLACE FUNCTION public.enforce_signature_by_mark_witnesses()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_witness_count int;
BEGIN
  IF NEW.signature_method = 'mark' AND NEW.status IN ('active', 'completed') THEN
    SELECT count(*) INTO v_witness_count
    FROM public.witnesses w
    JOIN public.appointments a ON a.id = w.appointment_id
    WHERE a.id = NEW.appointment_id;
    IF v_witness_count < 2 THEN
      RAISE EXCEPTION 'Ohio ORC §147.53: Signature by Mark requires 2 witnesses (found %).', v_witness_count;
    END IF;
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_signature_by_mark_witnesses ON public.notarization_sessions;
CREATE TRIGGER trg_signature_by_mark_witnesses
  BEFORE INSERT OR UPDATE ON public.notarization_sessions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_signature_by_mark_witnesses();

-- 4) refusal_logs
CREATE TABLE IF NOT EXISTS public.refusal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notary_user_id uuid NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  session_id uuid,
  signer_name text,
  refusal_reason text NOT NULL,
  refusal_category text NOT NULL CHECK (refusal_category IN (
    'kba_failed','id_invalid','id_expired','signer_impaired',
    'upl_legal_advice','document_incomplete','signer_unwilling',
    'video_quality','jurisdiction','other'
  )),
  notes text,
  retention_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refusal_logs_notary ON public.refusal_logs(notary_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refusal_logs_appointment ON public.refusal_logs(appointment_id);

ALTER TABLE public.refusal_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notaries log their refusals" ON public.refusal_logs;
CREATE POLICY "Notaries log their refusals" ON public.refusal_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = notary_user_id);

DROP POLICY IF EXISTS "Notaries read own refusals" ON public.refusal_logs;
CREATE POLICY "Notaries read own refusals" ON public.refusal_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = notary_user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage refusals" ON public.refusal_logs;
CREATE POLICY "Admins manage refusals" ON public.refusal_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_refusal_retention()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.retention_until IS NULL THEN
    NEW.retention_until := COALESCE(NEW.created_at, now()) + interval '10 years';
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_set_refusal_retention ON public.refusal_logs;
CREATE TRIGGER trg_set_refusal_retention
  BEFORE INSERT OR UPDATE ON public.refusal_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_refusal_retention();

-- 5) impersonation_sessions
CREATE TABLE IF NOT EXISTS public.impersonation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  reason text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 minutes'),
  ended_at timestamptz,
  ended_reason text,
  CHECK (expires_at <= started_at + interval '60 minutes')
);
CREATE INDEX IF NOT EXISTS idx_impersonation_admin ON public.impersonation_sessions(admin_user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_impersonation_target ON public.impersonation_sessions(target_user_id, started_at DESC);

ALTER TABLE public.impersonation_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage impersonation" ON public.impersonation_sessions;
CREATE POLICY "Admins manage impersonation" ON public.impersonation_sessions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND admin_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.audit_impersonation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (action, entity_type, entity_id, user_id, details)
    VALUES ('impersonation_started','impersonation_sessions',NEW.id,NEW.admin_user_id,
      jsonb_build_object('target_user_id',NEW.target_user_id,'reason',NEW.reason,'expires_at',NEW.expires_at));
  ELSIF TG_OP = 'UPDATE' AND OLD.ended_at IS NULL AND NEW.ended_at IS NOT NULL THEN
    INSERT INTO public.audit_log (action, entity_type, entity_id, user_id, details)
    VALUES ('impersonation_ended','impersonation_sessions',NEW.id,NEW.admin_user_id,
      jsonb_build_object('target_user_id',NEW.target_user_id,'ended_reason',NEW.ended_reason,
        'duration_seconds',extract(epoch from (NEW.ended_at - NEW.started_at))));
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_audit_impersonation ON public.impersonation_sessions;
CREATE TRIGGER trg_audit_impersonation
  AFTER INSERT OR UPDATE ON public.impersonation_sessions
  FOR EACH ROW EXECUTE FUNCTION public.audit_impersonation();