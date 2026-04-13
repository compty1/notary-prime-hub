
-- Sprint 1 Migration: Cross-service wiring tables

-- 1. cross_sell_rules
CREATE TABLE public.cross_sell_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_service_type TEXT NOT NULL,
  recommended_service_type TEXT NOT NULL,
  relevance_score INTEGER NOT NULL DEFAULT 50,
  display_message TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cross_sell_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage cross_sell_rules" ON public.cross_sell_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can read active cross_sell_rules" ON public.cross_sell_rules FOR SELECT TO authenticated USING (is_active = true);
CREATE TRIGGER update_cross_sell_rules_updated_at BEFORE UPDATE ON public.cross_sell_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. travel_zones
CREATE TABLE public.travel_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_name TEXT NOT NULL,
  min_miles NUMERIC(6,1) NOT NULL DEFAULT 0,
  max_miles NUMERIC(6,1),
  fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.travel_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read travel_zones" ON public.travel_zones FOR SELECT USING (true);
CREATE POLICY "Admins can manage travel_zones" ON public.travel_zones FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_travel_zones_updated_at BEFORE UPDATE ON public.travel_zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. oath_records
CREATE TABLE public.oath_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  oath_type TEXT NOT NULL DEFAULT 'oath' CHECK (oath_type IN ('oath', 'affirmation')),
  statutory_text TEXT,
  administered_by UUID,
  administered_at TIMESTAMPTZ,
  journal_entry_id UUID,
  document_description TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.oath_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own oath_records" ON public.oath_records FOR SELECT TO authenticated USING (client_id = auth.uid());
CREATE POLICY "Admins can manage oath_records" ON public.oath_records FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_oath_records_updated_at BEFORE UPDATE ON public.oath_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. certified_copies
CREATE TABLE public.certified_copies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  original_document_id UUID REFERENCES public.documents(id),
  copy_count INTEGER NOT NULL DEFAULT 1,
  fee_per_copy NUMERIC(10,2) NOT NULL DEFAULT 5.00,
  total_fee NUMERIC(10,2) NOT NULL DEFAULT 5.00,
  certification_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.certified_copies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own certified_copies" ON public.certified_copies FOR SELECT TO authenticated USING (client_id = auth.uid());
CREATE POLICY "Admins can manage certified_copies" ON public.certified_copies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_certified_copies_updated_at BEFORE UPDATE ON public.certified_copies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. country_requirements
CREATE TABLE public.country_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  apostille_accepted BOOLEAN NOT NULL DEFAULT false,
  legalization_required BOOLEAN NOT NULL DEFAULT false,
  consulate_info TEXT,
  required_documents TEXT[],
  processing_notes TEXT,
  estimated_days INTEGER,
  fee_range_min NUMERIC(10,2),
  fee_range_max NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.country_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read country_requirements" ON public.country_requirements FOR SELECT USING (true);
CREATE POLICY "Admins can manage country_requirements" ON public.country_requirements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_country_requirements_updated_at BEFORE UPDATE ON public.country_requirements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. passport_photo_jobs
CREATE TABLE public.passport_photo_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  photo_count INTEGER NOT NULL DEFAULT 2,
  country_standard TEXT NOT NULL DEFAULT 'US',
  digital_delivery BOOLEAN NOT NULL DEFAULT true,
  print_delivery BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  fee NUMERIC(10,2) NOT NULL DEFAULT 15.00,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.passport_photo_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own passport_photo_jobs" ON public.passport_photo_jobs FOR SELECT TO authenticated USING (client_id = auth.uid());
CREATE POLICY "Users can create own passport_photo_jobs" ON public.passport_photo_jobs FOR INSERT TO authenticated WITH CHECK (client_id = auth.uid());
CREATE POLICY "Admins can manage passport_photo_jobs" ON public.passport_photo_jobs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_passport_photo_jobs_updated_at BEFORE UPDATE ON public.passport_photo_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. interpreter_sessions
CREATE TABLE public.interpreter_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  language_from TEXT NOT NULL DEFAULT 'English',
  language_to TEXT NOT NULL,
  interpreter_name TEXT,
  session_date DATE,
  duration_minutes INTEGER,
  fee NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interpreter_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own interpreter_sessions" ON public.interpreter_sessions FOR SELECT TO authenticated USING (client_id = auth.uid());
CREATE POLICY "Users can create own interpreter_sessions" ON public.interpreter_sessions FOR INSERT TO authenticated WITH CHECK (client_id = auth.uid());
CREATE POLICY "Admins can manage interpreter_sessions" ON public.interpreter_sessions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_interpreter_sessions_updated_at BEFORE UPDATE ON public.interpreter_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_cross_sell_trigger ON public.cross_sell_rules(trigger_service_type) WHERE is_active = true;
CREATE INDEX idx_travel_zones_miles ON public.travel_zones(min_miles, max_miles) WHERE is_active = true;
CREATE INDEX idx_oath_records_client ON public.oath_records(client_id);
CREATE INDEX idx_certified_copies_client ON public.certified_copies(client_id);
CREATE INDEX idx_country_requirements_code ON public.country_requirements(country_code);
CREATE INDEX idx_passport_photo_jobs_client ON public.passport_photo_jobs(client_id);
CREATE INDEX idx_interpreter_sessions_client ON public.interpreter_sessions(client_id);
