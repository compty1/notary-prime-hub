
ALTER TABLE public.email_cache ADD COLUMN IF NOT EXISTS lead_extracted boolean NOT NULL DEFAULT false;

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email_cache_id uuid;

ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
