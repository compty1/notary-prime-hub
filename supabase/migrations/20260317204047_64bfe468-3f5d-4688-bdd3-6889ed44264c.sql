CREATE TABLE public.form_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);
ALTER TABLE public.form_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage form library" ON public.form_library FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Notaries view form library" ON public.form_library FOR SELECT USING (public.has_role(auth.uid(), 'notary'));