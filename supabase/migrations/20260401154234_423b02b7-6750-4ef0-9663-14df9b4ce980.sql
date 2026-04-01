
-- New tables for AI Services Suite

-- 1. Client style profiles for style-match drafting
CREATE TABLE public.client_style_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_name text NOT NULL DEFAULT 'Default',
  sample_texts text[] NOT NULL DEFAULT '{}',
  style_analysis jsonb DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_style_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own style profiles" ON public.client_style_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all style profiles" ON public.client_style_profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER set_updated_at_client_style_profiles BEFORE UPDATE ON public.client_style_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Document collections for cross-document synthesis
CREATE TABLE public.document_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  document_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.document_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own collections" ON public.document_collections FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all collections" ON public.document_collections FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER set_updated_at_document_collections BEFORE UPDATE ON public.document_collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Proposals table for tracking generated proposals
CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  title text NOT NULL,
  content_html text NOT NULL DEFAULT '',
  template_type text NOT NULL DEFAULT 'standard',
  status text NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  branding jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own proposals" ON public.proposals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all proposals" ON public.proposals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER set_updated_at_proposals BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Compliance rule sets
CREATE TABLE public.compliance_rule_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  rules jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_rule_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage rule sets" ON public.compliance_rule_sets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated view active rule sets" ON public.compliance_rule_sets FOR SELECT TO authenticated USING (is_active = true);
CREATE TRIGGER set_updated_at_compliance_rule_sets BEFORE UPDATE ON public.compliance_rule_sets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Performance indexes on leads table
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads (source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads (email) WHERE email IS NOT NULL;

-- 6. Performance indexes on appointments table
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON public.appointments (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments (client_id);
