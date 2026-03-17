CREATE TABLE public.e_seal_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  document_name text NOT NULL,
  signer_name text,
  notary_name text NOT NULL DEFAULT 'Shane Goble',
  commissioned_state text NOT NULL DEFAULT 'OH',
  notarized_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'valid',
  verification_note text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT e_seal_verifications_document_id_key UNIQUE (document_id)
);

ALTER TABLE public.e_seal_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage e-seal verifications"
ON public.e_seal_verifications
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can verify active e-seals"
ON public.e_seal_verifications
FOR SELECT
TO anon, authenticated
USING (status = 'valid' AND revoked_at IS NULL);