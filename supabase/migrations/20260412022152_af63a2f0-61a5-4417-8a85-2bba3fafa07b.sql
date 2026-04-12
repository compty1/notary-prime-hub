
-- ============================================================
-- 1. ORDERS
-- ============================================================
CREATE TYPE public.order_status AS ENUM (
  'pending','assigned','in_progress','under_review','delivered','completed','cancelled'
);

CREATE TYPE public.order_priority AS ENUM ('standard','priority','rush','emergency');

CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE DEFAULT '',
  client_id UUID NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  priority public.order_priority NOT NULL DEFAULT 'standard',
  service_category TEXT,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  due_date DATE,
  notes TEXT,
  assigned_contractor_id UUID,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on orders" ON public.orders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients view own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = client_id);

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_orders_client ON public.orders (client_id);
CREATE INDEX idx_orders_status ON public.orders (status);

CREATE OR REPLACE FUNCTION public.generate_order_number()
  RETURNS trigger LANGUAGE plpgsql SET search_path = 'public'
AS $$
DECLARE prefix TEXT; seq INT;
BEGIN
  IF NEW.order_number IS NOT NULL AND NEW.order_number != '' THEN RETURN NEW; END IF;
  SELECT COALESCE(setting_value, 'NTR') INTO prefix FROM public.platform_settings WHERE setting_key = 'order_auto_number_prefix';
  IF prefix IS NULL THEN prefix := 'NTR'; END IF;
  SELECT COALESCE(MAX(CASE WHEN order_number ~ '-(\d+)$' THEN (regexp_replace(order_number, '.*-(\d+)$', '\1'))::integer ELSE 0 END), 0) + 1 INTO seq FROM public.orders;
  NEW.order_number := prefix || '-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(seq::text, 5, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- ============================================================
-- 2. ORDER ITEMS
-- ============================================================
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  tier TEXT DEFAULT 'standard',
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  specs JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on order_items" ON public.order_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients view own order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.client_id = auth.uid()));

CREATE INDEX idx_order_items_order ON public.order_items (order_id);

-- ============================================================
-- 3. ORDER NOTES
-- ============================================================
CREATE TABLE public.order_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on order_notes" ON public.order_notes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients view non-internal notes on own orders" ON public.order_notes
  FOR SELECT TO authenticated
  USING (is_internal = false AND EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_notes.order_id AND orders.client_id = auth.uid()));

CREATE INDEX idx_order_notes_order ON public.order_notes (order_id);

-- ============================================================
-- 4. CONTRACTORS
-- ============================================================
CREATE TABLE public.contractors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  bio TEXT,
  specializations TEXT[] DEFAULT '{}',
  certifications JSONB DEFAULT '[]'::jsonb,
  hourly_rate NUMERIC(10,2),
  commission_rate NUMERIC(5,2) DEFAULT 30.00,
  is_available BOOLEAN NOT NULL DEFAULT true,
  rating NUMERIC(3,2),
  total_jobs INT DEFAULT 0,
  stripe_connect_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on contractors" ON public.contractors
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Contractors view own record" ON public.contractors
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Contractors update own record" ON public.contractors
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_contractors_updated_at
  BEFORE UPDATE ON public.contractors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. CONTRACTOR ASSIGNMENTS
-- ============================================================
CREATE TABLE public.contractor_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  payout_amount NUMERIC(10,2),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contractor_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on contractor_assignments" ON public.contractor_assignments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Contractors view own assignments" ON public.contractor_assignments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.contractors WHERE contractors.id = contractor_assignments.contractor_id AND contractors.user_id = auth.uid()));

CREATE TRIGGER update_contractor_assignments_updated_at
  BEFORE UPDATE ON public.contractor_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_contractor_assignments_order ON public.contractor_assignments (order_id);
CREATE INDEX idx_contractor_assignments_contractor ON public.contractor_assignments (contractor_id);
