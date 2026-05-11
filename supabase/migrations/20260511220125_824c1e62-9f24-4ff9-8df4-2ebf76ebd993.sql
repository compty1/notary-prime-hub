DO $$
DECLARE
  fn record;
  internal_fns text[] := ARRAY[
    'handle_new_user','generate_referral_code','generate_session_unique_id','generate_order_number',
    'generate_confirmation_number','generate_certificate_number','generate_service_request_reference',
    'assign_journal_number','encrypt_journal_id_number','enforce_recording_consent','enforce_kba_limit',
    'enforce_ron_retention','enforce_enrollment_price_floor','set_retention_expires_at','validate_signer_count',
    'validate_email','validate_appointment_date','prevent_double_booking','prevent_duplicate_client_booking',
    'block_premature_journal_delete','block_premature_ron_recording_delete','cleanup_notary_page_data',
    'crm_log_payment','crm_log_appointment_status','trigger_profit_share_on_payment','calculate_profit_share',
    'create_per_document_journal_entries','record_appointment_status_change','update_updated_at_column',
    'enqueue_email','read_email_batch','delete_email','move_to_dlq'
  ];
BEGIN
  FOR fn IN
    SELECT n.nspname AS schema, p.proname AS name, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY(internal_fns)
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon', fn.name, fn.args);
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS public.ron_session_hash_chain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  sequence_no INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  previous_hash TEXT,
  step_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE (session_id, sequence_no)
);

CREATE INDEX IF NOT EXISTS idx_ron_hash_chain_session ON public.ron_session_hash_chain (session_id, sequence_no);
ALTER TABLE public.ron_session_hash_chain ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notary or admin can view session hash chain"
  ON public.ron_session_hash_chain FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.notarization_sessions s
      JOIN public.appointments a ON a.id = s.appointment_id
      WHERE s.id = ron_session_hash_chain.session_id
        AND (a.notary_id = auth.uid() OR a.client_id = auth.uid())
    )
  );

CREATE POLICY "Session participants can append hash chain entries"
  ON public.ron_session_hash_chain FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.notarization_sessions s
      JOIN public.appointments a ON a.id = s.appointment_id
      WHERE s.id = ron_session_hash_chain.session_id
        AND (a.notary_id = auth.uid() OR a.client_id = auth.uid())
    )
  );

CREATE POLICY "Hash chain entries are immutable"
  ON public.ron_session_hash_chain FOR UPDATE TO authenticated USING (false);

CREATE POLICY "Hash chain entries cannot be deleted"
  ON public.ron_session_hash_chain FOR DELETE TO authenticated USING (false);