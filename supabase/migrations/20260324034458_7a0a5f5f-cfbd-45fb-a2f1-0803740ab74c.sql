ALTER TABLE public.e_seal_verifications ALTER COLUMN notary_name SET DEFAULT 'Notar';

UPDATE public.services SET short_description = 'Secure video notarization via OneNotary' WHERE short_description LIKE '%BlueNotary%';