-- Storage policies for documents bucket
CREATE POLICY "Auth users upload own docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Auth users read own docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'notary')));

CREATE POLICY "Admins delete docs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));