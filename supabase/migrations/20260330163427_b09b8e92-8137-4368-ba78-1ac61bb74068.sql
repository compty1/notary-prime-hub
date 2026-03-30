
-- Drop the now-redundant onenotary_fees column since platform_fees already exists
ALTER TABLE public.notary_payouts DROP COLUMN IF EXISTS onenotary_fees;
