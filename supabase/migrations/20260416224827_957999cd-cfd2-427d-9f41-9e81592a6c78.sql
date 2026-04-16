-- A-01: REVIEWS — opt-in public reviews via safe view
DROP POLICY IF EXISTS "Public view reviews anonymized" ON public.reviews;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS display_name text;

DROP POLICY IF EXISTS "Public can view opted-in reviews" ON public.reviews;
CREATE POLICY "Public can view opted-in reviews"
ON public.reviews FOR SELECT TO anon, authenticated
USING (is_public = true);

DROP VIEW IF EXISTS public.reviews_public;
CREATE VIEW public.reviews_public AS
SELECT id, COALESCE(display_name, 'Verified Client') AS reviewer_name,
       rating, comment, notary_id, created_at
FROM public.reviews WHERE is_public = true;
GRANT SELECT ON public.reviews_public TO anon, authenticated;

-- A-02: VENDORS — admin-only
DROP POLICY IF EXISTS "Vendors are publicly readable" ON public.vendors;
DROP POLICY IF EXISTS "Admins read vendors" ON public.vendors;
CREATE POLICY "Admins read vendors" ON public.vendors FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- A-03: VENDOR_PRODUCTS — admin-only
DROP POLICY IF EXISTS "Authenticated users can view active vendor products" ON public.vendor_products;
DROP POLICY IF EXISTS "Admins read vendor products" ON public.vendor_products;
CREATE POLICY "Admins read vendor products" ON public.vendor_products FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- A-04: PLATFORM_SETTINGS — allowlist
DROP POLICY IF EXISTS "Anon can read non-sensitive settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Authenticated can read non-sensitive settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Anon read public-allowlisted settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Authenticated read public+own settings" ON public.platform_settings;

CREATE POLICY "Anon read public-allowlisted settings"
ON public.platform_settings FOR SELECT TO anon
USING (setting_key = ANY (ARRAY[
  'site_name','site_tagline','site_logo_url','site_favicon_url',
  'brand_primary_color','brand_secondary_color','brand_accent_color',
  'business_name','business_phone_public','business_email_public',
  'support_email','meta_description','meta_keywords',
  'social_facebook','social_twitter','social_linkedin','social_instagram',
  'service_area_label','service_area_radius_miles',
  'business_hours_label','timezone',
  'min_booking_lead_hours','max_booking_advance_days',
  'cancellation_policy_text','terms_url','privacy_url'
]));

CREATE POLICY "Authenticated read public+own settings"
ON public.platform_settings FOR SELECT TO authenticated
USING (
  setting_key = ANY (ARRAY[
    'site_name','site_tagline','site_logo_url','site_favicon_url',
    'brand_primary_color','brand_secondary_color','brand_accent_color',
    'business_name','business_phone_public','business_email_public',
    'support_email','meta_description','meta_keywords',
    'social_facebook','social_twitter','social_linkedin','social_instagram',
    'service_area_label','service_area_radius_miles',
    'business_hours_label','timezone',
    'min_booking_lead_hours','max_booking_advance_days',
    'cancellation_policy_text','terms_url','privacy_url',
    'shop_enabled','directory_enabled','lead_capture_enabled'
  ]) OR has_role(auth.uid(), 'admin'::app_role)
);

-- A-05: REALTIME — scope channel subscriptions
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users subscribe to own channels only" ON realtime.messages;
CREATE POLICY "Users subscribe to own channels only"
ON realtime.messages FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (realtime.topic() LIKE auth.uid()::text || ':%')
  OR (realtime.topic() = auth.uid()::text)
  OR (realtime.topic() LIKE 'public:%')
);

DROP POLICY IF EXISTS "Users send to own channels only" ON realtime.messages;
CREATE POLICY "Users send to own channels only"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (realtime.topic() LIKE auth.uid()::text || ':%')
  OR (realtime.topic() = auth.uid()::text)
);

-- A-46..60: Extend pricing_rules with per-service columns + seed
ALTER TABLE public.pricing_rules ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id) ON DELETE CASCADE;
ALTER TABLE public.pricing_rules ADD COLUMN IF NOT EXISTS service_name text;
ALTER TABLE public.pricing_rules ADD COLUMN IF NOT EXISTS base_price numeric(10,2) DEFAULT 0;
ALTER TABLE public.pricing_rules ADD COLUMN IF NOT EXISTS per_signer_fee numeric(10,2) DEFAULT 0;
ALTER TABLE public.pricing_rules ADD COLUMN IF NOT EXISTS travel_fee numeric(10,2) DEFAULT 0;
ALTER TABLE public.pricing_rules ADD COLUMN IF NOT EXISTS rush_fee numeric(10,2) DEFAULT 0;
ALTER TABLE public.pricing_rules ADD COLUMN IF NOT EXISTS after_hours_fee numeric(10,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_pricing_rules_service_id ON public.pricing_rules(service_id);

INSERT INTO public.pricing_rules (
  name, rule_type, service_id, service_name, base_price,
  per_signer_fee, travel_fee, rush_fee, after_hours_fee, is_active
)
SELECT
  s.name || ' - Base Pricing',
  'service_price',
  s.id,
  s.name,
  COALESCE(s.price_from, 0),
  CASE WHEN s.category = 'notarization' THEN 5.00
       WHEN s.category = 'real_estate' THEN 25.00
       ELSE 0 END,
  CASE WHEN s.category IN ('notarization','real_estate','real_estate_support') THEN 0.65
       ELSE 0 END,
  ROUND(COALESCE(s.price_from, 0) * 0.25, 2),
  ROUND(COALESCE(s.price_from, 0) * 0.30, 2),
  true
FROM public.services s
WHERE NOT EXISTS (
  SELECT 1 FROM public.pricing_rules pr WHERE pr.service_id = s.id
);
