-- =============================================
-- BATCH 2: service_requests table, constraints, RON compliance
-- =============================================

-- Item 72/170: Create missing service_requests table
CREATE TABLE IF NOT EXISTS public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  service_name text NOT NULL,
  intake_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage service requests" ON public.service_requests
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients view own service requests" ON public.service_requests
  FOR SELECT TO public USING (auth.uid() = client_id);

CREATE POLICY "Clients create service requests" ON public.service_requests
  FOR INSERT TO public WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Notaries view service requests" ON public.service_requests
  FOR SELECT TO public USING (has_role(auth.uid(), 'notary'::app_role));

CREATE TRIGGER set_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_service_requests_client_id ON public.service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);

-- Item 91: Unique constraint on profiles.user_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_unique') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Item 97: Unique constraint on email_cache.message_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_cache_message_id_unique') THEN
    ALTER TABLE public.email_cache ADD CONSTRAINT email_cache_message_id_unique UNIQUE (message_id);
  END IF;
END $$;

-- Item 98: Unique constraint on email_unsubscribe_tokens.token
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_unsubscribe_tokens_token_unique') THEN
    ALTER TABLE public.email_unsubscribe_tokens ADD CONSTRAINT email_unsubscribe_tokens_token_unique UNIQUE (token);
  END IF;
END $$;

-- Item 99: Index on email_unsubscribe_tokens.email
CREATE INDEX IF NOT EXISTS idx_email_unsubscribe_tokens_email ON public.email_unsubscribe_tokens(email);

-- Item 101: Check constraint on time_slots.day_of_week (0-6)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'time_slots_day_of_week_check') THEN
    ALTER TABLE public.time_slots ADD CONSTRAINT time_slots_day_of_week_check CHECK (day_of_week >= 0 AND day_of_week <= 6);
  END IF;
END $$;

-- Item 105/106: Mark duplicate column
COMMENT ON COLUMN public.notary_journal.platform_fees IS 'DEPRECATED: Use platform_fee instead.';

-- Item 108: Email validation function and triggers
CREATE OR REPLACE FUNCTION public.validate_email()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format: %', NEW.email;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER validate_profiles_email
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION validate_email();

CREATE TRIGGER validate_leads_email
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION validate_email();

-- Item 111: Unique constraint on business_members(business_id, user_id)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'business_members_business_user_unique') THEN
    ALTER TABLE public.business_members ADD CONSTRAINT business_members_business_user_unique UNIQUE (business_id, user_id);
  END IF;
END $$;

-- Item 295: session_unique_id for ORC §147.66
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notarization_sessions' AND column_name='session_unique_id') THEN
    ALTER TABLE public.notarization_sessions ADD COLUMN session_unique_id text;
  END IF;
END $$;

-- Item 334: recording_consent columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notarization_sessions' AND column_name='recording_consent') THEN
    ALTER TABLE public.notarization_sessions ADD COLUMN recording_consent boolean DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notarization_sessions' AND column_name='recording_consent_at') THEN
    ALTER TABLE public.notarization_sessions ADD COLUMN recording_consent_at timestamptz;
  END IF;
END $$;

-- Item 296: signer_location_state for jurisdictional verification
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notarization_sessions' AND column_name='signer_location_state') THEN
    ALTER TABLE public.notarization_sessions ADD COLUMN signer_location_state text;
  END IF;
END $$;

-- Auto-generate session_unique_id
CREATE OR REPLACE FUNCTION public.generate_session_unique_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.session_unique_id IS NULL THEN
    NEW.session_unique_id := 'RON-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER set_session_unique_id
  BEFORE INSERT ON public.notarization_sessions
  FOR EACH ROW EXECUTE FUNCTION generate_session_unique_id();

-- Enable realtime for service_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;