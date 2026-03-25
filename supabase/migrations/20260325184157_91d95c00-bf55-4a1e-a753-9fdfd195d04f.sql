
-- Only what wasn't applied yet: trigger, triggers, realtime, indexes, profiles delete, storage view/delete/update policies
-- The handle_new_user trigger, updated_at triggers, realtime, indexes, and profiles delete policy were applied
-- Storage INSERT policy already exists, so skip it

-- Drop and recreate storage policies with better names
DROP POLICY IF EXISTS "Users can view own documents storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents storage" ON storage.objects;

CREATE POLICY "Users can view own documents storage" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'notary'::app_role)));
CREATE POLICY "Users can delete own documents storage" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can update own documents storage" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::app_role)));
