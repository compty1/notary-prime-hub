
-- DocuDex document storage
CREATE TABLE IF NOT EXISTS public.docudex_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  page_size TEXT NOT NULL DEFAULT 'letter',
  font_family TEXT DEFAULT 'sans',
  margins JSONB DEFAULT '{"top":48,"right":48,"bottom":48,"left":48}'::jsonb,
  header_html TEXT DEFAULT '',
  footer_html TEXT DEFAULT '',
  watermark TEXT DEFAULT 'none',
  is_template BOOLEAN NOT NULL DEFAULT false,
  template_category TEXT,
  thumbnail_url TEXT,
  document_hash TEXT,
  last_auto_saved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.docudex_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.docudex_documents(id) ON DELETE CASCADE NOT NULL,
  version_number INT NOT NULL DEFAULT 1,
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  label TEXT DEFAULT 'Auto-save',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.docudex_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.docudex_documents(id) ON DELETE CASCADE NOT NULL,
  shared_with_email TEXT NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.docudex_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.docudex_documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  page_index INT NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  position JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.docudex_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'custom',
  icon TEXT DEFAULT '📄',
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT false,
  use_count INT NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.print_vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  api_type TEXT,
  capabilities JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  contact_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enhance existing print_products
ALTER TABLE public.print_products ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE public.print_products ADD COLUMN IF NOT EXISTS price_tiers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.print_products ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.print_products ADD COLUMN IF NOT EXISTS min_quantity INT DEFAULT 1;
ALTER TABLE public.print_products ADD COLUMN IF NOT EXISTS turnaround_days INT DEFAULT 5;
ALTER TABLE public.print_products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.print_products ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_docudex_documents_user ON public.docudex_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_docudex_versions_doc ON public.docudex_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_docudex_shares_doc ON public.docudex_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_docudex_comments_doc ON public.docudex_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_print_products_category ON public.print_products(category);

-- Triggers
CREATE OR REPLACE TRIGGER trg_docudex_documents_updated BEFORE UPDATE ON public.docudex_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_docudex_templates_updated BEFORE UPDATE ON public.docudex_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.docudex_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docudex_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docudex_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docudex_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docudex_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_vendors ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users manage own documents" ON public.docudex_documents FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own doc versions" ON public.docudex_versions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.docudex_documents d WHERE d.id = document_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.docudex_documents d WHERE d.id = document_id AND d.user_id = auth.uid()));

CREATE POLICY "Doc owner manages shares" ON public.docudex_shares FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.docudex_documents d WHERE d.id = document_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.docudex_documents d WHERE d.id = document_id AND d.user_id = auth.uid()));

CREATE POLICY "Doc participants manage comments" ON public.docudex_comments FOR ALL TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.docudex_documents d WHERE d.id = document_id AND d.user_id = auth.uid()))
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone reads public templates" ON public.docudex_templates FOR SELECT TO authenticated USING (is_public = true OR created_by = auth.uid());
CREATE POLICY "Users manage own templates" ON public.docudex_templates FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users update own templates" ON public.docudex_templates FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Users delete own templates" ON public.docudex_templates FOR DELETE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Admins manage vendors" ON public.print_vendors FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
