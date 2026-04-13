
-- Vendor Products table
CREATE TABLE public.vendor_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL DEFAULT 'physical',
  sku TEXT,
  description TEXT,
  base_cost NUMERIC(10,2),
  retail_price NUMERIC(10,2),
  margin_percent NUMERIC(5,2),
  turnaround_days INTEGER DEFAULT 3,
  min_order_qty INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  enrichment_data JSONB DEFAULT '{}',
  enriched_at TIMESTAMPTZ,
  image_url TEXT,
  specs JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add columns to vendors table
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS auto_enrich_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS enrichment_api_url TEXT;

-- Indexes
CREATE INDEX idx_vendor_products_vendor ON public.vendor_products(vendor_id);
CREATE INDEX idx_vendor_products_type ON public.vendor_products(product_type);
CREATE INDEX idx_vendor_products_active ON public.vendor_products(is_active);

-- RLS
ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active vendor products"
  ON public.vendor_products FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage vendor products"
  ON public.vendor_products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_vendor_products_updated_at
  BEFORE UPDATE ON public.vendor_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
