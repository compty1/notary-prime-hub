-- AI usage tracking for per-user monthly cost guards
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_key TEXT NOT NULL,
  function_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_month
  ON public.ai_usage_log (user_key, created_at DESC);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view (audit). Service role bypasses RLS for inserts.
DROP POLICY IF EXISTS "Admins can view ai usage" ON public.ai_usage_log;
CREATE POLICY "Admins can view ai usage"
ON public.ai_usage_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));