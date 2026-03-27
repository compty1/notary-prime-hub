
-- =============================================
-- Round 2 Migration: FKs, Indexes, Triggers, Constraints, Seed Data
-- =============================================

-- 1. Attach handle_new_user trigger (gaps 173)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Attach updated_at triggers to all relevant tables (gap 174)
CREATE OR REPLACE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_notary_journal_updated_at BEFORE UPDATE ON public.notary_journal FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_client_correspondence_updated_at BEFORE UPDATE ON public.client_correspondence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_notarization_sessions_updated_at BEFORE UPDATE ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_apostille_requests_updated_at BEFORE UPDATE ON public.apostille_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_business_profiles_updated_at BEFORE UPDATE ON public.business_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Add missing indexes (gaps 169-170)
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_id ON public.chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_document_reminders_user_id ON public.document_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_document_reminders_document_id ON public.document_reminders(document_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON public.reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_appointment_id ON public.reviews(appointment_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_client_id ON public.service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_mailroom_items_client_id ON public.mailroom_items(client_id);
CREATE INDEX IF NOT EXISTS idx_correspondence_client_id ON public.client_correspondence(client_id);

-- 4. Add unique constraint on reviews to prevent duplicates (gap 168)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_client_appointment ON public.reviews(client_id, appointment_id) WHERE appointment_id IS NOT NULL;
