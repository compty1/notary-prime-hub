ALTER TABLE public.apostille_requests
  ADD COLUMN IF NOT EXISTS destination_country text,
  ADD COLUMN IF NOT EXISTS document_count integer NOT NULL DEFAULT 1;