
-- Create updated_at triggers for core tables (items 598)
CREATE OR REPLACE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_appointments BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_documents BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_payments BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_service_requests BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_notary_journal BEFORE UPDATE ON public.notary_journal FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_notarization_sessions BEFORE UPDATE ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_client_correspondence BEFORE UPDATE ON public.client_correspondence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_business_profiles BEFORE UPDATE ON public.business_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_apostille_requests BEFORE UPDATE ON public.apostille_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_leads BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Appointment validation triggers (items 599-600)
CREATE OR REPLACE TRIGGER trg_validate_appointment_date BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.validate_appointment_date();
CREATE OR REPLACE TRIGGER trg_prevent_double_booking BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.prevent_double_booking();

-- Confirmation number generation (item 602)
CREATE OR REPLACE TRIGGER trg_generate_confirmation_number BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.generate_confirmation_number();

-- Session unique ID generation (item 603)
CREATE OR REPLACE TRIGGER trg_generate_session_unique_id BEFORE INSERT ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.generate_session_unique_id();

-- KBA limit enforcement (item 601)
CREATE OR REPLACE TRIGGER trg_enforce_kba_limit BEFORE UPDATE ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.enforce_kba_limit();

-- Email validation on profiles (item 604)
CREATE OR REPLACE TRIGGER trg_validate_email_profiles BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validate_email();

-- Handle new user trigger on auth.users (item 604)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Reviews rating constraint (item 610)
DO $$ BEGIN
  ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_range CHECK (rating >= 1 AND rating <= 5);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
