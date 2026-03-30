
-- 1. Add updated_at triggers (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
DROP TRIGGER IF EXISTS update_notary_journal_updated_at ON public.notary_journal;
DROP TRIGGER IF EXISTS update_notarization_sessions_updated_at ON public.notarization_sessions;
DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_client_correspondence_updated_at ON public.client_correspondence;
DROP TRIGGER IF EXISTS update_business_profiles_updated_at ON public.business_profiles;
DROP TRIGGER IF EXISTS update_apostille_requests_updated_at ON public.apostille_requests;
DROP TRIGGER IF EXISTS update_service_requests_updated_at ON public.service_requests;

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notary_journal_updated_at BEFORE UPDATE ON public.notary_journal FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notarization_sessions_updated_at BEFORE UPDATE ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_correspondence_updated_at BEFORE UPDATE ON public.client_correspondence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON public.business_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_apostille_requests_updated_at BEFORE UPDATE ON public.apostille_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_appointment_id ON public.documents(appointment_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_id ON public.chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON public.appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_notarization_sessions_appointment_id ON public.notarization_sessions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notary_journal_created_by ON public.notary_journal(created_by);

-- 3. Add unique constraint on notarization_sessions.appointment_id to support upsert
ALTER TABLE public.notarization_sessions DROP CONSTRAINT IF EXISTS notarization_sessions_appointment_id_unique;
ALTER TABLE public.notarization_sessions ADD CONSTRAINT notarization_sessions_appointment_id_unique UNIQUE (appointment_id);

-- 4. Fix chat_messages RLS: clients should only see admin replies directed to them
DROP POLICY IF EXISTS "Clients can view admin replies" ON public.chat_messages;
CREATE POLICY "Clients can view admin replies directed to them"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (is_admin = true AND recipient_id = auth.uid());

-- 5. Add compliance columns for Ohio ORC
ALTER TABLE public.notary_journal ADD COLUMN IF NOT EXISTS recording_url text;
ALTER TABLE public.notary_journal ADD COLUMN IF NOT EXISTS signer_location_attestation text;
ALTER TABLE public.notarization_sessions ADD COLUMN IF NOT EXISTS kba_attempts integer DEFAULT 0;
ALTER TABLE public.notarization_sessions ADD COLUMN IF NOT EXISTS recording_url text;
ALTER TABLE public.notarization_sessions ADD COLUMN IF NOT EXISTS signer_ip text;
