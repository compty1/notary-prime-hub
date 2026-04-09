
-- Create notary_pages table
CREATE TABLE public.notary_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  title TEXT DEFAULT '',
  tagline TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  profile_photo_path TEXT,
  cover_photo_path TEXT,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  website_url TEXT DEFAULT '',
  service_areas JSONB DEFAULT '[]'::jsonb,
  services_offered JSONB DEFAULT '[]'::jsonb,
  credentials JSONB DEFAULT '{}'::jsonb,
  theme_color TEXT DEFAULT '#eab308',
  custom_css TEXT DEFAULT '',
  signing_platform_url TEXT DEFAULT '',
  use_platform_booking BOOLEAN DEFAULT true,
  external_booking_url TEXT DEFAULT '',
  social_links JSONB DEFAULT '{}'::jsonb,
  seo_title TEXT DEFAULT '',
  seo_description TEXT DEFAULT '',
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for slug lookups
CREATE UNIQUE INDEX idx_notary_pages_slug ON public.notary_pages (slug);
CREATE INDEX idx_notary_pages_user_id ON public.notary_pages (user_id);
CREATE INDEX idx_notary_pages_published ON public.notary_pages (is_published) WHERE is_published = true;

-- Enable RLS
ALTER TABLE public.notary_pages ENABLE ROW LEVEL SECURITY;

-- Public can view published pages
CREATE POLICY "Published notary pages are publicly visible"
ON public.notary_pages
FOR SELECT
USING (is_published = true);

-- Notary can view their own page (even if unpublished)
CREATE POLICY "Notaries can view their own page"
ON public.notary_pages
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Notary can update their own page
CREATE POLICY "Notaries can update their own page"
ON public.notary_pages
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admin full access (select)
CREATE POLICY "Admins can view all notary pages"
ON public.notary_pages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin full access (insert)
CREATE POLICY "Admins can create notary pages"
ON public.notary_pages
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin full access (update)
CREATE POLICY "Admins can update any notary page"
ON public.notary_pages
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin full access (delete)
CREATE POLICY "Admins can delete notary pages"
ON public.notary_pages
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update timestamp trigger
CREATE TRIGGER update_notary_pages_updated_at
BEFORE UPDATE ON public.notary_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
