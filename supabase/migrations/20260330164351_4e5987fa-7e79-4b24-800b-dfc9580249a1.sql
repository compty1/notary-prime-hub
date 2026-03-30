
ALTER TABLE public.notarization_sessions RENAME COLUMN onenotary_session_id TO signnow_document_id;
ALTER TABLE public.notary_journal RENAME COLUMN onenotary_fee TO platform_fee;
CREATE INDEX IF NOT EXISTS idx_notarization_sessions_signnow_doc_id ON public.notarization_sessions (signnow_document_id);
