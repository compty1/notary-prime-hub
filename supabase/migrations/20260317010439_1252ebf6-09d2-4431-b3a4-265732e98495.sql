-- 2. Create platform_settings table
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings"
  ON public.platform_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read settings"
  ON public.platform_settings FOR SELECT
  TO authenticated
  USING (true);

-- Seed default platform settings
INSERT INTO public.platform_settings (setting_key, setting_value, description) VALUES
  ('base_fee_per_signature', '5.00', 'Base notarization fee per signature (ORC §147.08)'),
  ('travel_fee_per_mile', '0.75', 'Travel fee per mile for in-person appointments'),
  ('travel_fee_minimum', '25.00', 'Minimum travel fee for in-person appointments'),
  ('travel_radius_miles', '30', 'Maximum travel radius in miles'),
  ('ron_platform_fee', '25.00', 'BlueNotary platform fee per RON session'),
  ('kba_fee', '15.00', 'Knowledge-Based Authentication fee per session'),
  ('bluenotary_iframe_url', '', 'BlueNotary iframe embed URL'),
  ('bluenotary_api_key', '', 'BlueNotary API key'),
  ('kba_platform_url', '', 'KBA platform URL'),
  ('notary_base_address', 'Columbus, OH', 'Notary home base address for distance calculations'),
  ('notary_base_zip', '43215', 'Notary home base zip code'),
  ('max_appointments_per_day', '8', 'Maximum appointments per day'),
  ('min_booking_lead_hours', '2', 'Minimum hours in advance for booking'),
  ('commission_expiration_date', '', 'Notary commission expiration date');

-- 3. Add columns to appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS client_address text,
  ADD COLUMN IF NOT EXISTS travel_distance_miles numeric,
  ADD COLUMN IF NOT EXISTS estimated_price numeric;

-- 4. Add financial columns to notary_journal
ALTER TABLE public.notary_journal
  ADD COLUMN IF NOT EXISTS platform_fees numeric,
  ADD COLUMN IF NOT EXISTS travel_fee numeric,
  ADD COLUMN IF NOT EXISTS net_profit numeric;

-- 5. Fix time_slots RLS: allow anonymous users to view available slots
DROP POLICY IF EXISTS "Anyone can view available time slots" ON public.time_slots;
CREATE POLICY "Anyone can view available time slots"
  ON public.time_slots FOR SELECT
  TO anon, authenticated
  USING (true);

-- 6. Add storage policies for documents bucket
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND (auth.uid()::text = (storage.foldername(name))[1]));

CREATE POLICY "Admins can view all documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));