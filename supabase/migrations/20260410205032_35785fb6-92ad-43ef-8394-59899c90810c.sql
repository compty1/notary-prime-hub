-- D001: Enforce slug uniqueness at DB level
CREATE UNIQUE INDEX IF NOT EXISTS idx_notary_pages_slug_unique ON public.notary_pages (slug);
