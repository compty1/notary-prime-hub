
-- Safely drop and recreate all triggers

-- Appointments
DROP TRIGGER IF EXISTS trg_prevent_double_booking ON public.appointments;
CREATE TRIGGER trg_prevent_double_booking BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.prevent_double_booking();

DROP TRIGGER IF EXISTS trg_validate_appointment_date ON public.appointments;
CREATE TRIGGER trg_validate_appointment_date BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.validate_appointment_date();

DROP TRIGGER IF EXISTS trg_validate_signer_count ON public.appointments;
CREATE TRIGGER trg_validate_signer_count BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.validate_signer_count();

DROP TRIGGER IF EXISTS trg_generate_confirmation_number ON public.appointments;
CREATE TRIGGER trg_generate_confirmation_number BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.generate_confirmation_number();

DROP TRIGGER IF EXISTS trg_update_appointments_updated_at ON public.appointments;
CREATE TRIGGER trg_update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_crm_log_appointment_status ON public.appointments;
CREATE TRIGGER trg_crm_log_appointment_status AFTER UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.crm_log_appointment_status();

-- Notarization sessions
DROP TRIGGER IF EXISTS trg_enforce_kba_limit ON public.notarization_sessions;
CREATE TRIGGER trg_enforce_kba_limit BEFORE UPDATE ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.enforce_kba_limit();

DROP TRIGGER IF EXISTS trg_generate_session_unique_id ON public.notarization_sessions;
CREATE TRIGGER trg_generate_session_unique_id BEFORE INSERT ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.generate_session_unique_id();

DROP TRIGGER IF EXISTS trg_set_retention_expires_at ON public.notarization_sessions;
CREATE TRIGGER trg_set_retention_expires_at BEFORE INSERT ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.set_retention_expires_at();

DROP TRIGGER IF EXISTS trg_update_sessions_updated_at ON public.notarization_sessions;
CREATE TRIGGER trg_update_sessions_updated_at BEFORE UPDATE ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Profiles
DROP TRIGGER IF EXISTS trg_validate_email_profiles ON public.profiles;
CREATE TRIGGER trg_validate_email_profiles BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validate_email();

DROP TRIGGER IF EXISTS trg_update_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Leads
DROP TRIGGER IF EXISTS trg_validate_email_leads ON public.leads;
CREATE TRIGGER trg_validate_email_leads BEFORE INSERT OR UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.validate_email();

-- Documents
DROP TRIGGER IF EXISTS trg_update_documents_updated_at ON public.documents;
CREATE TRIGGER trg_update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Services
DROP TRIGGER IF EXISTS trg_update_services_updated_at ON public.services;
CREATE TRIGGER trg_update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Service requests
DROP TRIGGER IF EXISTS trg_generate_service_request_reference ON public.service_requests;
CREATE TRIGGER trg_generate_service_request_reference BEFORE INSERT ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.generate_service_request_reference();

-- Referrals
DROP TRIGGER IF EXISTS trg_generate_referral_code ON public.referrals;
CREATE TRIGGER trg_generate_referral_code BEFORE INSERT ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

-- Payments
DROP TRIGGER IF EXISTS trg_crm_log_payment ON public.payments;
CREATE TRIGGER trg_crm_log_payment AFTER UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.crm_log_payment();

-- =============================================
-- Create journal_entries table (ORC §147.141)
-- =============================================
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_number SERIAL,
  notary_user_id UUID NOT NULL,
  session_id UUID REFERENCES public.notarization_sessions(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_time TIME NOT NULL DEFAULT CURRENT_TIME,
  notarial_act_type TEXT NOT NULL DEFAULT 'acknowledgment',
  document_type_description TEXT NOT NULL DEFAULT '',
  document_date DATE,
  signer_name TEXT NOT NULL DEFAULT '',
  signer_address TEXT,
  signer_signature_path TEXT,
  id_type TEXT,
  id_number TEXT,
  id_expiration DATE,
  notary_name TEXT NOT NULL DEFAULT '',
  notary_commission_number TEXT,
  notary_commission_expiration DATE,
  communication_technology TEXT DEFAULT 'audio-video',
  credential_analysis_method TEXT,
  kba_vendor TEXT,
  fee_charged NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notaries view own journal entries"
  ON public.journal_entries FOR SELECT TO authenticated
  USING (notary_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Notaries create own journal entries"
  ON public.journal_entries FOR INSERT TO authenticated
  WITH CHECK (notary_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Notaries update own journal entries"
  ON public.journal_entries FOR UPDATE TO authenticated
  USING (notary_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete journal entries"
  ON public.journal_entries FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_update_journal_entries_updated_at ON public.journal_entries;
CREATE TRIGGER trg_update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
