ALTER TABLE public.notary_journal
  ADD COLUMN IF NOT EXISTS entry_time text,
  ADD COLUMN IF NOT EXISTS document_date text,
  ADD COLUMN IF NOT EXISTS notary_commission_number text,
  ADD COLUMN IF NOT EXISTS communication_technology text,
  ADD COLUMN IF NOT EXISTS credential_analysis_method text;