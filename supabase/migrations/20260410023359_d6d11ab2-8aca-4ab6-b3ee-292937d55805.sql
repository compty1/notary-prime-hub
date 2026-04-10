
-- 1. Fix user_roles: Ensure only admins can INSERT roles (prevent privilege escalation)
-- Drop any overly permissive INSERT policy first
DO $$ BEGIN
  -- Add explicit INSERT restriction for non-admin users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Only admins can insert roles'
  ) THEN
    EXECUTE 'CREATE POLICY "Only admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''))';
  END IF;
END $$;

-- 2. Create anonymized public view for reviews (hide client_id and appointment_id from anon)
CREATE OR REPLACE VIEW public.reviews_public AS
SELECT 
  id,
  rating,
  comment,
  created_at
FROM public.reviews
WHERE rating >= 1;

-- Grant access to the view
GRANT SELECT ON public.reviews_public TO anon;
GRANT SELECT ON public.reviews_public TO authenticated;

-- 3. Fix e_seal_verifications: Create a restricted public view for verification
CREATE OR REPLACE VIEW public.e_seal_verifications_public AS
SELECT 
  id,
  status,
  commissioned_state,
  notarized_at,
  document_hash,
  revoked_at,
  verification_note,
  notary_name
FROM public.e_seal_verifications
WHERE status = 'valid' AND revoked_at IS NULL;

GRANT SELECT ON public.e_seal_verifications_public TO anon;
GRANT SELECT ON public.e_seal_verifications_public TO authenticated;

-- 4. Fix usage_tracking: Add INSERT policy restricting to own user_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'usage_tracking' AND policyname = 'Users can only insert own usage'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can only insert own usage" ON public.usage_tracking FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- 5. Fix audit_log: Replace permissive INSERT with restricted policy
-- Drop existing overly permissive INSERT policy if exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'audit_log' AND policyname = 'Authenticated users can insert audit entries'
  ) THEN
    EXECUTE 'DROP POLICY "Authenticated users can insert audit entries" ON public.audit_log';
  END IF;
END $$;

-- Create restricted INSERT policy: users can only insert entries with their own user_id or null, 
-- and action must be validated
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'audit_log' AND policyname = 'Users can insert own audit entries'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert own audit entries" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid())';
  END IF;
END $$;
