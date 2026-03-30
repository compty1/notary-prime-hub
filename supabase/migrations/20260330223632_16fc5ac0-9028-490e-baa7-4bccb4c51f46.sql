
-- ==========================================================
-- 1. FIX: Storage upload policy bypass (storage_upload_bypass)
--    Drop the two overly permissive INSERT policies on documents bucket.
--    Keep only "Users can upload own documents" which enforces path scoping.
-- ==========================================================
DROP POLICY IF EXISTS "Auth users upload own docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;

-- ==========================================================
-- 2. FIX: Notary chat overprivilege (notary_reads_all_chat)
--    Replace broad ALL policy with scoped SELECT/INSERT only for
--    messages the notary sent or received.
-- ==========================================================
DROP POLICY IF EXISTS "Notaries manage chat" ON public.chat_messages;

CREATE POLICY "Notaries view own chat"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'notary'::app_role)
  AND (sender_id = auth.uid() OR recipient_id = auth.uid())
);

CREATE POLICY "Notaries send chat"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'notary'::app_role)
  AND sender_id = auth.uid()
);

CREATE POLICY "Notaries update own chat"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'notary'::app_role)
  AND sender_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'notary'::app_role)
  AND sender_id = auth.uid()
);

-- ==========================================================
-- 3. FIX: Audit log injection (audit_log_injection)
--    Drop the permissive client INSERT policy.
--    Create a SECURITY DEFINER function for controlled inserts
--    that forces user_id from auth.uid().
-- ==========================================================
DROP POLICY IF EXISTS "Authenticated users can insert audit log" ON public.audit_log;

-- Service role can insert (for edge functions)
CREATE POLICY "Service role can insert audit log"
ON public.audit_log FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role'::text);

-- SECURITY DEFINER function so authenticated users can log via RPC
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _entity_type text DEFAULT NULL,
  _entity_id uuid DEFAULT NULL,
  _details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate action length
  IF length(_action) > 100 THEN
    RAISE EXCEPTION 'Action too long';
  END IF;
  IF _entity_type IS NOT NULL AND length(_entity_type) > 50 THEN
    RAISE EXCEPTION 'Entity type too long';
  END IF;

  INSERT INTO public.audit_log (action, entity_type, entity_id, details, user_id)
  VALUES (_action, _entity_type, _entity_id, _details, auth.uid());
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.log_audit_event(text, text, uuid, jsonb) TO authenticated;

-- ==========================================================
-- 4. FIX: Leads PII exposure to notaries (leads_table_notary_readable)
--    Drop the broad notary SELECT policy on leads.
-- ==========================================================
DROP POLICY IF EXISTS "Notaries view leads" ON public.leads;
