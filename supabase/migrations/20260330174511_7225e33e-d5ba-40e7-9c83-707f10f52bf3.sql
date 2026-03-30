ALTER TABLE public.notarization_sessions 
ADD COLUMN IF NOT EXISTS webhook_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS webhook_events_registered integer DEFAULT 0;