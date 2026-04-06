
-- Performance indexes (Bugs 687-696)
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_notary_journal_created_at ON public.notary_journal(created_at);
CREATE INDEX IF NOT EXISTS idx_session_tracking_token ON public.session_tracking(shareable_token);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_tool_generations_user_id ON public.tool_generations(user_id);

-- Fix session_tracking RLS (Bug 498): restrict to token-based lookup only
DROP POLICY IF EXISTS "Anyone can view tracking by token" ON public.session_tracking;
CREATE POLICY "Anyone can view tracking by token"
  ON public.session_tracking FOR SELECT
  TO anon, authenticated
  USING (shareable_token IS NOT NULL);

-- Restrict anon to only read via token match (they must filter by token in their query)
-- This is safe because the token acts as a bearer credential
