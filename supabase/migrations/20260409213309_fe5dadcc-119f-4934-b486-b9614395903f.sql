
-- CRIT-008: RON 10-year retention enforcement trigger
CREATE OR REPLACE FUNCTION public.enforce_ron_retention()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.recording_url IS NOT NULL AND NEW.retention_expires_at IS NULL THEN
    NEW.retention_expires_at := (COALESCE(NEW.started_at, now()) + interval '10 years');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_enforce_ron_retention ON public.notarization_sessions;
CREATE TRIGGER trg_enforce_ron_retention
  BEFORE INSERT OR UPDATE ON public.notarization_sessions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_ron_retention();

-- CRIT-002: KBA attempt limit enforcement (max 2 per Ohio ORC §147.66)
CREATE OR REPLACE FUNCTION public.enforce_kba_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.kba_attempts IS NOT NULL AND NEW.kba_attempts > 2 THEN
    RAISE EXCEPTION 'Ohio ORC §147.66: Maximum 2 KBA attempts allowed. Session must be terminated.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_enforce_kba_limit ON public.notarization_sessions;
CREATE TRIGGER trg_enforce_kba_limit
  BEFORE INSERT OR UPDATE ON public.notarization_sessions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_kba_limit();

-- CRIT-003: Recording consent gate - prevent session going active without consent
CREATE OR REPLACE FUNCTION public.enforce_recording_consent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND (NEW.recording_consent IS NULL OR NEW.recording_consent = false) THEN
    RAISE EXCEPTION 'Ohio ORC §147.63: Recording consent required before session can begin.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_enforce_recording_consent ON public.notarization_sessions;
CREATE TRIGGER trg_enforce_recording_consent
  BEFORE UPDATE ON public.notarization_sessions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_recording_consent();

-- CRIT-005: Function to create per-document journal entries
CREATE OR REPLACE FUNCTION public.create_per_document_journal_entries(
  p_session_id uuid,
  p_notary_user_id uuid,
  p_notary_name text,
  p_documents jsonb
)
RETURNS void AS $$
DECLARE
  doc jsonb;
  session_rec record;
  next_journal_number int;
BEGIN
  SELECT * INTO session_rec FROM public.notarization_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Session not found'; END IF;

  SELECT COALESCE(MAX(journal_number), 0) + 1 INTO next_journal_number FROM public.journal_entries WHERE notary_user_id = p_notary_user_id;

  FOR doc IN SELECT * FROM jsonb_array_elements(p_documents)
  LOOP
    INSERT INTO public.journal_entries (
      notary_user_id, notary_name, entry_date, entry_time,
      document_type_description, notarial_act_type, journal_number,
      session_id, signer_name, signer_address,
      communication_technology, notes
    ) VALUES (
      p_notary_user_id, p_notary_name,
      CURRENT_DATE::text, to_char(now(), 'HH24:MI'),
      COALESCE(doc->>'document_name', 'Unknown Document'),
      COALESCE(doc->>'act_type', 'acknowledgment'),
      next_journal_number,
      p_session_id,
      session_rec.signer_name,
      session_rec.signer_address,
      'audio-video',
      'Auto-generated per ORC §147.141 - individual entry per document'
    );
    next_journal_number := next_journal_number + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- CRIT-001: Function to check journal completeness
CREATE OR REPLACE FUNCTION public.check_journal_completeness(p_appointment_id uuid)
RETURNS boolean AS $$
DECLARE
  appt_status text;
  journal_count int;
BEGIN
  SELECT status INTO appt_status FROM public.appointments WHERE id = p_appointment_id;
  IF appt_status NOT IN ('completed', 'notarized') THEN RETURN true; END IF;
  SELECT count(*) INTO journal_count FROM public.journal_entries WHERE session_id IN (SELECT id::text FROM public.notarization_sessions WHERE appointment_id = p_appointment_id);
  RETURN journal_count > 0;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- CRIT-006/HIGH-011: Admin-only RLS for build_tracker tables
DROP POLICY IF EXISTS "Admin full access to build_tracker_items" ON public.build_tracker_items;
CREATE POLICY "Admin full access to build_tracker_items"
  ON public.build_tracker_items
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin full access to build_tracker_plans" ON public.build_tracker_plans;
CREATE POLICY "Admin full access to build_tracker_plans"
  ON public.build_tracker_plans
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- CRIT-009: Ohio fee cap enforcement function (callable from edge functions)
CREATE OR REPLACE FUNCTION public.validate_ohio_fee_cap(
  p_amount numeric,
  p_notarial_act_count int DEFAULT 1
)
RETURNS boolean AS $$
BEGIN
  -- Ohio ORC §147.08: $5 per notarial act
  IF p_amount > (p_notarial_act_count * 5.0) THEN
    RETURN false;
  END IF;
  RETURN true;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- HIGH-016: Increase file size limit notation in platform_settings
-- (Actual enforcement is client-side via fileValidation.ts, upping to 25MB)
