
-- 1. service_reviews table
CREATE TABLE public.service_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON public.service_reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated users create reviews" ON public.service_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.service_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews" ON public.service_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage service reviews" ON public.service_reviews FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. booking_drafts table
CREATE TABLE public.booking_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  step INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.booking_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own drafts" ON public.booking_drafts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. waitlist table
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  preferred_date DATE,
  status TEXT NOT NULL DEFAULT 'waiting',
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own waitlist" ON public.waitlist FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage waitlist" ON public.waitlist FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. service_faqs table
CREATE TABLE public.service_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.service_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view FAQs" ON public.service_faqs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage FAQs" ON public.service_faqs FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. notification_preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  event_type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, channel, event_type)
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own prefs" ON public.notification_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. promo_codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_to TIMESTAMP WITH TIME ZONE,
  usage_limit INTEGER,
  times_used INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage promo codes" ON public.promo_codes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can validate codes" ON public.promo_codes FOR SELECT TO authenticated USING (is_active = true);

-- 7. Add columns to services
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS estimated_turnaround TEXT,
  ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS avg_rating NUMERIC DEFAULT 0;

-- 8. Add reference_number to service_requests
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS reference_number TEXT;

CREATE OR REPLACE FUNCTION public.generate_service_request_reference()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := 'SR-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_generate_sr_reference
  BEFORE INSERT ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_service_request_reference();

-- 9. Enable realtime on service_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;

-- 10. Add updated_at triggers for new tables
CREATE TRIGGER update_booking_drafts_updated_at
  BEFORE UPDATE ON public.booking_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
