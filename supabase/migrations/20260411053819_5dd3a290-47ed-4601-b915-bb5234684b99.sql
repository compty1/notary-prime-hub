-- GAP-0323: Update handle_new_user to read admin email from platform_settings instead of hardcoding
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_email_setting TEXT;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  -- Read admin email from platform_settings instead of hardcoding
  SELECT setting_value INTO admin_email_setting
  FROM public.platform_settings
  WHERE setting_key = 'admin_email';

  IF admin_email_setting IS NOT NULL AND LOWER(NEW.email) = LOWER(admin_email_setting) THEN
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
$function$;

-- GAP-0325: Restrict audit_log inserts to authenticated users only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert audit log' AND tablename = 'audit_log'
  ) THEN
    CREATE POLICY "Authenticated users can insert audit log"
    ON public.audit_log FOR INSERT TO authenticated
    WITH CHECK (true);
  END IF;
  
  -- Drop any existing anon insert policy if it exists
  BEGIN
    DROP POLICY IF EXISTS "Allow anonymous audit inserts" ON public.audit_log;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- GAP-0324: Fix crm_log_payment to handle webhook context (no auth.uid)
CREATE OR REPLACE FUNCTION public.crm_log_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'paid' THEN
    INSERT INTO public.crm_activities (contact_id, contact_type, activity_type, subject, body, created_by)
    VALUES (
      NEW.client_id,
      'client',
      'payment',
      'Payment received $' || NEW.amount::text,
      'Payment of $' || NEW.amount::text || ' received via ' || COALESCE(NEW.method, 'unknown'),
      COALESCE(auth.uid(), NEW.client_id)
    );
  END IF;
  RETURN NEW;
END;
$function$;