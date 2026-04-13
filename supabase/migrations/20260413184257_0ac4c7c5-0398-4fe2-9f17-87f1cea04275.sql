
-- Sprint 21: Event Bus
CREATE TABLE public.platform_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  actor_id UUID,
  payload JSONB DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_platform_events_type ON public.platform_events(event_type);
CREATE INDEX idx_platform_events_entity ON public.platform_events(entity_type, entity_id);
CREATE INDEX idx_platform_events_created ON public.platform_events(created_at DESC);
ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage platform events" ON public.platform_events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Sprint 22: Growth Resources
CREATE TABLE public.growth_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'guide',
  content_html TEXT,
  resource_type TEXT NOT NULL DEFAULT 'guide',
  target_audience TEXT NOT NULL DEFAULT 'both',
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.growth_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view growth resources" ON public.growth_resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage growth resources" ON public.growth_resources FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Sprint 25: Client Activity Timeline
CREATE TABLE public.client_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_client_timeline_client ON public.client_timeline_events(client_id, created_at DESC);
ALTER TABLE public.client_timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage client timeline" ON public.client_timeline_events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can view own timeline" ON public.client_timeline_events FOR SELECT TO authenticated USING (client_id = auth.uid());

-- Enable realtime for platform events
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_events;
