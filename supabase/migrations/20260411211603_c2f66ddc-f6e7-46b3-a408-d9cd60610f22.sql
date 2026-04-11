
-- Phase 4: Recorder Filings
CREATE TABLE public.recorder_filings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  document_description TEXT NOT NULL,
  county TEXT,
  recording_type TEXT NOT NULL DEFAULT 'deed',
  recording_number TEXT,
  recording_date DATE,
  fee NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pending',
  filed_by TEXT,
  file_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recorder_filings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_recorder_filings" ON public.recorder_filings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users_read_own_recorder_filings" ON public.recorder_filings FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "users_insert_own_recorder_filings" ON public.recorder_filings FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE TRIGGER trg_recorder_filings_updated BEFORE UPDATE ON public.recorder_filings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_recorder_filings_client ON public.recorder_filings(client_id);
CREATE INDEX idx_recorder_filings_status ON public.recorder_filings(status);

-- Phase 4: SOS Filings
CREATE TABLE public.sos_filings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  filing_type TEXT NOT NULL DEFAULT 'formation',
  entity_name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'OH',
  filing_number TEXT,
  filing_date DATE,
  fee NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pending',
  confirmation_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sos_filings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_sos_filings" ON public.sos_filings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users_read_own_sos_filings" ON public.sos_filings FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "users_insert_own_sos_filings" ON public.sos_filings FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE TRIGGER trg_sos_filings_updated BEFORE UPDATE ON public.sos_filings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_sos_filings_client ON public.sos_filings(client_id);
CREATE INDEX idx_sos_filings_status ON public.sos_filings(status);

-- Phase 4: Real Estate Services (unified)
CREATE TABLE public.real_estate_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  service_subtype TEXT NOT NULL DEFAULT 'photography',
  property_address TEXT NOT NULL,
  scheduled_date DATE,
  scheduled_time TEXT,
  fee NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pending',
  details JSONB DEFAULT '{}',
  photos TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.real_estate_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_real_estate" ON public.real_estate_services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users_read_own_real_estate" ON public.real_estate_services FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "users_insert_own_real_estate" ON public.real_estate_services FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE TRIGGER trg_real_estate_updated BEFORE UPDATE ON public.real_estate_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_real_estate_client ON public.real_estate_services(client_id);
CREATE INDEX idx_real_estate_subtype ON public.real_estate_services(service_subtype);

-- Phase 4: Print Orders
CREATE TABLE public.print_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  specifications JSONB DEFAULT '{}',
  unit_price NUMERIC(10,2),
  total_price NUMERIC(10,2),
  vendor_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  shipping_tracking TEXT,
  design_file_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.print_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_print_orders" ON public.print_orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users_read_own_print_orders" ON public.print_orders FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "users_insert_own_print_orders" ON public.print_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE TRIGGER trg_print_orders_updated BEFORE UPDATE ON public.print_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_print_orders_client ON public.print_orders(client_id);
CREATE INDEX idx_print_orders_status ON public.print_orders(status);

-- Phase 4: Print Products
CREATE TABLE public.print_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  options JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.print_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_print_products" ON public.print_products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "public_read_print_products" ON public.print_products FOR SELECT TO authenticated USING (is_active = true);
CREATE TRIGGER trg_print_products_updated BEFORE UPDATE ON public.print_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Phase 4: Print Vendors
CREATE TABLE public.print_vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  specialties TEXT[],
  turnaround_days INTEGER DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.print_vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_print_vendors" ON public.print_vendors FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_print_vendors_updated BEFORE UPDATE ON public.print_vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Phase 5: Court Form Jobs
CREATE TABLE public.court_form_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  form_name TEXT NOT NULL,
  court_name TEXT,
  county TEXT,
  case_number TEXT,
  fee NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pending',
  upl_disclaimer_accepted BOOLEAN NOT NULL DEFAULT false,
  completed_file_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.court_form_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_court_form_jobs" ON public.court_form_jobs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users_read_own_court_forms" ON public.court_form_jobs FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "users_insert_own_court_forms" ON public.court_form_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE TRIGGER trg_court_form_jobs_updated BEFORE UPDATE ON public.court_form_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_court_form_jobs_client ON public.court_form_jobs(client_id);
CREATE INDEX idx_court_form_jobs_status ON public.court_form_jobs(status);

-- Phase 5: Permit Filings
CREATE TABLE public.permit_filings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  permit_type TEXT NOT NULL,
  jurisdiction TEXT,
  business_name TEXT,
  filing_date DATE,
  fee NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pending',
  permit_number TEXT,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.permit_filings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_permit_filings" ON public.permit_filings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users_read_own_permit_filings" ON public.permit_filings FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "users_insert_own_permit_filings" ON public.permit_filings FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE TRIGGER trg_permit_filings_updated BEFORE UPDATE ON public.permit_filings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_permit_filings_client ON public.permit_filings(client_id);

-- Phase 5: Compliance Calendars
CREATE TABLE public.compliance_calendars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  calendar_name TEXT NOT NULL,
  entity_name TEXT,
  entries JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_calendars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_compliance_calendars" ON public.compliance_calendars FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users_read_own_compliance_calendars" ON public.compliance_calendars FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "users_insert_own_compliance_calendars" ON public.compliance_calendars FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE TRIGGER trg_compliance_calendars_updated BEFORE UPDATE ON public.compliance_calendars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_compliance_calendars_client ON public.compliance_calendars(client_id);

-- Add FK from print_orders to print_vendors
ALTER TABLE public.print_orders ADD CONSTRAINT print_orders_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.print_vendors(id);
