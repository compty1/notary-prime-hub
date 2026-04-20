-- Sprint A — Critical security hardening (BUG-0784..0793)

-- 1a. Masked view of notary_journal IDs (only last 4 visible)
CREATE OR REPLACE VIEW public.notary_journal_masked AS
SELECT
  nj.*,
  CASE
    WHEN nj.id_number IS NOT NULL AND length(nj.id_number) >= 4
      THEN '****' || right(nj.id_number, 4)
    ELSE NULL
  END AS id_number_masked
FROM public.notary_journal nj;

-- 1b. Audit-logged reveal RPC for full notary_journal ID
CREATE OR REPLACE FUNCTION public.reveal_notary_journal_id(_journal_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_id text;
  v_owner uuid;
BEGIN
  SELECT id_number, notary_user_id
    INTO v_id, v_owner
  FROM public.notary_journal
  WHERE id = _journal_id;

  IF v_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF auth.uid() IS DISTINCT FROM v_owner
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  INSERT INTO public.audit_log (action, entity_type, entity_id, user_id, details)
  VALUES (
    'reveal_notary_journal_id',
    'notary_journal',
    _journal_id,
    auth.uid(),
    jsonb_build_object('revealed_at', now())
  );

  RETURN v_id;
END;
$func$;

REVOKE ALL ON FUNCTION public.reveal_notary_journal_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reveal_notary_journal_id(uuid) TO authenticated;

-- 2. amortized_expenses: scope to owner (BUG-0786)
ALTER TABLE public.amortized_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ae_select_own"   ON public.amortized_expenses;
DROP POLICY IF EXISTS "ae_insert_own"   ON public.amortized_expenses;
DROP POLICY IF EXISTS "ae_update_own"   ON public.amortized_expenses;
DROP POLICY IF EXISTS "ae_delete_own"   ON public.amortized_expenses;
DROP POLICY IF EXISTS "ae_admin_all"    ON public.amortized_expenses;

CREATE POLICY "ae_select_own" ON public.amortized_expenses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ae_insert_own" ON public.amortized_expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ae_update_own" ON public.amortized_expenses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ae_delete_own" ON public.amortized_expenses
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "ae_admin_all" ON public.amortized_expenses
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 3. platform_settings: explicit allowlist for anon/public reads (BUG-0785)
DO $cleanup$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename='platform_settings'
      AND (policyname ILIKE '%anon%' OR policyname ILIKE '%public%' OR policyname ILIKE '%read%' OR policyname ILIKE '%select%' OR policyname ILIKE '%view%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.platform_settings;', r.policyname);
  END LOOP;
END
$cleanup$;

DROP POLICY IF EXISTS "ps_anon_allowlist_read" ON public.platform_settings;
CREATE POLICY "ps_anon_allowlist_read" ON public.platform_settings
  FOR SELECT
  USING (
    setting_key = ANY (ARRAY[
      'site_name','site_tagline',
      'brand_primary_color','brand_secondary_color','brand_accent_color','brand_logo_url',
      'business_hours_label','copyright_text',
      'notary_phone','notary_email','contact_email','support_email',
      'order_auto_number_prefix','public_announcement','timezone','currency'
    ])
  );

DROP POLICY IF EXISTS "ps_admin_all" ON public.platform_settings;
CREATE POLICY "ps_admin_all" ON public.platform_settings
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));