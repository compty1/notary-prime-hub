
-- Create only the tables that don't exist yet

-- Data deletion requests table (SVC-167, SVC-195, SVC-481)
CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_user ON public.data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON public.data_deletion_requests(status);

ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deletion requests" ON public.data_deletion_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create deletion requests" ON public.data_deletion_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage deletion requests" ON public.data_deletion_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Legal holds table (SVC-193)
CREATE TABLE IF NOT EXISTS public.legal_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL,
  placed_by UUID NOT NULL,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at TIMESTAMPTZ,
  released_by UUID,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_legal_holds_entity ON public.legal_holds(entity_type, entity_id);

ALTER TABLE public.legal_holds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage legal holds" ON public.legal_holds
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
