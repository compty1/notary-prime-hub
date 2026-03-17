
-- service_requests: for non-appointment intake submissions
CREATE TABLE public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  intake_data JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients create requests" ON public.service_requests FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients view own requests" ON public.service_requests FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Admins manage requests" ON public.service_requests FOR ALL USING (has_role(auth.uid(), 'admin'));

-- mailroom_items: virtual mailroom entries
CREATE TABLE public.mailroom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  sender TEXT,
  subject TEXT NOT NULL,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  scanned_file_path TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  forwarding_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mailroom_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own mail" ON public.mailroom_items FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Admins manage mailroom" ON public.mailroom_items FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Add updated_at trigger for service_requests
CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
