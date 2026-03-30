-- Batch 4: Triggers, indexes, constraints (using DROP IF EXISTS to be idempotent)

-- Drop existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS trg_prevent_double_booking ON public.appointments;
DROP TRIGGER IF EXISTS trg_validate_appointment_date ON public.appointments;
DROP TRIGGER IF EXISTS trg_generate_confirmation_number ON public.appointments;
DROP TRIGGER IF EXISTS trg_generate_session_unique_id ON public.notarization_sessions;
DROP TRIGGER IF EXISTS trg_enforce_kba_limit ON public.notarization_sessions;
DROP TRIGGER IF EXISTS trg_validate_lead_email ON public.leads;
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
DROP TRIGGER IF EXISTS trg_appointments_updated_at ON public.appointments;
DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
DROP TRIGGER IF EXISTS trg_service_requests_updated_at ON public.service_requests;
DROP TRIGGER IF EXISTS trg_notarization_sessions_updated_at ON public.notarization_sessions;
DROP TRIGGER IF EXISTS trg_notary_journal_updated_at ON public.notary_journal;
DROP TRIGGER IF EXISTS trg_email_cache_updated_at ON public.email_cache;

-- Re-create all triggers
CREATE TRIGGER trg_prevent_double_booking BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.prevent_double_booking();
CREATE TRIGGER trg_validate_appointment_date BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.validate_appointment_date();
CREATE TRIGGER trg_generate_confirmation_number BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.generate_confirmation_number();
CREATE TRIGGER trg_generate_session_unique_id BEFORE INSERT ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.generate_session_unique_id();
CREATE TRIGGER trg_enforce_kba_limit BEFORE UPDATE ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.enforce_kba_limit();
CREATE TRIGGER trg_validate_lead_email BEFORE INSERT OR UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.validate_email();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_notarization_sessions_updated_at BEFORE UPDATE ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_notary_journal_updated_at BEFORE UPDATE ON public.notary_journal FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_email_cache_updated_at BEFORE UPDATE ON public.email_cache FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON public.appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_appointment_id ON public.documents(appointment_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_id ON public.chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON public.payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_email_cache_folder ON public.email_cache(folder);
CREATE INDEX IF NOT EXISTS idx_service_requests_client_id ON public.service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_cache_message_id ON public.email_cache(message_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Check constraint on time_slots
ALTER TABLE public.time_slots DROP CONSTRAINT IF EXISTS chk_day_of_week;
ALTER TABLE public.time_slots ADD CONSTRAINT chk_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6);

-- Default for fees_charged
ALTER TABLE public.notary_journal ALTER COLUMN fees_charged SET DEFAULT 0;

-- Add rescheduled_from to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS rescheduled_from uuid REFERENCES public.appointments(id);

-- Confirmation number index
CREATE INDEX IF NOT EXISTS idx_appointments_confirmation_number ON public.appointments(confirmation_number);

-- Allow anonymous coming_soon leads
DROP POLICY IF EXISTS "Allow anonymous coming soon submissions" ON public.leads;
CREATE POLICY "Allow anonymous coming soon submissions" ON public.leads
  FOR INSERT TO anon
  WITH CHECK (source = 'coming_soon' AND status = 'new');