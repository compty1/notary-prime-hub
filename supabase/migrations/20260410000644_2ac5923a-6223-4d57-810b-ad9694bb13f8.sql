
-- Sequential journal numbering function
CREATE OR REPLACE FUNCTION public.assign_journal_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_seq INTEGER;
  date_part TEXT;
BEGIN
  IF NEW.journal_number IS NOT NULL AND NEW.journal_number != '' THEN
    RETURN NEW;
  END IF;
  
  SELECT COALESCE(MAX(
    CASE WHEN journal_number ~ '^\d+$' THEN journal_number::integer
         WHEN journal_number ~ 'NTR-\d{8}-(\d+)' THEN (regexp_replace(journal_number, '.*-(\d+)$', '\1'))::integer
         ELSE 0
    END
  ), 0) + 1
  INTO next_seq
  FROM public.journal_entries
  WHERE notary_user_id = NEW.notary_user_id;
  
  date_part := to_char(COALESCE(NEW.entry_date, CURRENT_DATE), 'YYYYMMDD');
  NEW.journal_number := 'NTR-' || date_part || '-' || lpad(next_seq::text, 6, '0');
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_journal_number ON public.journal_entries;
CREATE TRIGGER trg_assign_journal_number
  BEFORE INSERT ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_journal_number();
