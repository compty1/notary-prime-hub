
-- Performance index on scheduled_date
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON public.appointments (scheduled_date);

-- Index on notary_id for assignment queries
CREATE INDEX IF NOT EXISTS idx_appointments_notary_id ON public.appointments (notary_id) WHERE notary_id IS NOT NULL;

-- Duplicate booking prevention trigger
CREATE OR REPLACE FUNCTION public.prevent_duplicate_client_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE client_id = NEW.client_id
      AND scheduled_date = NEW.scheduled_date
      AND scheduled_time = NEW.scheduled_time
      AND status NOT IN ('cancelled', 'no_show')
      AND id IS DISTINCT FROM NEW.id
  ) THEN
    RAISE EXCEPTION 'A booking already exists for this client at the same date and time';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_duplicate_booking ON public.appointments;
CREATE TRIGGER trg_prevent_duplicate_booking
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_client_booking();
