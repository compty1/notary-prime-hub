
-- ============================================================
-- Enterprise Tools: 8 tables + 1 storage bucket
-- ============================================================

-- 1. ai_document_grades
CREATE TABLE public.ai_document_grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_name TEXT NOT NULL,
  document_type TEXT,
  overall_score INTEGER,
  grade_letter TEXT,
  findings JSONB DEFAULT '[]'::jsonb,
  compliance_standard TEXT DEFAULT 'ohio_orc_147',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_document_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own grades" ON public.ai_document_grades FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_ai_document_grades_user ON public.ai_document_grades (user_id, created_at DESC);

-- 2. ofac_sdn_list
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE TABLE public.ofac_sdn_list (
  id SERIAL PRIMARY KEY,
  entry_id TEXT UNIQUE,
  sdn_name TEXT NOT NULL,
  sdn_type TEXT,
  program TEXT,
  title TEXT,
  remarks TEXT,
  addresses JSONB DEFAULT '[]'::jsonb,
  aliases JSONB DEFAULT '[]'::jsonb,
  last_synced_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ofac_sdn_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can search OFAC" ON public.ofac_sdn_list FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_ofac_sdn_name_trgm ON public.ofac_sdn_list USING GIN (sdn_name gin_trgm_ops);

-- 3. construction_projects
CREATE TABLE public.construction_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  property_address TEXT,
  owner_name TEXT,
  general_contractor TEXT,
  contract_amount NUMERIC(12,2),
  start_date DATE,
  estimated_completion DATE,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.construction_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own projects" ON public.construction_projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_construction_projects_user ON public.construction_projects (user_id);
CREATE TRIGGER update_construction_projects_updated_at BEFORE UPDATE ON public.construction_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. lien_waivers
CREATE TABLE public.lien_waivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.construction_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  waiver_type TEXT NOT NULL,
  claimant_name TEXT NOT NULL,
  amount NUMERIC(12,2),
  through_date DATE,
  document_url TEXT,
  status TEXT DEFAULT 'draft',
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lien_waivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own waivers" ON public.lien_waivers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_lien_waivers_project ON public.lien_waivers (project_id);

-- 5. trust_documents
CREATE TABLE public.trust_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trust_name TEXT NOT NULL,
  trust_type TEXT,
  grantor_name TEXT,
  trustee_name TEXT,
  date_established DATE,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trust_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own trusts" ON public.trust_documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_trust_documents_user ON public.trust_documents (user_id);
CREATE TRIGGER update_trust_documents_updated_at BEFORE UPDATE ON public.trust_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. trust_assets
CREATE TABLE public.trust_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trust_id UUID REFERENCES public.trust_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_value NUMERIC(14,2),
  account_number TEXT,
  institution TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trust_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own assets" ON public.trust_assets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_trust_assets_trust ON public.trust_assets (trust_id);

-- 7. bulk_dispatch_requests
CREATE TABLE public.bulk_dispatch_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT,
  batch_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  processed_rows INTEGER NOT NULL DEFAULT 0,
  failed_rows INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  source_data JSONB,
  error_log JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bulk_dispatch_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own batches" ON public.bulk_dispatch_requests FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_bulk_dispatch_user_status ON public.bulk_dispatch_requests (user_id, status);
CREATE TRIGGER update_bulk_dispatch_updated_at BEFORE UPDATE ON public.bulk_dispatch_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. client_brand_kits
CREATE TABLE public.client_brand_kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  logo_path TEXT,
  primary_color TEXT DEFAULT '#1a1a2e',
  secondary_color TEXT DEFAULT '#e94560',
  font_family TEXT DEFAULT 'Inter',
  tagline TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_brand_kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own brand kits" ON public.client_brand_kits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_brand_kits_updated_at BEFORE UPDATE ON public.client_brand_kits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('compliance_documents', 'compliance_documents', false);
CREATE POLICY "Users can upload compliance docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'compliance_documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own compliance docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'compliance_documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own compliance docs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'compliance_documents' AND auth.uid()::text = (storage.foldername(name))[1]);
