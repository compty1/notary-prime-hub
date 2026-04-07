CREATE INDEX IF NOT EXISTS idx_sr_client ON public.service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_sr_status ON public.service_requests(status);