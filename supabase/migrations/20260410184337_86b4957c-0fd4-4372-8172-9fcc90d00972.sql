-- =============================================
-- Cleanup duplicate triggers across all tables
-- Keep only trg_ prefixed standardized triggers
-- =============================================

-- PROFILES: Remove 7 duplicates, keep trg_profiles_updated_at + trg_validate_email_profiles
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
DROP TRIGGER IF EXISTS trg_update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS trg_update_updated_at_profiles ON public.profiles;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS trg_validate_email ON public.profiles;
DROP TRIGGER IF EXISTS validate_email_trigger ON public.profiles;
DROP TRIGGER IF EXISTS validate_profile_email_trigger ON public.profiles;
DROP TRIGGER IF EXISTS validate_profiles_email ON public.profiles;

-- PAYMENTS: Remove 4 duplicates, keep trg_payments_updated_at + trg_crm_log_payment + trg_profit_share_on_payment
DROP TRIGGER IF EXISTS set_updated_at_payments ON public.payments;
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
DROP TRIGGER IF EXISTS trg_crm_payment ON public.payments;
DROP TRIGGER IF EXISTS trg_trigger_profit_share ON public.payments;

-- NOTARY_JOURNAL: Remove 2 duplicates, keep trg_notary_journal_updated_at
DROP TRIGGER IF EXISTS set_updated_at_notary_journal ON public.notary_journal;
DROP TRIGGER IF EXISTS update_notary_journal_updated_at ON public.notary_journal;

-- SERVICE_REQUESTS: Remove 3 duplicates, keep trg_service_requests_updated_at + trg_generate_service_request_reference
DROP TRIGGER IF EXISTS set_service_requests_updated_at ON public.service_requests;
DROP TRIGGER IF EXISTS set_updated_at_service_requests ON public.service_requests;
DROP TRIGGER IF EXISTS update_service_requests_updated_at ON public.service_requests;
DROP TRIGGER IF EXISTS trg_generate_sr_reference ON public.service_requests;

-- NOTARIZATION_SESSIONS: Remove 1 duplicate
DROP TRIGGER IF EXISTS update_notarization_sessions_updated_at ON public.notarization_sessions;
