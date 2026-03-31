-- Create updated_at triggers for all core tables (Items 597-598)
-- Only create if not exists to be idempotent

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'appointments', 'documents', 'profiles', 'payments', 'notary_journal',
    'service_requests', 'client_correspondence', 'business_profiles',
    'notarization_sessions', 'leads', 'apostille_requests'
  ])
  LOOP
    -- Check if trigger already exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'update_' || tbl || '_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
        tbl, tbl
      );
    END IF;
  END LOOP;
END;
$$;

-- Create appointment validation trigger (Item 599)
DROP TRIGGER IF EXISTS validate_appointment_date_trigger ON public.appointments;
CREATE TRIGGER validate_appointment_date_trigger
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_appointment_date();

-- Create double-booking prevention trigger (Item 600)
DROP TRIGGER IF EXISTS prevent_double_booking_trigger ON public.appointments;
CREATE TRIGGER prevent_double_booking_trigger
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_double_booking();

-- Create confirmation number generator trigger (Item 602)
DROP TRIGGER IF EXISTS generate_confirmation_number_trigger ON public.appointments;
CREATE TRIGGER generate_confirmation_number_trigger
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_confirmation_number();

-- Create KBA limit enforcement trigger (Item 601)
DROP TRIGGER IF EXISTS enforce_kba_limit_trigger ON public.notarization_sessions;
CREATE TRIGGER enforce_kba_limit_trigger
  BEFORE INSERT OR UPDATE ON public.notarization_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_kba_limit();

-- Create session unique ID generator trigger (Item 603)
DROP TRIGGER IF EXISTS generate_session_unique_id_trigger ON public.notarization_sessions;
CREATE TRIGGER generate_session_unique_id_trigger
  BEFORE INSERT ON public.notarization_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_session_unique_id();

-- Create handle_new_user trigger (Item 604)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create email validation trigger on profiles (Item 500 partial)
DROP TRIGGER IF EXISTS validate_profile_email_trigger ON public.profiles;
CREATE TRIGGER validate_profile_email_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_email();

-- Create indexes for frequently queried columns (Item 551)
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON public.appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_appointment_id ON public.documents(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON public.payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_client_id ON public.service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_notary_journal_created_by ON public.notary_journal(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_id ON public.chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);

-- Add review rating constraint (Item 610)
ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_range CHECK (rating >= 1 AND rating <= 5);