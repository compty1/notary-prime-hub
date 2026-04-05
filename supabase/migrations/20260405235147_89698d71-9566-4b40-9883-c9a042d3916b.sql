
-- Phase 1: tool_generations table for AI tool history & presets
CREATE TABLE public.tool_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id text NOT NULL,
  fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  result text NOT NULL DEFAULT '',
  is_preset boolean NOT NULL DEFAULT false,
  preset_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tool_generations_user ON public.tool_generations(user_id, created_at DESC);
CREATE INDEX idx_tool_generations_tool ON public.tool_generations(tool_id);

ALTER TABLE public.tool_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own generations"
  ON public.tool_generations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Phase 3A: session_tracking table for real-time session status
CREATE TABLE public.session_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting',
  shareable_token text NOT NULL DEFAULT substr(gen_random_uuid()::text, 1, 12),
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(shareable_token)
);

ALTER TABLE public.session_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage session tracking"
  ON public.session_tracking FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public view by token"
  ON public.session_tracking FOR SELECT
  TO anon, authenticated
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.session_tracking;

-- Phase 4A: referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_email text NOT NULL,
  referral_code text NOT NULL DEFAULT substr(gen_random_uuid()::text, 1, 8),
  status text NOT NULL DEFAULT 'pending',
  reward_amount numeric DEFAULT 0,
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referral_code)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own referrals"
  ON public.referrals FOR ALL
  TO authenticated
  USING (auth.uid() = referrer_id)
  WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins manage all referrals"
  ON public.referrals FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Phase 4B: service_upsells table
CREATE TABLE public.service_upsells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_service text NOT NULL,
  suggested_service text NOT NULL,
  message text NOT NULL DEFAULT '',
  discount_percent numeric DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_upsells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage upsells"
  ON public.service_upsells FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated view active upsells"
  ON public.service_upsells FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Phase 5D: webhook_events table
CREATE TABLE public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'received',
  error text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_events_source ON public.webhook_events(source, created_at DESC);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view webhook events"
  ON public.webhook_events FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role inserts webhook events"
  ON public.webhook_events FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role'::text);

-- Phase 5B: compliance_reports table
CREATE TABLE public.compliance_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL DEFAULT 'monthly_ron',
  report_month text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage compliance reports"
  ON public.compliance_reports FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
