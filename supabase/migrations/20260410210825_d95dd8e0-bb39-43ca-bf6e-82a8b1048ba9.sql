
-- P001: Allow users to create their own notary page
CREATE POLICY "Users can create own notary page"
ON public.notary_pages FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- DI001: Cascade cleanup trigger
CREATE OR REPLACE FUNCTION public.cleanup_notary_page_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.professional_service_enrollments WHERE professional_user_id = OLD.user_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_notary_page ON public.notary_pages;
CREATE TRIGGER trg_cleanup_notary_page
  BEFORE DELETE ON public.notary_pages
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_notary_page_data();
