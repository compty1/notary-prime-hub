
-- =====================================================
-- BATCH 1: Indexes, Triggers, New Tables, New Columns
-- Items 761-800 from the expanded plan
-- =====================================================

-- ===== INDEXES (761-765, 800) =====
CREATE INDEX IF NOT EXISTS idx_appointments_client_date ON public.appointments (client_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON public.appointments (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by_created ON public.documents (uploaded_by, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status_created ON public.leads (status, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_created ON public.chat_messages (sender_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log (created_at);
CREATE INDEX IF NOT EXISTS idx_content_posts_status_category ON public.content_posts (status, category);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_upcoming ON public.appointments (scheduled_date, scheduled_time) WHERE status = 'scheduled';

-- ===== ATTACH TRIGGERS (766-772) =====

-- updated_at triggers on tables missing them
CREATE OR REPLACE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_client_correspondence_updated_at
  BEFORE UPDATE ON public.client_correspondence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_booking_drafts_updated_at
  BEFORE UPDATE ON public.booking_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Attach prevent_double_booking trigger (767)
CREATE OR REPLACE TRIGGER trg_prevent_double_booking
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.prevent_double_booking();

-- Attach generate_confirmation_number trigger (768)
CREATE OR REPLACE TRIGGER trg_generate_confirmation_number
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.generate_confirmation_number();

-- Attach validate_appointment_date trigger
CREATE OR REPLACE TRIGGER trg_validate_appointment_date
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.validate_appointment_date();

-- Attach validate_email trigger on profiles (769)
CREATE OR REPLACE TRIGGER trg_validate_email_profiles
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_email();

-- Attach enforce_kba_limit trigger on notarization_sessions (770)
CREATE OR REPLACE TRIGGER trg_enforce_kba_limit
  BEFORE UPDATE ON public.notarization_sessions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_kba_limit();

-- Attach generate_session_unique_id trigger
CREATE OR REPLACE TRIGGER trg_generate_session_unique_id
  BEFORE INSERT ON public.notarization_sessions
  FOR EACH ROW EXECUTE FUNCTION public.generate_session_unique_id();

-- ===== NEW COLUMNS (781-793) =====

-- Add new columns to appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS appointment_duration_actual integer,
  ADD COLUMN IF NOT EXISTS booking_source text DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS session_recording_duration integer;

-- Add new columns to documents
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS document_hash text;

-- Add new columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS client_preferred_language text DEFAULT 'en';

-- ===== NEW TABLES (775-779, 785-786) =====

-- Witnesses table (775)
CREATE TABLE IF NOT EXISTS public.witnesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  address text,
  id_type text,
  id_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.witnesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage witnesses" ON public.witnesses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients view own appointment witnesses" ON public.witnesses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = witnesses.appointment_id AND a.client_id = auth.uid()
  ));

-- Notification queue table (777)
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  priority text NOT NULL DEFAULT 'normal',
  subject text,
  body text,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages notification queue" ON public.notification_queue
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins view notification queue" ON public.notification_queue
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fee adjustments table (785)
CREATE TABLE IF NOT EXISTS public.fee_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
  original_fee numeric NOT NULL DEFAULT 0,
  adjusted_fee numeric NOT NULL DEFAULT 0,
  reason text NOT NULL,
  adjusted_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fee_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage fee adjustments" ON public.fee_adjustments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== DATABASE FUNCTIONS (798-799) =====

-- Get client lifetime value (798)
CREATE OR REPLACE FUNCTION public.get_client_lifetime_value(_client_id uuid)
RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM public.payments
  WHERE client_id = _client_id AND status = 'paid';
$$;

-- Signer count validation trigger (788)
CREATE OR REPLACE FUNCTION public.validate_signer_count()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.signer_count IS NOT NULL AND NEW.signer_count < 1 THEN
    RAISE EXCEPTION 'Signer count must be at least 1';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_validate_signer_count
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.validate_signer_count();
