
-- Fix SECURITY DEFINER views by recreating as SECURITY INVOKER
ALTER VIEW public.public_feedback SET (security_invoker = on);
ALTER VIEW public.journal_entries_legacy SET (security_invoker = on);
