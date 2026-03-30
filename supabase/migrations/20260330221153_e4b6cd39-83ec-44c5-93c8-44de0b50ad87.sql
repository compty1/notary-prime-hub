
-- Fix audit_log INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert audit log" ON public.audit_log;
CREATE POLICY "Authenticated users can insert audit log"
  ON public.audit_log FOR INSERT
  TO public
  WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

-- Remove tables from realtime publication
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.payments; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.documents; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.service_requests; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- Add missing triggers (skip if exists)
CREATE OR REPLACE TRIGGER trg_validate_appointment_date
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.validate_appointment_date();

CREATE OR REPLACE TRIGGER trg_prevent_double_booking
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.prevent_double_booking();

CREATE OR REPLACE TRIGGER trg_generate_confirmation_number
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.generate_confirmation_number();

CREATE OR REPLACE TRIGGER trg_enforce_kba_limit
  BEFORE INSERT OR UPDATE ON public.notarization_sessions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_kba_limit();

CREATE OR REPLACE TRIGGER trg_generate_session_unique_id
  BEFORE INSERT ON public.notarization_sessions
  FOR EACH ROW EXECUTE FUNCTION public.generate_session_unique_id();

CREATE OR REPLACE TRIGGER trg_validate_email_leads
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.validate_email();

-- updated_at triggers
CREATE OR REPLACE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_notarization_sessions_updated_at BEFORE UPDATE ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON public.appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_id ON public.chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_email_cache_folder ON public.email_cache(folder);
CREATE INDEX IF NOT EXISTS idx_email_send_log_template ON public.email_send_log(template_name);

-- Add columns for service_requests enhancements
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS assigned_to uuid;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal';
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS sla_deadline timestamptz;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS deliverable_url text;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS client_visible_status text NOT NULL DEFAULT 'Submitted';
