ALTER TABLE public.notarization_sessions
  ADD COLUMN IF NOT EXISTS session_mode text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS signing_platform text DEFAULT 'signnow',
  ADD COLUMN IF NOT EXISTS signer_email text,
  ADD COLUMN IF NOT EXISTS document_name text;