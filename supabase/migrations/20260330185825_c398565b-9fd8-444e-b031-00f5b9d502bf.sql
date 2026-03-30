
-- Create email_cache table for IONOS email caching
CREATE TABLE public.email_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text UNIQUE NOT NULL,
  folder text NOT NULL DEFAULT 'inbox',
  from_address text,
  from_name text,
  to_addresses jsonb DEFAULT '[]'::jsonb,
  cc_addresses jsonb DEFAULT '[]'::jsonb,
  bcc_addresses jsonb DEFAULT '[]'::jsonb,
  subject text,
  body_text text,
  body_html text,
  date timestamptz,
  is_read boolean DEFAULT false,
  is_starred boolean DEFAULT false,
  has_attachments boolean DEFAULT false,
  attachments jsonb DEFAULT '[]'::jsonb,
  in_reply_to text,
  "references" text,
  labels text[] DEFAULT '{}',
  synced_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email cache" ON public.email_cache
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_email_cache_folder ON public.email_cache(folder);
CREATE INDEX idx_email_cache_date ON public.email_cache(date DESC);
CREATE INDEX idx_email_cache_from ON public.email_cache(from_address);

-- Create email_drafts table
CREATE TABLE public.email_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  to_addresses jsonb DEFAULT '[]'::jsonb,
  cc_addresses jsonb DEFAULT '[]'::jsonb,
  subject text DEFAULT '',
  body_html text DEFAULT '',
  attachments jsonb DEFAULT '[]'::jsonb,
  in_reply_to text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own drafts" ON public.email_drafts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_email_drafts_updated_at
  BEFORE UPDATE ON public.email_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create email_signatures table
CREATE TABLE public.email_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Default',
  signature_html text DEFAULT '',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own signatures" ON public.email_signatures
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert 14 new services
INSERT INTO public.services (name, category, price_from, price_to, pricing_model, short_description, icon, is_active, display_order) VALUES
  ('Data Entry', 'admin_support', 50, 150, 'flat', 'Accurate data input into spreadsheets, CRMs, or databases', 'ClipboardList', true, 100),
  ('Travel Arrangements', 'admin_support', 100, 300, 'flat', 'Complete travel planning including flights, hotels, and itineraries', 'Plane', true, 101),
  ('Blog Post Writing', 'content_creation', 150, 400, 'flat', 'SEO-optimized blog posts up to 1500 words', 'FileEdit', true, 102),
  ('Social Media Content', 'content_creation', 120, 350, 'flat', 'Pack of 10 engaging social media posts with graphics', 'Paintbrush', true, 103),
  ('Newsletter Design', 'content_creation', 125, 375, 'flat', 'Professional email newsletter design and copywriting', 'Layout', true, 104),
  ('Market Research Report', 'research', 200, 500, 'flat', 'Comprehensive market analysis and competitor research', 'Search', true, 105),
  ('Lead Generation', 'research', 150, 400, 'flat', 'Targeted lead list with 50 qualified prospects', 'Search', true, 106),
  ('Email Support Handling', 'customer_service', 80, 250, 'flat', 'Process and respond to customer support emails', 'Mail', true, 107),
  ('Live Chat Support', 'customer_service', 100, 100, 'per_hour', '4 hours of live chat customer support coverage', 'MessageSquare', true, 108),
  ('Website Content Updates', 'technical_support', 75, 200, 'flat', 'Update text, images, and content on existing pages', 'Code', true, 109),
  ('UX Audit & Heuristic Review', 'ux_testing', 250, 600, 'flat', 'Expert review of UI patterns, accessibility, and usability', 'Eye', true, 110),
  ('User Flow & Workflow Testing', 'ux_testing', 200, 500, 'flat', 'End-to-end testing of user journeys and task completion', 'Workflow', true, 111),
  ('Usability Testing & Report', 'ux_testing', 300, 700, 'flat', 'Moderated usability sessions with findings report', 'ClipboardCheck', true, 112),
  ('UX Research & Persona Development', 'ux_testing', 350, 800, 'flat', 'User research, interviews, and persona creation', 'Users', true, 113)
ON CONFLICT DO NOTHING;
