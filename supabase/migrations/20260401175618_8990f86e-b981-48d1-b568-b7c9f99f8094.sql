CREATE TABLE public.document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  file_path text NOT NULL,
  file_name text NOT NULL,
  uploaded_by uuid NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_versions_doc ON public.document_versions (document_id, version_number DESC);

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own document versions"
ON public.document_versions
FOR SELECT
TO authenticated
USING (
  uploaded_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'notary')
);

CREATE POLICY "Users can insert their own document versions"
ON public.document_versions
FOR INSERT
TO authenticated
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Admins can manage all document versions"
ON public.document_versions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));