
ALTER TABLE public.document_versions
  ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS snapshot_html TEXT,
  ADD COLUMN IF NOT EXISTS label TEXT,
  ADD COLUMN IF NOT EXISTS is_autosave BOOLEAN DEFAULT true;

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_versions' AND policyname = 'Users can view own doc versions') THEN
    CREATE POLICY "Users can view own doc versions"
    ON public.document_versions FOR SELECT TO authenticated
    USING (uploaded_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_versions' AND policyname = 'Users can create doc versions') THEN
    CREATE POLICY "Users can create doc versions"
    ON public.document_versions FOR INSERT TO authenticated
    WITH CHECK (uploaded_by = auth.uid());
  END IF;
END $$;
