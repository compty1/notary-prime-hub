-- Chat RLS: allow clients to see admin replies
CREATE POLICY "Clients can view admin replies"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (is_admin = true);

-- Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Add admin_notes column to profiles for admin internal notes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_notes text;

-- Update handle_new_user to also store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  RETURN NEW;
END;
$$;