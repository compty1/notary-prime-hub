-- Drop and recreate all triggers safely

-- Appointments
DROP TRIGGER IF EXISTS trg_prevent_double_booking ON public.appointments;
CREATE TRIGGER trg_prevent_double_booking BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.prevent_double_booking();

DROP TRIGGER IF EXISTS trg_prevent_duplicate_client_booking ON public.appointments;
CREATE TRIGGER trg_prevent_duplicate_client_booking BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_client_booking();

DROP TRIGGER IF EXISTS trg_validate_appointment_date ON public.appointments;
CREATE TRIGGER trg_validate_appointment_date BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.validate_appointment_date();

DROP TRIGGER IF EXISTS trg_validate_signer_count ON public.appointments;
CREATE TRIGGER trg_validate_signer_count BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.validate_signer_count();

DROP TRIGGER IF EXISTS trg_generate_confirmation_number ON public.appointments;
CREATE TRIGGER trg_generate_confirmation_number BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.generate_confirmation_number();

DROP TRIGGER IF EXISTS trg_update_updated_at_appointments ON public.appointments;
CREATE TRIGGER trg_update_updated_at_appointments BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_crm_log_appointment_status ON public.appointments;
CREATE TRIGGER trg_crm_log_appointment_status AFTER UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.crm_log_appointment_status();

-- Notarization sessions
DROP TRIGGER IF EXISTS trg_enforce_kba_limit ON public.notarization_sessions;
CREATE TRIGGER trg_enforce_kba_limit BEFORE UPDATE ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.enforce_kba_limit();

DROP TRIGGER IF EXISTS trg_enforce_recording_consent ON public.notarization_sessions;
CREATE TRIGGER trg_enforce_recording_consent BEFORE UPDATE ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.enforce_recording_consent();

DROP TRIGGER IF EXISTS trg_enforce_ron_retention ON public.notarization_sessions;
CREATE TRIGGER trg_enforce_ron_retention BEFORE INSERT OR UPDATE ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.enforce_ron_retention();

DROP TRIGGER IF EXISTS trg_set_retention_expires_at ON public.notarization_sessions;
CREATE TRIGGER trg_set_retention_expires_at BEFORE INSERT ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.set_retention_expires_at();

DROP TRIGGER IF EXISTS trg_generate_session_unique_id ON public.notarization_sessions;
CREATE TRIGGER trg_generate_session_unique_id BEFORE INSERT ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.generate_session_unique_id();

DROP TRIGGER IF EXISTS trg_update_updated_at_sessions ON public.notarization_sessions;
CREATE TRIGGER trg_update_updated_at_sessions BEFORE UPDATE ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Profiles
DROP TRIGGER IF EXISTS trg_validate_email_profiles ON public.profiles;
CREATE TRIGGER trg_validate_email_profiles BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validate_email();

DROP TRIGGER IF EXISTS trg_update_updated_at_profiles ON public.profiles;
CREATE TRIGGER trg_update_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Leads
DROP TRIGGER IF EXISTS trg_validate_email_leads ON public.leads;
CREATE TRIGGER trg_validate_email_leads BEFORE INSERT OR UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.validate_email();

-- Documents
DROP TRIGGER IF EXISTS trg_update_updated_at_documents ON public.documents;
CREATE TRIGGER trg_update_updated_at_documents BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Services
DROP TRIGGER IF EXISTS trg_update_updated_at_services ON public.services;
CREATE TRIGGER trg_update_updated_at_services BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Service requests
DROP TRIGGER IF EXISTS trg_generate_service_request_reference ON public.service_requests;
CREATE TRIGGER trg_generate_service_request_reference BEFORE INSERT ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.generate_service_request_reference();

-- Referrals
DROP TRIGGER IF EXISTS trg_generate_referral_code ON public.referrals;
CREATE TRIGGER trg_generate_referral_code BEFORE INSERT ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

-- Payments
DROP TRIGGER IF EXISTS trg_crm_log_payment ON public.payments;
CREATE TRIGGER trg_crm_log_payment AFTER UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.crm_log_payment();

DROP TRIGGER IF EXISTS trg_trigger_profit_share ON public.payments;
CREATE TRIGGER trg_trigger_profit_share AFTER UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.trigger_profit_share_on_payment();

-- Journal entries
DROP TRIGGER IF EXISTS trg_assign_journal_number ON public.journal_entries;
CREATE TRIGGER trg_assign_journal_number BEFORE INSERT ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.assign_journal_number();

-- Professional service enrollments
DROP TRIGGER IF EXISTS trg_enforce_enrollment_price_floor ON public.professional_service_enrollments;
CREATE TRIGGER trg_enforce_enrollment_price_floor BEFORE INSERT OR UPDATE ON public.professional_service_enrollments FOR EACH ROW EXECUTE FUNCTION public.enforce_enrollment_price_floor();