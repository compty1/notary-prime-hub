
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, location TEXT, specialties TEXT[],
  capabilities JSONB DEFAULT '[]'::jsonb, partnership_tier TEXT NOT NULL DEFAULT 'production',
  contact_name TEXT, contact_email TEXT, contact_phone TEXT, website_url TEXT,
  quality_score NUMERIC(3,2) DEFAULT 5.00, on_time_rate NUMERIC(5,2) DEFAULT 100.00,
  total_orders INTEGER DEFAULT 0, total_revenue NUMERIC(12,2) DEFAULT 0,
  wholesale_pricing JSONB DEFAULT '{}'::jsonb, is_active BOOLEAN NOT NULL DEFAULT true, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage vendors" ON public.vendors FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendors are publicly readable" ON public.vendors FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.designs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL, product_type TEXT NOT NULL,
  design_data JSONB DEFAULT '{}'::jsonb, preview_url TEXT, thumbnail_url TEXT, status TEXT NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1, title TEXT DEFAULT 'Untitled Design', template_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own designs" ON public.designs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all designs" ON public.designs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.print_order_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, order_id UUID NOT NULL REFERENCES public.print_orders(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL, file_url TEXT NOT NULL, file_name TEXT NOT NULL, file_size BIGINT, version INTEGER DEFAULT 1,
  uploaded_by UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.print_order_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own order files" ON public.print_order_files FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.print_orders WHERE id = order_id AND client_id = auth.uid()));
CREATE POLICY "Admins manage all order files" ON public.print_order_files FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.print_order_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, order_id UUID NOT NULL REFERENCES public.print_orders(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL DEFAULT 'system', sender_id UUID, message TEXT NOT NULL, attachments TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.print_order_communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own order comms" ON public.print_order_communications FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.print_orders WHERE id = order_id AND client_id = auth.uid()));
CREATE POLICY "Admins manage all order comms" ON public.print_order_communications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.print_pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, product_type TEXT NOT NULL, tier TEXT NOT NULL DEFAULT 'basic',
  base_price NUMERIC(10,2) NOT NULL, cost_basis NUMERIC(10,2), margin_target NUMERIC(5,2), rush_multiplier NUMERIC(4,2) DEFAULT 1.50,
  quantity_breaks JSONB DEFAULT '[]'::jsonb, finish_surcharges JSONB DEFAULT '{}'::jsonb, is_active BOOLEAN NOT NULL DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE, end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.print_pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read pricing" ON public.print_pricing_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage pricing rules" ON public.print_pricing_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
