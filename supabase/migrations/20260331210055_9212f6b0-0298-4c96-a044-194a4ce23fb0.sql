
-- Add notary-specific columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS commission_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS commission_expiration date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS eo_policy_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS eo_expiration date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bond_company text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bond_amount numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seal_file_path text;
