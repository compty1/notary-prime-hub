
-- 1. Create signnow_documents tracking table
CREATE TABLE public.signnow_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL DEFAULT '',
  signnow_document_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  invite_sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  signnow_emails_sent JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_signnow_documents_appointment ON public.signnow_documents(appointment_id);
CREATE UNIQUE INDEX idx_signnow_documents_doc_id ON public.signnow_documents(signnow_document_id);

ALTER TABLE public.signnow_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage signnow_documents"
  ON public.signnow_documents FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view own signnow_documents"
  ON public.signnow_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = signnow_documents.appointment_id
      AND a.client_id = auth.uid()
    )
  );

CREATE TRIGGER update_signnow_documents_updated_at
  BEFORE UPDATE ON public.signnow_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.signnow_documents;

-- 2. Add external order columns to service_requests
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS source_platform TEXT NOT NULL DEFAULT 'notardex',
  ADD COLUMN IF NOT EXISTS external_order_id TEXT,
  ADD COLUMN IF NOT EXISTS external_payment_status TEXT,
  ADD COLUMN IF NOT EXISTS external_payment_amount NUMERIC;
