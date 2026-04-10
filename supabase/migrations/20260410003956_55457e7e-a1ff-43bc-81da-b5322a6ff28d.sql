
-- Fix session_tracking (idempotent)
DROP POLICY IF EXISTS "Anyone can view tracking by token" ON public.session_tracking;

-- Remove leads from Realtime to prevent PII broadcast
ALTER PUBLICATION supabase_realtime DROP TABLE public.leads;

-- Remove client_correspondence (contains sensitive client data)
ALTER PUBLICATION supabase_realtime DROP TABLE public.client_correspondence;
