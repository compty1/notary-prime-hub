
-- User Signatures table
CREATE TABLE public.user_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Signature',
  font_family TEXT,
  style_config JSONB DEFAULT '{}'::jsonb,
  image_path TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own signatures" ON public.user_signatures FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Grants table
CREATE TABLE public.grants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content JSONB DEFAULT '{}'::jsonb,
  grant_type TEXT DEFAULT 'general',
  status TEXT DEFAULT 'draft',
  template_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own grants" ON public.grants FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Grant Templates table
CREATE TABLE public.grant_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_content JSONB DEFAULT '{}'::jsonb,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.grant_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active templates" ON public.grant_templates FOR SELECT TO authenticated USING (is_active = true);

-- Resumes table
CREATE TABLE public.resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Resume',
  template_id TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own resumes" ON public.resumes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Cover Letters table
CREATE TABLE public.cover_letters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Cover Letter',
  job_title TEXT,
  company TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cover letters" ON public.cover_letters FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Signatures storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('signatures', 'signatures', false, 5242880, ARRAY['image/png', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own signatures" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'signatures' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users read own signatures" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'signatures' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own signatures" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'signatures' AND (storage.foldername(name))[1] = auth.uid()::text);
