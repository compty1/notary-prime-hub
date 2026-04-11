
-- Outbound webhooks registration table
CREATE TABLE public.outbound_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  events_subscribed TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.outbound_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage outbound webhooks"
ON public.outbound_webhooks FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_outbound_webhooks_updated_at
BEFORE UPDATE ON public.outbound_webhooks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Outbound webhook delivery log
CREATE TABLE public.outbound_webhook_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES public.outbound_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  response_status INTEGER,
  response_body TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  retry_count INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.outbound_webhook_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook logs"
ON public.outbound_webhook_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_outbound_webhook_log_webhook_id ON public.outbound_webhook_log(webhook_id);
CREATE INDEX idx_outbound_webhook_log_attempted_at ON public.outbound_webhook_log(attempted_at DESC);
