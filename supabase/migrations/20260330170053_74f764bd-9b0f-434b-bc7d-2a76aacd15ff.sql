
-- Restrict platform_settings: anon users should NOT see sensitive keys like kba_api_key
DROP POLICY IF EXISTS "Anyone can read public settings" ON public.platform_settings;
CREATE POLICY "Anon can read non-sensitive settings"
  ON public.platform_settings
  FOR SELECT
  TO anon
  USING (setting_key NOT LIKE '%api_key%' AND setting_key NOT LIKE '%secret%' AND setting_key NOT LIKE '%token%' AND setting_key NOT LIKE '%password%');

-- Authenticated non-admin users also shouldn't see sensitive keys
DROP POLICY IF EXISTS "Authenticated can read settings" ON public.platform_settings;
CREATE POLICY "Authenticated can read non-sensitive settings"
  ON public.platform_settings
  FOR SELECT
  TO authenticated
  USING (
    setting_key NOT LIKE '%api_key%' AND setting_key NOT LIKE '%secret%' AND setting_key NOT LIKE '%token%' AND setting_key NOT LIKE '%password%'
    OR has_role(auth.uid(), 'admin'::app_role)
  );
