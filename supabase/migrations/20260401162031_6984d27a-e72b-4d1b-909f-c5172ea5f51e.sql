
DROP POLICY IF EXISTS "Authenticated users can manage document tags" ON public.document_tags;

CREATE POLICY "Users manage tags on own documents" ON public.document_tags
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_tags.document_id
      AND d.uploaded_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_tags.document_id
      AND d.uploaded_by = auth.uid()
    )
  );
