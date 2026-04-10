
-- =============================================
-- Phase 1: Professional Sites & Profit Share Schema
-- =============================================

-- 1. Extend notary_pages with customization & professional fields
ALTER TABLE public.notary_pages
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#1e40af',
  ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS nav_services jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery_photos jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS professional_type text DEFAULT 'notary',
  ADD COLUMN IF NOT EXISTS profit_share_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS profit_share_percentage numeric(5,2) DEFAULT 70.00;

-- 2. Extend appointments with referral tracking
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS referral_professional_id uuid;

-- 3. Extend payments with referral tracking
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS referral_professional_id uuid;

-- =============================================
-- 4. Create profit_share_config
-- =============================================
CREATE TABLE IF NOT EXISTS public.profit_share_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_user_id uuid NOT NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  share_percentage numeric(5,2) NOT NULL DEFAULT 70.00,
  min_platform_fee numeric(10,2) NOT NULL DEFAULT 5.00,
  is_active boolean NOT NULL DEFAULT true,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(professional_user_id, service_id)
);

ALTER TABLE public.profit_share_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals view own profit share config"
  ON public.profit_share_config FOR SELECT
  USING (auth.uid() = professional_user_id);

CREATE POLICY "Admins manage all profit share config"
  ON public.profit_share_config FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Professionals update own config"
  ON public.profit_share_config FOR UPDATE
  USING (auth.uid() = professional_user_id);

-- =============================================
-- 5. Create profit_share_transactions
-- =============================================
CREATE TABLE IF NOT EXISTS public.profit_share_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_user_id uuid NOT NULL,
  service_id uuid REFERENCES public.services(id),
  appointment_id uuid REFERENCES public.appointments(id),
  payment_id uuid REFERENCES public.payments(id),
  gross_amount numeric(10,2) NOT NULL DEFAULT 0,
  platform_fee numeric(10,2) NOT NULL DEFAULT 0,
  professional_share numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  period_start date,
  period_end date,
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profit_share_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals view own transactions"
  ON public.profit_share_transactions FOR SELECT
  USING (auth.uid() = professional_user_id);

CREATE POLICY "Admins manage all transactions"
  ON public.profit_share_transactions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Professionals can dispute own transactions"
  ON public.profit_share_transactions FOR UPDATE
  USING (auth.uid() = professional_user_id)
  WITH CHECK (status = 'disputed');

-- =============================================
-- 6. Create professional_service_enrollments
-- =============================================
CREATE TABLE IF NOT EXISTS public.professional_service_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_user_id uuid NOT NULL,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  custom_price_from numeric(10,2),
  custom_price_to numeric(10,2),
  custom_description text,
  custom_short_description text,
  is_active boolean NOT NULL DEFAULT false,
  show_on_site boolean NOT NULL DEFAULT true,
  show_in_nav boolean NOT NULL DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(professional_user_id, service_id)
);

ALTER TABLE public.professional_service_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals view own enrollments"
  ON public.professional_service_enrollments FOR SELECT
  USING (auth.uid() = professional_user_id);

CREATE POLICY "Professionals manage own enrollments"
  ON public.professional_service_enrollments FOR INSERT
  WITH CHECK (auth.uid() = professional_user_id);

CREATE POLICY "Professionals update own enrollments"
  ON public.professional_service_enrollments FOR UPDATE
  USING (auth.uid() = professional_user_id);

CREATE POLICY "Professionals delete own enrollments"
  ON public.professional_service_enrollments FOR DELETE
  USING (auth.uid() = professional_user_id);

CREATE POLICY "Admins manage all enrollments"
  ON public.professional_service_enrollments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view active enrollments"
  ON public.professional_service_enrollments FOR SELECT
  USING (is_active = true AND show_on_site = true);

-- =============================================
-- 7. Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_profit_share_txn_professional_status
  ON public.profit_share_transactions(professional_user_id, status);

CREATE INDEX IF NOT EXISTS idx_prof_service_enrollments_professional
  ON public.professional_service_enrollments(professional_user_id, service_id);

