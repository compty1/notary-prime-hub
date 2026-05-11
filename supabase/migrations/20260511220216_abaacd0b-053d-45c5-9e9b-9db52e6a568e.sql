-- Revoke from anon for queries that should require sign-in
REVOKE EXECUTE ON FUNCTION public.check_journal_completeness(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_client_lifetime_value(uuid) FROM anon, public;

-- Revoke from authenticated on trigger-only and internal helpers (these run as the
-- function owner via SECURITY DEFINER and should never be invoked through PostgREST).
DO $$
DECLARE
  fn record;
  trigger_only_fns text[] := ARRAY[
    'handle_new_user','generate_referral_code','generate_session_unique_id','generate_order_number',
    'generate_confirmation_number','generate_certificate_number','generate_service_request_reference',
    'assign_journal_number','encrypt_journal_id_number','enforce_recording_consent','enforce_kba_limit',
    'enforce_ron_retention','enforce_enrollment_price_floor','set_retention_expires_at','validate_signer_count',
    'validate_email','validate_appointment_date','prevent_double_booking','prevent_duplicate_client_booking',
    'block_premature_journal_delete','block_premature_ron_recording_delete','cleanup_notary_page_data',
    'crm_log_payment','crm_log_appointment_status','trigger_profit_share_on_payment',
    'record_appointment_status_change','update_updated_at_column'
  ];
BEGIN
  FOR fn IN
    SELECT n.nspname AS schema, p.proname AS name, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.proname = ANY(trigger_only_fns)
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM authenticated, anon, public', fn.name, fn.args);
  END LOOP;
END $$;