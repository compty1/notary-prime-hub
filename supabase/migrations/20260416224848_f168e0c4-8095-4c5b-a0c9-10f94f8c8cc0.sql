DROP VIEW IF EXISTS public.reviews_public;
CREATE VIEW public.reviews_public
WITH (security_invoker = true) AS
SELECT id, COALESCE(display_name, 'Verified Client') AS reviewer_name,
       rating, comment, notary_id, created_at
FROM public.reviews
WHERE is_public = true;
GRANT SELECT ON public.reviews_public TO anon, authenticated;