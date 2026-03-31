ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS signing_capacity text DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS entity_name text,
  ADD COLUMN IF NOT EXISTS signer_title text,
  ADD COLUMN IF NOT EXISTS facility_name text,
  ADD COLUMN IF NOT EXISTS facility_contact text,
  ADD COLUMN IF NOT EXISTS facility_room text,
  ADD COLUMN IF NOT EXISTS after_hours_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS travel_fee_estimate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS signer_count integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS refusal_reason text,
  ADD COLUMN IF NOT EXISTS refused_at timestamptz;