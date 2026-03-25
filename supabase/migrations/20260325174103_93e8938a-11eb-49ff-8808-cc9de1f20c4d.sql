
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_path text;

CREATE TABLE IF NOT EXISTS public.notary_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  certification_name text NOT NULL,
  issuing_body text,
  certification_number text,
  issued_date date,
  expiry_date date,
  file_path text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notary_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage certs" ON public.notary_certifications FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own certs" ON public.notary_certifications FOR SELECT USING (auth.uid() = user_id);
