
-- Remove sensitive tables from Realtime publication (no IF EXISTS supported)
ALTER PUBLICATION supabase_realtime DROP TABLE public.email_cache;
ALTER PUBLICATION supabase_realtime DROP TABLE public.ron_credential_analysis;
ALTER PUBLICATION supabase_realtime DROP TABLE public.session_tracking;
ALTER PUBLICATION supabase_realtime DROP TABLE public.signnow_documents;

-- Add UPDATE policy on signatures storage bucket
CREATE POLICY "Users update own signatures"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'signatures' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add SELECT policy for pricing_rules for authenticated users
CREATE POLICY "Authenticated users can read active pricing rules"
  ON public.pricing_rules
  FOR SELECT
  TO authenticated
  USING (is_active = true);
