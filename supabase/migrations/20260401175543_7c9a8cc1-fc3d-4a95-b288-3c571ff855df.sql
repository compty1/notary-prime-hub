-- Trigger: auto-create CRM activity when appointment status changes
CREATE OR REPLACE FUNCTION public.crm_log_appointment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.crm_activities (contact_id, contact_type, activity_type, subject, body, created_by)
    VALUES (
      NEW.client_id,
      'client',
      'status_change',
      'Appointment ' || NEW.status,
      'Appointment ' || COALESCE(NEW.confirmation_number, NEW.id::text) || ' status changed from ' || OLD.status || ' to ' || NEW.status,
      COALESCE(NEW.notary_id, auth.uid())
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_crm_appointment_status
AFTER UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.crm_log_appointment_status();

-- Trigger: auto-create CRM activity when payment is marked paid
CREATE OR REPLACE FUNCTION public.crm_log_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'paid' THEN
    INSERT INTO public.crm_activities (contact_id, contact_type, activity_type, subject, body, created_by)
    VALUES (
      NEW.client_id,
      'client',
      'payment',
      'Payment received $' || NEW.amount::text,
      'Payment of $' || NEW.amount::text || ' received via ' || COALESCE(NEW.method, 'unknown'),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_crm_payment
AFTER UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.crm_log_payment();