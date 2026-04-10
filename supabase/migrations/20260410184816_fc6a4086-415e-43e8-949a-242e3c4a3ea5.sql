-- Insert missing profile for admin user
INSERT INTO public.profiles (user_id, full_name, email)
VALUES ('2866e280-00e0-4974-a0d4-8f8ea9b92093', 'Shane Goble', 'shanegoble@gmail.com')
ON CONFLICT (user_id) DO NOTHING;