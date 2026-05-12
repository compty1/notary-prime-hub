ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS google_event_id TEXT,
  ADD COLUMN IF NOT EXISTS gcal_calendar_id TEXT,
  ADD COLUMN IF NOT EXISTS calendar_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS calendar_sync_status TEXT,
  ADD COLUMN IF NOT EXISTS calendar_sync_error TEXT,
  ADD COLUMN IF NOT EXISTS calendar_html_link TEXT;

CREATE INDEX IF NOT EXISTS idx_appointments_google_event_id
  ON public.appointments (google_event_id)
  WHERE google_event_id IS NOT NULL;