
-- Performance Indexes (all IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON public.appointments (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments (client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointments_notary_id ON public.appointments (notary_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON public.appointments (scheduled_date, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders (client_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments (client_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON public.payments (appointment_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_appointment_id ON public.documents (appointment_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents (status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_notary ON public.journal_entries (notary_user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_session ON public.journal_entries (session_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON public.journal_entries (entry_date);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log (action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_client ON public.service_requests (client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests (status);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient ON public.chat_messages (recipient_id);
CREATE INDEX IF NOT EXISTS idx_notarization_sessions_appointment ON public.notarization_sessions (appointment_id);
CREATE INDEX IF NOT EXISTS idx_notarization_sessions_status ON public.notarization_sessions (status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

-- UX Deliverables (table may not exist yet)
CREATE TABLE IF NOT EXISTS public.ux_deliverables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ux_projects(id) ON DELETE CASCADE,
  deliverable_type TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Deliverable',
  content JSONB,
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ux_deliverables ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ux_deliverables' AND policyname='Admins can manage all UX deliverables') THEN
    CREATE POLICY "Admins can manage all UX deliverables"
      ON public.ux_deliverables FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ux_deliverables' AND policyname='Clients can view own UX deliverables') THEN
    CREATE POLICY "Clients can view own UX deliverables"
      ON public.ux_deliverables FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.ux_projects p WHERE p.id = project_id AND p.client_id = auth.uid()));
  END IF;
END $$;

CREATE OR REPLACE TRIGGER trg_ux_deliverables_updated
  BEFORE UPDATE ON public.ux_deliverables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- UX Audit Reports
CREATE TABLE IF NOT EXISTS public.ux_audit_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.ux_projects(id) ON DELETE CASCADE,
  report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  score NUMERIC(5,2),
  recommendations JSONB DEFAULT '[]'::jsonb,
  generated_by_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ux_audit_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ux_audit_reports' AND policyname='Admins can manage all UX audit reports') THEN
    CREATE POLICY "Admins can manage all UX audit reports"
      ON public.ux_audit_reports FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ux_audit_reports' AND policyname='Clients can view own UX audit reports') THEN
    CREATE POLICY "Clients can view own UX audit reports"
      ON public.ux_audit_reports FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.ux_projects p WHERE p.id = project_id AND p.client_id = auth.uid()));
  END IF;
END $$;
