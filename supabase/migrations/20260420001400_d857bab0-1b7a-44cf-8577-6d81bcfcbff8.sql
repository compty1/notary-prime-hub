DROP VIEW IF EXISTS public.notary_journal_masked;

CREATE VIEW public.notary_journal_masked
WITH (security_invoker = on) AS
SELECT
  nj.*,
  CASE
    WHEN nj.id_number IS NOT NULL AND length(nj.id_number) >= 4
      THEN '****' || right(nj.id_number, 4)
    ELSE NULL
  END AS id_number_masked
FROM public.notary_journal nj;