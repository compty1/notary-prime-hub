
-- Fix the SECURITY DEFINER view issue by dropping it and using security_invoker
DROP VIEW IF EXISTS public.public_reviews;

CREATE VIEW public.public_reviews
WITH (security_invoker = true)
AS
SELECT id, appointment_id, rating, comment, created_at
FROM public.reviews;
