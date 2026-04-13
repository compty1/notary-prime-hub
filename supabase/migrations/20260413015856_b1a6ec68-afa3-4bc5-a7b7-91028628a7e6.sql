
-- DM-001: Notary Pages enhancements
ALTER TABLE public.notary_pages
  ADD COLUMN IF NOT EXISTS languages jsonb DEFAULT '["English"]'::jsonb,
  ADD COLUMN IF NOT EXISTS years_experience int,
  ADD COLUMN IF NOT EXISTS eo_expiration date,
  ADD COLUMN IF NOT EXISTS background_check_date date,
  ADD COLUMN IF NOT EXISTS lsa_certifications jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS hours_json jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_notary_pages_slug ON public.notary_pages (slug);
CREATE INDEX IF NOT EXISTS idx_notary_pages_status ON public.notary_pages (status);
CREATE INDEX IF NOT EXISTS idx_notary_pages_published_status ON public.notary_pages (is_published, status);

-- DM-002: Services table standardization
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS is_ron boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_mobile boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS base_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS sort_order int DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_services_slug ON public.services (slug) WHERE slug IS NOT NULL;

-- DM-003: Pricing tiers
ALTER TABLE public.pricing_rules
  ADD COLUMN IF NOT EXISTS tier text DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS effective_date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS deprecated_at date;

-- DM-005: Reviews enhancements
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS notary_id uuid,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_reviews_notary ON public.reviews (notary_id);

-- DM-008: Consent Logs table
CREATE TABLE IF NOT EXISTS public.consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  consent_type text NOT NULL,
  version text DEFAULT '1.0',
  ip_address text,
  user_agent text,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert consent logs"
  ON public.consent_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consent logs"
  ON public.consent_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own consent logs"
  ON public.consent_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- DM-009: Audit log enhancements
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS old_value_json jsonb,
  ADD COLUMN IF NOT EXISTS new_value_json jsonb;
