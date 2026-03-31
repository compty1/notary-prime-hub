
-- Fix #70/#93: Allow authenticated users to insert audit log entries via the SECURITY DEFINER RPC
CREATE POLICY "Authenticated can insert audit log via RPC"
ON public.audit_log FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Fix #104: Enable RLS on public_reviews view (it's a view, so we add security_invoker)
-- Actually public_reviews is a view - we need to make it security invoker
-- Drop and recreate the view with security_invoker
DROP VIEW IF EXISTS public.public_reviews;
CREATE VIEW public.public_reviews WITH (security_invoker = true) AS
SELECT id, rating, comment, created_at, appointment_id
FROM public.reviews;

-- Grant select to anon and authenticated
GRANT SELECT ON public.public_reviews TO anon, authenticated;

-- Fix #105: Recreate triggers that are missing
-- Confirmation number trigger
DROP TRIGGER IF EXISTS set_confirmation_number ON public.appointments;
CREATE TRIGGER set_confirmation_number
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_confirmation_number();

-- Session unique ID trigger
DROP TRIGGER IF EXISTS set_session_unique_id ON public.notarization_sessions;
CREATE TRIGGER set_session_unique_id
  BEFORE INSERT ON public.notarization_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_session_unique_id();

-- KBA limit enforcement trigger
DROP TRIGGER IF EXISTS enforce_kba_limit_trigger ON public.notarization_sessions;
CREATE TRIGGER enforce_kba_limit_trigger
  BEFORE UPDATE ON public.notarization_sessions
  FOR EACH ROW
  WHEN (NEW.kba_attempts IS DISTINCT FROM OLD.kba_attempts)
  EXECUTE FUNCTION public.enforce_kba_limit();

-- Appointment date validation trigger
DROP TRIGGER IF EXISTS validate_appointment_date_trigger ON public.appointments;
CREATE TRIGGER validate_appointment_date_trigger
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_appointment_date();

-- Double booking prevention trigger
DROP TRIGGER IF EXISTS prevent_double_booking_trigger ON public.appointments;
CREATE TRIGGER prevent_double_booking_trigger
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_double_booking();

-- Email validation trigger on leads
DROP TRIGGER IF EXISTS validate_lead_email ON public.leads;
CREATE TRIGGER validate_lead_email
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_email();

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_requests_updated_at ON public.service_requests;
CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_notarization_sessions_updated_at ON public.notarization_sessions;
CREATE TRIGGER update_notarization_sessions_updated_at
  BEFORE UPDATE ON public.notarization_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
