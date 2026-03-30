-- BATCH 2 (final): Skip already-existing constraints

-- Unique token (item 98)
DO $$ BEGIN
  ALTER TABLE public.email_unsubscribe_tokens ADD CONSTRAINT email_unsubscribe_tokens_token_unique UNIQUE (token);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_email_unsubscribe_tokens_email ON public.email_unsubscribe_tokens(email);

-- day_of_week check (item 101)
DO $$ BEGIN
  ALTER TABLE public.time_slots ADD CONSTRAINT time_slots_day_of_week_check CHECK (day_of_week >= 0 AND day_of_week <= 6);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL;
END $$;

-- Email validation triggers (item 108)
DROP TRIGGER IF EXISTS validate_profiles_email ON public.profiles;
CREATE TRIGGER validate_profiles_email BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION validate_email();

DROP TRIGGER IF EXISTS validate_leads_email ON public.leads;
CREATE TRIGGER validate_leads_email BEFORE INSERT OR UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION validate_email();

-- Appointment date validation (item 84)
DROP TRIGGER IF EXISTS check_appointment_date ON public.appointments;
CREATE TRIGGER check_appointment_date BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION validate_appointment_date();

-- Double booking prevention (item 116)
DROP TRIGGER IF EXISTS check_double_booking ON public.appointments;
CREATE TRIGGER check_double_booking BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION prevent_double_booking();

-- Session unique ID (item 295)
DROP TRIGGER IF EXISTS generate_session_id ON public.notarization_sessions;
CREATE TRIGGER generate_session_id BEFORE INSERT ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION generate_session_unique_id();

-- Notary invites expiration (item 35)
ALTER TABLE public.notary_invites ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT (now() + interval '30 days');

-- RON session timeout (item 308)
ALTER TABLE public.notarization_sessions ADD COLUMN IF NOT EXISTS session_timeout_minutes integer DEFAULT 60;
ALTER TABLE public.notarization_sessions ADD COLUMN IF NOT EXISTS last_activity_at timestamp with time zone;

-- Document rejection reason (item 405)
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Booking confirmation number (item 154)
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS confirmation_number text;

CREATE OR REPLACE FUNCTION public.generate_confirmation_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $function$
BEGIN
  IF NEW.confirmation_number IS NULL THEN
    NEW.confirmation_number := 'NTR-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS generate_confirmation ON public.appointments;
CREATE TRIGGER generate_confirmation BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION generate_confirmation_number();

-- Service duration and cancellation (items 118, 131)
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS cancellation_hours integer DEFAULT 24;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 30;

-- KBA limit enforcement (items 300-301)
CREATE OR REPLACE FUNCTION public.enforce_kba_limit()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $function$
BEGIN
  IF NEW.kba_attempts > 2 THEN
    RAISE EXCEPTION 'Maximum KBA attempts (2) exceeded per Ohio ORC §147.66';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_kba_limit_trigger ON public.notarization_sessions;
CREATE TRIGGER enforce_kba_limit_trigger BEFORE UPDATE ON public.notarization_sessions
  FOR EACH ROW WHEN (NEW.kba_attempts IS DISTINCT FROM OLD.kba_attempts)
  EXECUTE FUNCTION enforce_kba_limit();

-- Payment improvements (item 369)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 0;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS refunded_at timestamp with time zone;