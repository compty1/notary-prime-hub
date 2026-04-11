-- Create secure public view for notary pages (excludes phone, email, sensitive fields)
CREATE OR REPLACE VIEW public.notary_pages_public AS
SELECT
  id, user_id, display_name, slug, title, tagline, bio,
  profile_photo_path, cover_photo_path, is_published, is_featured,
  created_at, updated_at, services_offered, service_areas,
  credentials, theme_color, accent_color, font_family,
  use_platform_booking, external_booking_url, social_links,
  seo_title, seo_description, nav_services, gallery_photos,
  professional_type, website_url
FROM public.notary_pages
WHERE is_published = true;

-- Fix platform_settings: Remove anonymous read access
DROP POLICY IF EXISTS "Anyone can read non-secret settings" ON public.platform_settings;

CREATE POLICY "Only admins can read platform settings"
ON public.platform_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix feedback: Restrict authenticated users to own feedback only
DROP POLICY IF EXISTS "Authenticated users can view all feedback" ON public.feedback;

CREATE POLICY "Users can view own feedback"
ON public.feedback FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
ON public.feedback FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix storage: Restrict notary-pages uploads to own user path
DROP POLICY IF EXISTS "Authenticated upload notary page assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update notary page assets" ON storage.objects;

CREATE POLICY "Users upload own notary page assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'notary-pages'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users update own notary page assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'notary-pages'
  AND (storage.foldername(name))[2] = auth.uid()::text
);