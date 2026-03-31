
-- Drop existing triggers first, then recreate them all
DROP TRIGGER IF EXISTS validate_appointment_date_trigger ON public.appointments;
DROP TRIGGER IF EXISTS prevent_double_booking_trigger ON public.appointments;
DROP TRIGGER IF EXISTS generate_confirmation_number_trigger ON public.appointments;
DROP TRIGGER IF EXISTS enforce_kba_limit_trigger ON public.notarization_sessions;
DROP TRIGGER IF EXISTS generate_session_unique_id_trigger ON public.notarization_sessions;
DROP TRIGGER IF EXISTS validate_email_trigger ON public.profiles;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_notarization_sessions_updated_at ON public.notarization_sessions;
DROP TRIGGER IF EXISTS update_service_requests_updated_at ON public.service_requests;
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
DROP TRIGGER IF EXISTS update_business_profiles_updated_at ON public.business_profiles;
DROP TRIGGER IF EXISTS update_apostille_requests_updated_at ON public.apostille_requests;
DROP TRIGGER IF EXISTS update_client_correspondence_updated_at ON public.client_correspondence;
DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
DROP TRIGGER IF EXISTS update_notary_journal_updated_at ON public.notary_journal;

-- Appointments triggers
CREATE TRIGGER validate_appointment_date_trigger BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.validate_appointment_date();
CREATE TRIGGER prevent_double_booking_trigger BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.prevent_double_booking();
CREATE TRIGGER generate_confirmation_number_trigger BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.generate_confirmation_number();

-- Notarization sessions triggers
CREATE TRIGGER enforce_kba_limit_trigger BEFORE INSERT OR UPDATE ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.enforce_kba_limit();
CREATE TRIGGER generate_session_unique_id_trigger BEFORE INSERT ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.generate_session_unique_id();

-- Profile email validation
CREATE TRIGGER validate_email_trigger BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validate_email();

-- updated_at triggers
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notarization_sessions_updated_at BEFORE UPDATE ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON public.business_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_apostille_requests_updated_at BEFORE UPDATE ON public.apostille_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_correspondence_updated_at BEFORE UPDATE ON public.client_correspondence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notary_journal_updated_at BEFORE UPDATE ON public.notary_journal FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
