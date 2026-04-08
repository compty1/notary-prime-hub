
-- Monetization tables: user_subscriptions, usage_tracking, pricing_rules, promo_codes, service_add_ons

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  feature TEXT NOT NULL,
  usage_count INT NOT NULL DEFAULT 0,
  usage_period TEXT NOT NULL DEFAULT 'monthly',
  period_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL DEFAULT 'discount',
  conditions JSONB NOT NULL DEFAULT '{}',
  adjustment_type TEXT NOT NULL DEFAULT 'percentage',
  adjustment_value NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  max_uses INT,
  current_uses INT NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  applicable_services TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add booking slot locking function
CREATE OR REPLACE FUNCTION public.check_and_reserve_slot(
  p_date TEXT,
  p_time TEXT,
  p_client_id UUID,
  p_service_type TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id UUID;
  v_existing INT;
BEGIN
  -- Lock existing rows for this slot
  SELECT COUNT(*) INTO v_existing
  FROM public.appointments
  WHERE scheduled_date = p_date
    AND scheduled_time = p_time
    AND status NOT IN ('cancelled', 'no_show')
  FOR UPDATE;

  IF v_existing > 0 THEN
    RAISE EXCEPTION 'Time slot already booked';
  END IF;

  INSERT INTO public.appointments (scheduled_date, scheduled_time, client_id, service_type, status)
  VALUES (p_date, p_time, p_client_id, p_service_type, 'scheduled')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- RLS for monetization tables
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_add_ons ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Users can view their own usage
CREATE POLICY "Users can view own usage" ON public.usage_tracking
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Admins can manage pricing rules
CREATE POLICY "Admins can manage pricing rules" ON public.pricing_rules
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Everyone can read active promo codes
CREATE POLICY "Anyone can read active promos" ON public.promo_codes
  FOR SELECT TO authenticated USING (is_active = true);

-- Admins can manage promo codes
CREATE POLICY "Admins can manage promos" ON public.promo_codes
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Everyone can read active add-ons
CREATE POLICY "Anyone can read active add-ons" ON public.service_add_ons
  FOR SELECT TO authenticated USING (is_active = true);

-- Admins can manage add-ons
CREATE POLICY "Admins can manage add-ons" ON public.service_add_ons
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage subscriptions" ON public.user_subscriptions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage usage tracking
CREATE POLICY "Admins can manage usage" ON public.usage_tracking
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
