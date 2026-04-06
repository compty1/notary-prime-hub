-- Bug 143: Add archived column to notary_journal for soft delete (ORC §147.551)
ALTER TABLE public.notary_journal ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- Bug 31/17: Tighten session_tracking RLS - restrict public SELECT to token-matched rows
DROP POLICY IF EXISTS "Public view by token" ON public.session_tracking;
CREATE POLICY "Public view by token"
  ON public.session_tracking
  FOR SELECT
  TO anon, authenticated
  USING (shareable_token IS NOT NULL AND shareable_token = current_setting('request.headers', true)::json->>'x-shareable-token');

-- Bug 129: Add check constraint on payments amount
ALTER TABLE public.payments ADD CONSTRAINT payments_amount_positive CHECK (amount >= 0);

-- Bug 58: Add referral_code auto-generation trigger
CREATE OR REPLACE FUNCTION public.generate_referral_code()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := substr(gen_random_uuid()::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_referral_code ON public.referrals;
CREATE TRIGGER trg_generate_referral_code
  BEFORE INSERT ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();