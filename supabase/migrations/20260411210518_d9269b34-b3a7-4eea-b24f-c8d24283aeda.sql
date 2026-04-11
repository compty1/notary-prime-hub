
-- RON Recordings Archive
CREATE TABLE public.ron_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.notarization_sessions(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  recording_type TEXT NOT NULL DEFAULT 'audio-video',
  consent_verified BOOLEAN NOT NULL DEFAULT false,
  retention_expires_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ron_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on ron_recordings" ON public.ron_recordings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own ron_recordings" ON public.ron_recordings
  FOR SELECT USING (auth.uid() = created_by);

CREATE TRIGGER trg_ron_recordings_updated
  BEFORE UPDATE ON public.ron_recordings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-set 10-year retention per Ohio ORC §147.63
CREATE TRIGGER trg_ron_recordings_retention
  BEFORE INSERT ON public.ron_recordings
  FOR EACH ROW EXECUTE FUNCTION public.set_retention_expires_at();

-- Loan Signing Packages
CREATE TABLE public.loan_signing_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  client_id UUID NOT NULL,
  title_company TEXT,
  lender_name TEXT,
  package_type TEXT NOT NULL DEFAULT 'purchase',
  document_count INTEGER NOT NULL DEFAULT 0,
  scanback_required BOOLEAN NOT NULL DEFAULT false,
  scanback_deadline TIMESTAMPTZ,
  fee NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.loan_signing_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on loan_signing_packages" ON public.loan_signing_packages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own loan_signing_packages" ON public.loan_signing_packages
  FOR SELECT USING (auth.uid() = client_id);

CREATE TRIGGER trg_loan_signing_packages_updated
  BEFORE UPDATE ON public.loan_signing_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Scanback Tracking
CREATE TABLE public.scanback_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.loan_signing_packages(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  page_count INTEGER,
  scan_status TEXT NOT NULL DEFAULT 'pending',
  scanned_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  tracking_number TEXT,
  shipping_carrier TEXT,
  delivery_confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scanback_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on scanback_tracking" ON public.scanback_tracking
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own scanback_tracking" ON public.scanback_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.loan_signing_packages lsp
      WHERE lsp.id = package_id AND lsp.client_id = auth.uid()
    )
  );

CREATE TRIGGER trg_scanback_tracking_updated
  BEFORE UPDATE ON public.scanback_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- I-9 Verifications
CREATE TABLE public.i9_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  client_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  employer_name TEXT,
  employer_address TEXT,
  section_completed TEXT NOT NULL DEFAULT 'section_2',
  document_list_a TEXT[],
  document_list_b TEXT[],
  document_list_c TEXT[],
  verification_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  notary_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.i9_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on i9_verifications" ON public.i9_verifications
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own i9_verifications" ON public.i9_verifications
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Users create own i9_verifications" ON public.i9_verifications
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE TRIGGER trg_i9_verifications_updated
  BEFORE UPDATE ON public.i9_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Print Jobs
CREATE TABLE public.print_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  file_path TEXT,
  file_name TEXT NOT NULL,
  page_count INTEGER NOT NULL DEFAULT 1,
  copies INTEGER NOT NULL DEFAULT 1,
  color BOOLEAN NOT NULL DEFAULT false,
  double_sided BOOLEAN NOT NULL DEFAULT false,
  binding_type TEXT,
  paper_size TEXT NOT NULL DEFAULT 'letter',
  price NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'queued',
  priority TEXT NOT NULL DEFAULT 'normal',
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on print_jobs" ON public.print_jobs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own print_jobs" ON public.print_jobs
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Users create own print_jobs" ON public.print_jobs
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE TRIGGER trg_print_jobs_updated
  BEFORE UPDATE ON public.print_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Performance indexes
CREATE INDEX idx_ron_recordings_session ON public.ron_recordings(session_id);
CREATE INDEX idx_loan_signing_packages_appointment ON public.loan_signing_packages(appointment_id);
CREATE INDEX idx_loan_signing_packages_status ON public.loan_signing_packages(status);
CREATE INDEX idx_scanback_tracking_package ON public.scanback_tracking(package_id);
CREATE INDEX idx_i9_verifications_client ON public.i9_verifications(client_id);
CREATE INDEX idx_print_jobs_client ON public.print_jobs(client_id);
CREATE INDEX idx_print_jobs_status ON public.print_jobs(status);
