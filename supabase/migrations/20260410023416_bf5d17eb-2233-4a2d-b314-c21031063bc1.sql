
-- Fix security definer views by recreating with security_invoker = true
ALTER VIEW public.reviews_public SET (security_invoker = true);
ALTER VIEW public.e_seal_verifications_public SET (security_invoker = true);
