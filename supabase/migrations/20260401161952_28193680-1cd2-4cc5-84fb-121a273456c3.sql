
-- HubSpot CRM columns on leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS hubspot_contact_id text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS hubspot_deal_id text;

-- Document tags
CREATE TABLE IF NOT EXISTS public.document_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  tag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_id, tag)
);
ALTER TABLE public.document_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage document tags" ON public.document_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Notification preferences already exists, just ensure index
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_document ON public.document_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_tag ON public.document_tags(tag);
