ALTER TABLE public.notary_journal
  ADD COLUMN IF NOT EXISTS journal_number serial;