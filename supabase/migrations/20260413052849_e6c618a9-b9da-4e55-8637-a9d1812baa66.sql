
-- Shop Packages table
CREATE TABLE public.shop_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT,
  physical_price NUMERIC(10,2),
  digital_price NUMERIC(10,2),
  complete_price NUMERIC(10,2),
  badge TEXT,
  persona_match TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages" ON public.shop_packages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage packages" ON public.shop_packages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_shop_packages_updated_at
  BEFORE UPDATE ON public.shop_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Shop Add-ons table
CREATE TABLE public.shop_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'supplies',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  compatible_tiers TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sku TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active addons" ON public.shop_addons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage addons" ON public.shop_addons
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_shop_addons_updated_at
  BEFORE UPDATE ON public.shop_addons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Shopping Cart Items
CREATE TABLE public.shop_cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('package', 'addon')),
  item_id UUID NOT NULL,
  variation TEXT DEFAULT 'complete',
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cart" ON public.shop_cart_items
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Shop Orders
CREATE TABLE public.shop_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own orders" ON public.shop_orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own orders" ON public.shop_orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all orders" ON public.shop_orders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_shop_orders_updated_at
  BEFORE UPDATE ON public.shop_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_shop_packages_slug ON public.shop_packages(slug);
CREATE INDEX idx_shop_addons_category ON public.shop_addons(category);
CREATE INDEX idx_shop_cart_items_user ON public.shop_cart_items(user_id);
CREATE INDEX idx_shop_orders_user ON public.shop_orders(user_id);
CREATE INDEX idx_shop_orders_status ON public.shop_orders(status);
