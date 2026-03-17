
-- Add OneNotary columns to notarization_sessions
ALTER TABLE public.notarization_sessions 
ADD COLUMN IF NOT EXISTS onenotary_session_id text,
ADD COLUMN IF NOT EXISTS participant_link text;

-- Add stripe_customer_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id text;
