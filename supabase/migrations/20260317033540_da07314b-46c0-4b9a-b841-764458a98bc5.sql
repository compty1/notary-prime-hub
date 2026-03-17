
-- Create notary_invites table
CREATE TABLE public.notary_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);
ALTER TABLE public.notary_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invites" ON public.notary_invites FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create client_correspondence table
CREATE TABLE public.client_correspondence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  direction text NOT NULL DEFAULT 'inbound',
  subject text NOT NULL,
  body text NOT NULL,
  from_address text,
  to_address text,
  status text NOT NULL DEFAULT 'pending',
  handled_by uuid,
  handled_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_correspondence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage correspondence" ON public.client_correspondence FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Notaries view correspondence" ON public.client_correspondence FOR SELECT USING (public.has_role(auth.uid(), 'notary'));
CREATE POLICY "Clients view own correspondence" ON public.client_correspondence FOR SELECT USING (auth.uid() = client_id);

-- Update handle_new_user for admin auto-assign and notary invite handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  IF LOWER(NEW.email) = LOWER('ShaneGoble@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF EXISTS (SELECT 1 FROM public.notary_invites WHERE LOWER(email) = LOWER(NEW.email) AND status = 'pending') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'notary')
    ON CONFLICT (user_id, role) DO NOTHING;
    UPDATE public.notary_invites SET status = 'accepted', accepted_at = now() WHERE LOWER(email) = LOWER(NEW.email) AND status = 'pending';
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Allow notaries limited access
CREATE POLICY "Notaries view appointments" ON public.appointments FOR SELECT USING (public.has_role(auth.uid(), 'notary'));
CREATE POLICY "Notaries manage journal" ON public.notary_journal FOR ALL USING (public.has_role(auth.uid(), 'notary'));
CREATE POLICY "Notaries view profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'notary'));
