
-- Performance indexes (Bugs 687-700)
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact_id ON public.crm_activities (contact_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON public.appointments (scheduled_date, status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_content_posts_status ON public.content_posts (status);

-- FC-1: Add document_reviews table for AI review results
CREATE TABLE IF NOT EXISTS public.document_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  reviewed_by UUID NOT NULL,
  overall_status TEXT NOT NULL DEFAULT 'warning',
  score INTEGER NOT NULL DEFAULT 50,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage document reviews" ON public.document_reviews
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own document reviews" ON public.document_reviews
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_reviews.document_id AND d.uploaded_by = auth.uid())
  );

CREATE POLICY "Users create own document reviews" ON public.document_reviews
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_reviews.document_id AND d.uploaded_by = auth.uid())
    AND reviewed_by = auth.uid()
  );

-- FC-4: Make form_library accessible to clients for templates page (Bug 698)
CREATE POLICY "Clients view form library" ON public.form_library
  FOR SELECT TO authenticated USING (true);

-- Fix platform_settings RLS: admin-only reads (Bug 681)
-- Drop existing permissive policy if any, add admin-only
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_settings' AND policyname = 'Authenticated read settings') THEN
    DROP POLICY "Authenticated read settings" ON public.platform_settings;
  END IF;
END $$;

CREATE POLICY "Admins read settings" ON public.platform_settings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
