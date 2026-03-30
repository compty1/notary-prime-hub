
-- Triggers (drop first to be idempotent)
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_email_cache_updated_at ON public.email_cache;
CREATE TRIGGER trg_email_cache_updated_at BEFORE UPDATE ON public.email_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Appointment date validation
CREATE OR REPLACE FUNCTION public.validate_appointment_date()
  RETURNS trigger LANGUAGE plpgsql SET search_path = 'public'
AS $$ BEGIN
  IF NEW.scheduled_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Appointment date cannot be in the past';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_validate_appointment_date ON public.appointments;
CREATE TRIGGER trg_validate_appointment_date
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.validate_appointment_date();

-- Double-booking prevention
CREATE OR REPLACE FUNCTION public.prevent_double_booking()
  RETURNS trigger LANGUAGE plpgsql SET search_path = 'public'
AS $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE scheduled_date = NEW.scheduled_date
      AND scheduled_time = NEW.scheduled_time
      AND status NOT IN ('cancelled', 'no_show')
      AND id IS DISTINCT FROM NEW.id
  ) THEN
    RAISE EXCEPTION 'Time slot already booked';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_prevent_double_booking ON public.appointments;
CREATE TRIGGER trg_prevent_double_booking
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.prevent_double_booking();

-- RLS (drop first to be idempotent)
DROP POLICY IF EXISTS "Admins can read email send log" ON public.email_send_log;
CREATE POLICY "Admins can read email send log"
  ON public.email_send_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can read suppressed emails" ON public.suppressed_emails;
CREATE POLICY "Admins can read suppressed emails"
  ON public.suppressed_emails FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
