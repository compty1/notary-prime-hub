-- Make platform_settings readable by anonymous users (for pricing on booking page)
DO $$ BEGIN
  CREATE POLICY "Anyone can read public settings"
    ON public.platform_settings FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create storage policies for documents bucket
DO $$ BEGIN
  CREATE POLICY "Authenticated users can upload documents"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'documents');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own documents"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'documents');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage all stored documents"
    ON storage.objects FOR ALL TO authenticated
    USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;