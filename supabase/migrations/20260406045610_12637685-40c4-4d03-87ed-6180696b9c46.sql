
-- Phase 1 Gap 3: DELETE RLS on service_requests
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete service requests' AND tablename = 'service_requests') THEN
    CREATE POLICY "Admins can delete service requests"
    ON public.service_requests FOR DELETE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Phase 1 Gap 4: Deals — clients view own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Clients view own deals' AND tablename = 'deals') THEN
    CREATE POLICY "Clients view own deals"
    ON public.deals FOR SELECT TO authenticated
    USING (contact_id = auth.uid());
  END IF;
END $$;

-- Phase 2 Gap 7: Journal cross-notary visibility
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Notaries view own journal entries' AND tablename = 'notary_journal') THEN
    CREATE POLICY "Notaries view own journal entries"
    ON public.notary_journal FOR SELECT TO authenticated
    USING (has_role(auth.uid(), 'notary'::app_role) AND created_by = auth.uid());
  END IF;
END $$;

-- Phase 4 Gap 73: retention_expires_at on notarization_sessions
ALTER TABLE public.notarization_sessions
ADD COLUMN IF NOT EXISTS retention_expires_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_retention_expires_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.retention_expires_at := NEW.created_at + interval '10 years';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_retention_expires ON public.notarization_sessions;
CREATE TRIGGER trg_set_retention_expires
BEFORE INSERT ON public.notarization_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_retention_expires_at();

-- Phase 4 Gap 75: credential_analysis on notary_journal
ALTER TABLE public.notary_journal
ADD COLUMN IF NOT EXISTS credential_analysis jsonb DEFAULT NULL;

-- Phase 9 Gap 491: Orphaned documents fix
ALTER TABLE public.documents
DROP CONSTRAINT IF EXISTS documents_appointment_id_fkey;

ALTER TABLE public.documents
ADD CONSTRAINT documents_appointment_id_fkey
FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;
