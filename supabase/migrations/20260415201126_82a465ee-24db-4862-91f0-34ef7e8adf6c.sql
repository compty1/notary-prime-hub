-- Add design_config JSONB column to shop_cart_items
ALTER TABLE public.shop_cart_items ADD COLUMN IF NOT EXISTS design_config jsonb DEFAULT '{}';

-- Create design-assets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('design-assets', 'design-assets', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Users can upload their own design assets
CREATE POLICY "Users can upload their own design assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'design-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Users can view their own design assets
CREATE POLICY "Users can view their own design assets"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'design-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Users can delete their own design assets
CREATE POLICY "Users can delete their own design assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'design-assets' AND (storage.foldername(name))[1] = auth.uid()::text);