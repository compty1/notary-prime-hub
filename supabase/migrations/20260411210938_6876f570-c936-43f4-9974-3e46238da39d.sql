
-- Fingerprint Sessions
CREATE TABLE public.fingerprint_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  client_id UUID NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'ink',
  card_type TEXT NOT NULL DEFAULT 'FD-258',
  card_count INTEGER NOT NULL DEFAULT 1,
  agency_destination TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  fee NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fingerprint_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access fingerprint_sessions" ON public.fingerprint_sessions FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own fingerprint_sessions" ON public.fingerprint_sessions FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users create own fingerprint_sessions" ON public.fingerprint_sessions FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE TRIGGER trg_fingerprint_sessions_updated BEFORE UPDATE ON public.fingerprint_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_fingerprint_sessions_client ON public.fingerprint_sessions(client_id);

-- Process Serving Cases
CREATE TABLE public.process_serving_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  case_number TEXT,
  court_name TEXT,
  serve_type TEXT NOT NULL DEFAULT 'personal',
  respondent_name TEXT NOT NULL,
  respondent_address TEXT,
  document_description TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  affidavit_filed BOOLEAN NOT NULL DEFAULT false,
  affidavit_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  fee NUMERIC(10,2),
  deadline DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.process_serving_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access process_serving_cases" ON public.process_serving_cases FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own process_serving_cases" ON public.process_serving_cases FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users create own process_serving_cases" ON public.process_serving_cases FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE TRIGGER trg_process_serving_updated BEFORE UPDATE ON public.process_serving_cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_process_serving_client ON public.process_serving_cases(client_id);
CREATE INDEX idx_process_serving_status ON public.process_serving_cases(status);

-- Skip Trace Requests
CREATE TABLE public.skip_trace_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  subject_name TEXT NOT NULL,
  subject_last_known_address TEXT,
  subject_dob DATE,
  purpose TEXT,
  data_sources_used TEXT[],
  result_address TEXT,
  result_phone TEXT,
  result_email TEXT,
  result_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  fee NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.skip_trace_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access skip_trace_requests" ON public.skip_trace_requests FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own skip_trace_requests" ON public.skip_trace_requests FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users create own skip_trace_requests" ON public.skip_trace_requests FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE TRIGGER trg_skip_trace_updated BEFORE UPDATE ON public.skip_trace_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Vital Records Requests
CREATE TABLE public.vital_records_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  record_type TEXT NOT NULL DEFAULT 'birth_certificate',
  person_name TEXT NOT NULL,
  date_of_event DATE,
  county TEXT,
  state TEXT NOT NULL DEFAULT 'OH',
  agency TEXT,
  copies_requested INTEGER NOT NULL DEFAULT 1,
  agency_fee NUMERIC(10,2),
  service_fee NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'intake',
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vital_records_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access vital_records_requests" ON public.vital_records_requests FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own vital_records_requests" ON public.vital_records_requests FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users create own vital_records_requests" ON public.vital_records_requests FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE TRIGGER trg_vital_records_updated BEFORE UPDATE ON public.vital_records_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Scrivener Jobs (UPL-compliant document typing)
CREATE TABLE public.scrivener_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  form_type TEXT NOT NULL,
  form_name TEXT,
  court_jurisdiction TEXT,
  page_count INTEGER,
  upl_acknowledgment BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  fee NUMERIC(10,2),
  completed_file_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scrivener_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access scrivener_jobs" ON public.scrivener_jobs FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own scrivener_jobs" ON public.scrivener_jobs FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users create own scrivener_jobs" ON public.scrivener_jobs FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE TRIGGER trg_scrivener_jobs_updated BEFORE UPDATE ON public.scrivener_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Translation Requests
CREATE TABLE public.translation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  source_language TEXT NOT NULL DEFAULT 'en',
  target_language TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_path TEXT,
  page_count INTEGER,
  certified BOOLEAN NOT NULL DEFAULT false,
  translator_name TEXT,
  translator_credentials TEXT,
  affidavit_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  fee NUMERIC(10,2),
  deadline DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.translation_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access translation_requests" ON public.translation_requests FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own translation_requests" ON public.translation_requests FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users create own translation_requests" ON public.translation_requests FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE TRIGGER trg_translation_requests_updated BEFORE UPDATE ON public.translation_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Courier Jobs
CREATE TABLE public.courier_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  package_description TEXT,
  chain_of_custody_log JSONB DEFAULT '[]'::jsonb,
  requires_signature BOOLEAN NOT NULL DEFAULT true,
  delivery_confirmed_at TIMESTAMPTZ,
  delivery_photo_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  fee NUMERIC(10,2),
  distance_miles NUMERIC(8,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courier_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access courier_jobs" ON public.courier_jobs FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own courier_jobs" ON public.courier_jobs FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users create own courier_jobs" ON public.courier_jobs FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE TRIGGER trg_courier_jobs_updated BEFORE UPDATE ON public.courier_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Virtual Assistant Tasks
CREATE TABLE public.virtual_assistant_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  description TEXT,
  hours_estimated NUMERIC(6,2),
  hours_actual NUMERIC(6,2),
  hourly_rate NUMERIC(8,2) DEFAULT 35.00,
  deadline TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'normal',
  assigned_to UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  deliverable_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.virtual_assistant_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access virtual_assistant_tasks" ON public.virtual_assistant_tasks FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own virtual_assistant_tasks" ON public.virtual_assistant_tasks FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users create own virtual_assistant_tasks" ON public.virtual_assistant_tasks FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE TRIGGER trg_va_tasks_updated BEFORE UPDATE ON public.virtual_assistant_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_va_tasks_client ON public.virtual_assistant_tasks(client_id);
CREATE INDEX idx_va_tasks_status ON public.virtual_assistant_tasks(status);

-- Background Checks
CREATE TABLE public.background_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  subject_name TEXT NOT NULL,
  check_type TEXT NOT NULL DEFAULT 'bci',
  agency TEXT,
  fingerprints_required BOOLEAN NOT NULL DEFAULT false,
  fingerprint_session_id UUID REFERENCES public.fingerprint_sessions(id) ON DELETE SET NULL,
  purpose TEXT,
  result_status TEXT,
  result_date DATE,
  result_file_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  fee NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.background_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access background_checks" ON public.background_checks FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own background_checks" ON public.background_checks FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users create own background_checks" ON public.background_checks FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE TRIGGER trg_background_checks_updated BEFORE UPDATE ON public.background_checks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Identity Certificates
CREATE TABLE public.identity_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  certificate_type TEXT NOT NULL DEFAULT 'identity',
  issued_to_name TEXT NOT NULL,
  issued_to_dob DATE,
  verification_method TEXT NOT NULL DEFAULT 'in_person',
  id_document_type TEXT,
  id_document_number TEXT,
  certificate_number TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.identity_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access identity_certificates" ON public.identity_certificates FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own identity_certificates" ON public.identity_certificates FOR SELECT USING (auth.uid() = client_id);
CREATE TRIGGER trg_identity_certificates_updated BEFORE UPDATE ON public.identity_certificates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate certificate numbers
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
  RETURNS TRIGGER LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.certificate_number IS NULL THEN
    NEW.certificate_number := 'CERT-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_identity_cert_number
  BEFORE INSERT ON public.identity_certificates
  FOR EACH ROW EXECUTE FUNCTION public.generate_certificate_number();
