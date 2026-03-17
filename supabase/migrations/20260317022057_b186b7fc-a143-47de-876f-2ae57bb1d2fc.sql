
-- Apostille requests table
CREATE TABLE public.apostille_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  document_description text NOT NULL,
  status text NOT NULL DEFAULT 'intake',
  tracking_number text,
  shipping_label_url text,
  notes text,
  fee numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.apostille_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage apostille" ON public.apostille_requests FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients view own apostille" ON public.apostille_requests FOR SELECT TO public USING (auth.uid() = client_id);
CREATE POLICY "Clients create apostille" ON public.apostille_requests FOR INSERT TO public WITH CHECK (auth.uid() = client_id);

-- Chat messages table with realtime
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  message text NOT NULL,
  attachment_url text,
  is_admin boolean DEFAULT false,
  read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage chat" ON public.chat_messages FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own chat" ON public.chat_messages FOR SELECT TO public USING (auth.uid() = sender_id);
CREATE POLICY "Users send chat" ON public.chat_messages FOR INSERT TO public WITH CHECK (auth.uid() = sender_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Business profiles table
CREATE TABLE public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  ein text,
  business_type text,
  verification_status text NOT NULL DEFAULT 'pending',
  articles_file_path text,
  authorized_signers jsonb DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage business" ON public.business_profiles FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners view business" ON public.business_profiles FOR SELECT TO public USING (auth.uid() = created_by);
CREATE POLICY "Users create business" ON public.business_profiles FOR INSERT TO public WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners update business" ON public.business_profiles FOR UPDATE TO public USING (auth.uid() = created_by);

-- Business members table
CREATE TABLE public.business_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  member_role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage members" ON public.business_members FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Members view own" ON public.business_members FOR SELECT TO public USING (auth.uid() = user_id);

-- Document bundles table
CREATE TABLE public.document_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  bundle_type text NOT NULL,
  document_list jsonb NOT NULL DEFAULT '[]'::jsonb,
  price numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.document_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view bundles" ON public.document_bundles FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins manage bundles" ON public.document_bundles FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

-- Insert default platform settings for pricing
INSERT INTO public.platform_settings (setting_key, setting_value, description) VALUES
  ('rush_fee', '35', 'Rush/priority appointment surcharge'),
  ('after_hours_fee', '25', 'After-hours appointment surcharge'),
  ('witness_fee', '10', 'Per-witness fee'),
  ('apostille_fee', '75', 'Apostille processing fee')
ON CONFLICT DO NOTHING;

-- Insert default document bundles
INSERT INTO public.document_bundles (name, description, bundle_type, document_list, price) VALUES
  ('Real Estate Closing Packet', 'Complete document set for residential real estate closings', 'real_estate', '["Warranty Deed", "Mortgage Note", "Settlement Statement", "Title Affidavit", "Compliance Agreement"]'::jsonb, 150),
  ('Estate Planning Bundle', 'Essential estate planning documents organized and prepared', 'estate_planning', '["Last Will & Testament", "Healthcare Power of Attorney", "Financial Power of Attorney", "Living Will / Advance Directive"]'::jsonb, 100),
  ('Business Formation Set', 'Documents needed for forming a new business entity', 'business_formation', '["Articles of Incorporation/Organization", "Operating Agreement", "EIN Application", "Initial Resolutions", "Registered Agent Acceptance"]'::jsonb, 125);