CREATE INDEX IF NOT EXISTS idx_appointments_referral_professional
  ON public.appointments(referral_professional_id);

CREATE INDEX IF NOT EXISTS idx_payments_referral_professional
  ON public.payments(referral_professional_id);

-- =============================================
-- 8. Triggers: updated_at
-- =============================================
CREATE TRIGGER update_profit_share_config_updated_at
  BEFORE UPDATE ON public.profit_share_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profit_share_transactions_updated_at
  BEFORE UPDATE ON public.profit_share_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professional_service_enrollments_updated_at
  BEFORE UPDATE ON public.professional_service_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 9. Profit Share Calculation Function (Phase 4)
-- =============================================
CREATE OR REPLACE FUNCTION public.calculate_profit_share(
  p_payment_id uuid,
  p_professional_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment record;
  v_config record;
  v_service_id uuid;
  v_gross numeric(10,2);
  v_platform_fee numeric(10,2);
  v_professional_share numeric(10,2);
  v_existing int;
BEGIN
  -- Idempotency check
  SELECT COUNT(*) INTO v_existing
  FROM public.profit_share_transactions
  WHERE payment_id = p_payment_id AND professional_user_id = p_professional_id;
  IF v_existing > 0 THEN RETURN; END IF;

  -- Get payment details
  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id;
  IF NOT FOUND THEN RETURN; END IF;

  v_gross := v_payment.amount;

  -- Try to find the service from the appointment
  IF v_payment.appointment_id IS NOT NULL THEN
    SELECT s.id INTO v_service_id
    FROM public.appointments a
    JOIN public.services s ON LOWER(s.name) = LOWER(a.service_type)
    WHERE a.id = v_payment.appointment_id
    LIMIT 1;
  END IF;

  -- Look up profit share config
  SELECT * INTO v_config
  FROM public.profit_share_config
  WHERE professional_user_id = p_professional_id
    AND (service_id = v_service_id OR service_id IS NULL)
    AND is_active = true
  ORDER BY service_id NULLS LAST
  LIMIT 1;

  IF NOT FOUND THEN
    -- Default: 70/30 split with $5 minimum platform fee
    v_platform_fee := GREATEST(5.00, v_gross * 0.30);
  ELSE
    v_platform_fee := GREATEST(
      v_config.min_platform_fee,
      v_gross * (1 - v_config.share_percentage / 100)
    );
  END IF;

  v_professional_share := v_gross - v_platform_fee;
  IF v_professional_share < 0 THEN v_professional_share := 0; END IF;

  INSERT INTO public.profit_share_transactions (
    professional_user_id, service_id, appointment_id, payment_id,
    gross_amount, platform_fee, professional_share, status
  ) VALUES (
    p_professional_id, v_service_id, v_payment.appointment_id, p_payment_id,
    v_gross, v_platform_fee, v_professional_share, 'pending'
  );
END;
$$;

-- =============================================
-- 10. Payment trigger for auto profit share
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_profit_share_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid'
     AND NEW.referral_professional_id IS NOT NULL THEN
    PERFORM public.calculate_profit_share(NEW.id, NEW.referral_professional_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profit_share_on_payment ON public.payments;
CREATE TRIGGER trg_profit_share_on_payment
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_profit_share_on_payment();

-- =============================================
-- 11. Enrollment price floor enforcement
-- =============================================
CREATE OR REPLACE FUNCTION public.enforce_enrollment_price_floor()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_service_price_from numeric;
BEGIN
  SELECT price_from INTO v_service_price_from
  FROM public.services WHERE id = NEW.service_id;

  IF v_service_price_from IS NOT NULL AND NEW.custom_price_from IS NOT NULL
     AND NEW.custom_price_from < v_service_price_from THEN
    RAISE EXCEPTION 'Custom price ($%) cannot be lower than platform price ($%)',
      NEW.custom_price_from, v_service_price_from;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_enrollment_price_floor
  BEFORE INSERT OR UPDATE ON public.professional_service_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_enrollment_price_floor();
