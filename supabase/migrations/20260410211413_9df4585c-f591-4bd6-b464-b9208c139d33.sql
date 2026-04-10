
-- C002: Allow authenticated uploads to notary-pages folder  
CREATE POLICY "Authenticated upload notary page assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'notary-pages'
);

-- C003: Allow public read of notary page assets (for published pages)
CREATE POLICY "Public read notary page assets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'notary-pages'
);

-- Allow authenticated users to update their own notary page uploads
CREATE POLICY "Authenticated update notary page assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'notary-pages'
);
