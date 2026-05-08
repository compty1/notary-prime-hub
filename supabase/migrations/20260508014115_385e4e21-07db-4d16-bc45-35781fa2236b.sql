-- Lock down execute on sensitive SECURITY DEFINER functions added in V2 hardening
REVOKE EXECUTE ON FUNCTION public.reveal_notary_journal_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reveal_notary_journal_id(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.log_audit_event(text, text, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_audit_event(text, text, uuid, jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon;