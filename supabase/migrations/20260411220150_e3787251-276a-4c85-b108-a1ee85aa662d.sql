ALTER VIEW public.notary_pages_public SET (security_invoker = on);

DROP VIEW IF EXISTS public.reviews_public;
CREATE VIEW public.reviews_public WITH (security_invoker = on) AS
SELECT id, rating, comment, created_at
FROM public.reviews;