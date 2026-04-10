
-- ============================================================
-- ATTACH ALL CRITICAL BUSINESS TRIGGERS
-- These functions already exist; we just need CREATE TRIGGER.
-- ============================================================

-- 1. Appointments: prevent double-booking (slot-level)
DROP TRIGGER IF EXISTS trg_prevent_double_booking ON public.appointments;
CREATE TRIGGER trg_prevent_double_booking
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.prevent_double_booking();

-- 2. Appointments: prevent duplicate client booking (same client+date+time)
DROP TRIGGER IF EXISTS trg_prevent_duplicate_client_booking ON public.appointments;
CREATE TRIGGER trg_prevent_duplicate_client_booking
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_client_booking();

-- 3. Appointments: block past dates
DROP TRIGGER IF EXISTS trg_validate_appointment_date ON public.appointments;
CREATE TRIGGER trg_validate_appointment_date
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.validate_appointment_date();

-- 4. Appointments: signer count >= 1
DROP TRIGGER IF EXISTS trg_validate_signer_count ON public.appointments;
CREATE TRIGGER trg_validate_signer_count
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.validate_signer_count();

-- 5. Appointments: auto-generate confirmation number
DROP TRIGGER IF EXISTS trg_generate_confirmation_number ON public.appointments;
CREATE TRIGGER trg_generate_confirmation_number
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.generate_confirmation_number();

-- 6. Appointments: CRM activity on status change
DROP TRIGGER IF EXISTS trg_crm_log_appointment_status ON public.appointments;
CREATE TRIGGER trg_crm_log_appointment_status
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.crm_log_appointment_status();

-- 7. Appointments: updated_at
DROP TRIGGER IF EXISTS trg_appointments_updated_at ON public.appointments;
CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Notarization sessions: enforce KBA limit (ORC §147.66)
DROP TRIGGER IF EXISTS trg_enforce_kba_limit ON public.notarization_sessions;
CREATE TRIGGER trg_enforce_kba_limit
  BEFORE INSERT OR UPDATE ON public.notarization_sessions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_kba_limit();

-- 9. Notarization sessions: enforce recording consent (ORC §147.63)
DROP TRIGGER IF EXISTS trg_enforce_recording_consent ON public.notarization_sessions;
CREATE TRIGGER trg_enforce_recording_consent
  BEFORE UPDATE ON public.notarization_sessions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_recording_consent();

-- 10. Notarization sessions: set 10-year retention (ORC §147.66)
DROP TRIGGER IF EXISTS trg_set_retention_expires_at ON public.notarization_sessions;
CREATE TRIGGER trg_set_retention_expires_at
  BEFORE INSERT ON public.notarization_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_retention_expires_at();

-- 11. Notarization sessions: enforce RON retention on recording
DROP TRIGGER IF EXISTS trg_enforce_ron_retention ON public.notarization_sessions;
CREATE TRIGGER trg_enforce_ron_retention
  BEFORE INSERT OR UPDATE ON public.notarization_sessions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_ron_retention();

-- 12. Notarization sessions: auto-generate session unique ID
DROP TRIGGER IF EXISTS trg_generate_session_unique_id ON public.notarization_sessions;
CREATE TRIGGER trg_generate_session_unique_id
  BEFORE INSERT ON public.notarization_sessions
  FOR EACH ROW EXECUTE FUNCTION public.generate_session_unique_id();

-- 13. Journal entries: auto-assign journal number (NTR-YYYYMMDD-XXXXXX)
DROP TRIGGER IF EXISTS trg_assign_journal_number ON public.journal_entries;
CREATE TRIGGER trg_assign_journal_number
  BEFORE INSERT ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.assign_journal_number();

-- 14. Payments: CRM log on payment
DROP TRIGGER IF EXISTS trg_crm_log_payment ON public.payments;
CREATE TRIGGER trg_crm_log_payment
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.crm_log_payment();

-- 15. Payments: trigger profit share calculation
DROP TRIGGER IF EXISTS trg_profit_share_on_payment ON public.payments;
CREATE TRIGGER trg_profit_share_on_payment
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_profit_share_on_payment();

-- 16. Profiles: validate email format
DROP TRIGGER IF EXISTS trg_validate_email ON public.profiles;
CREATE TRIGGER trg_validate_email
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_email();

-- 17. Professional service enrollments: enforce price floor
DROP TRIGGER IF EXISTS trg_enforce_enrollment_price_floor ON public.professional_service_enrollments;
CREATE TRIGGER trg_enforce_enrollment_price_floor
  BEFORE INSERT OR UPDATE ON public.professional_service_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_enrollment_price_floor();

-- 18. Referrals: auto-generate referral code
DROP TRIGGER IF EXISTS trg_generate_referral_code ON public.referrals;
CREATE TRIGGER trg_generate_referral_code
  BEFORE INSERT ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

-- 19. Service requests: auto-generate reference number
DROP TRIGGER IF EXISTS trg_generate_service_request_reference ON public.service_requests;
CREATE TRIGGER trg_generate_service_request_reference
  BEFORE INSERT ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.generate_service_request_reference();

-- 20. Leads: validate email
DROP TRIGGER IF EXISTS trg_validate_lead_email ON public.leads;
CREATE TRIGGER trg_validate_lead_email
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.validate_email();

-- 21-24. Updated_at triggers for key tables
DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_service_requests_updated_at ON public.service_requests;
CREATE TRIGGER trg_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
