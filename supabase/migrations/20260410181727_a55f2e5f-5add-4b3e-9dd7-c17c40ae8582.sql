-- Add esign consent columns to notarization_sessions
ALTER TABLE public.notarization_sessions 
  ADD COLUMN IF NOT EXISTS esign_consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS esign_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS attestation_confirmed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS attestation_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS attestation_notes text,
  ADD COLUMN IF NOT EXISTS visual_match_confirmed boolean DEFAULT false;

-- Enable RLS on form_library (item 392)
ALTER TABLE public.form_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view forms"
  ON public.form_library FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage forms"
  ON public.form_library FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));