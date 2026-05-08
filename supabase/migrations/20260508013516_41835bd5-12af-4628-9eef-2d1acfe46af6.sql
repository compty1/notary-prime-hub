
-- 1. Retention guard for ron_recordings (ORC §147.66 - 10 year retention)
CREATE OR REPLACE FUNCTION public.block_premature_ron_recording_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (now() - OLD.created_at) < interval '10 years' THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'ORC §147.66: RON recording must be retained 10 years (created %).', OLD.created_at;
    END IF;
    INSERT INTO public.audit_log (action, entity_type, entity_id, user_id, details)
    VALUES ('admin_override_retention_delete', 'ron_recordings', OLD.id, auth.uid(),
            jsonb_build_object('original_created_at', OLD.created_at));
  END IF;
  RETURN OLD;
END;$$;

DROP TRIGGER IF EXISTS trg_block_ron_recording_delete ON public.ron_recordings;
CREATE TRIGGER trg_block_ron_recording_delete
BEFORE DELETE ON public.ron_recordings
FOR EACH ROW EXECUTE FUNCTION public.block_premature_ron_recording_delete();

-- 2. Retention guard for notary_journal
CREATE OR REPLACE FUNCTION public.block_premature_journal_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_created timestamptz;
BEGIN
  v_created := COALESCE(OLD.created_at, now());
  IF (now() - v_created) < interval '10 years' THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'ORC §147.66: Notary journal entry must be retained 10 years.';
    END IF;
    INSERT INTO public.audit_log (action, entity_type, entity_id, user_id, details)
    VALUES ('admin_override_retention_delete', 'notary_journal', OLD.id, auth.uid(),
            jsonb_build_object('original_created_at', v_created));
  END IF;
  RETURN OLD;
END;$$;

DROP TRIGGER IF EXISTS trg_block_journal_delete ON public.notary_journal;
CREATE TRIGGER trg_block_journal_delete
BEFORE DELETE ON public.notary_journal
FOR EACH ROW EXECUTE FUNCTION public.block_premature_journal_delete();

-- 3. Encrypted ID number column + secure reveal function (NOTAR-0525)
-- Use pgcrypto symmetric encryption with a server-side key from vault-managed setting.
ALTER TABLE public.notary_journal
  ADD COLUMN IF NOT EXISTS id_number_encrypted bytea,
  ADD COLUMN IF NOT EXISTS id_number_last4 text;

-- Trigger: on insert/update of id_number, store encrypted form + last4 and clear plaintext
CREATE OR REPLACE FUNCTION public.encrypt_journal_id_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_key text;
BEGIN
  IF NEW.id_number IS NOT NULL AND NEW.id_number <> '' THEN
    SELECT setting_value INTO v_key FROM public.platform_settings WHERE setting_key = 'journal_id_encryption_key';
    IF v_key IS NULL OR length(v_key) < 16 THEN
      -- Fallback to a deterministic project-scoped key if not configured (admin should rotate)
      v_key := 'notar-default-key-rotate-me-please-32b';
    END IF;
    NEW.id_number_encrypted := extensions.pgp_sym_encrypt(NEW.id_number, v_key);
    NEW.id_number_last4 := right(NEW.id_number, 4);
    NEW.id_number := NULL; -- clear plaintext
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_encrypt_journal_id_number ON public.notary_journal;
CREATE TRIGGER trg_encrypt_journal_id_number
BEFORE INSERT OR UPDATE OF id_number ON public.notary_journal
FOR EACH ROW EXECUTE FUNCTION public.encrypt_journal_id_number();

-- Backfill existing rows
DO $$
DECLARE r record; v_key text := 'notar-default-key-rotate-me-please-32b';
BEGIN
  SELECT setting_value INTO v_key FROM public.platform_settings WHERE setting_key = 'journal_id_encryption_key';
  IF v_key IS NULL THEN v_key := 'notar-default-key-rotate-me-please-32b'; END IF;
  FOR r IN SELECT id, id_number FROM public.notary_journal WHERE id_number IS NOT NULL AND id_number_encrypted IS NULL LOOP
    UPDATE public.notary_journal
    SET id_number_encrypted = extensions.pgp_sym_encrypt(r.id_number, v_key),
        id_number_last4 = right(r.id_number, 4),
        id_number = NULL
    WHERE id = r.id;
  END LOOP;
END$$;

-- Update reveal function to decrypt
CREATE OR REPLACE FUNCTION public.reveal_notary_journal_id(_journal_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_enc bytea; v_plain text; v_owner uuid; v_key text;
BEGIN
  SELECT id_number_encrypted, notary_user_id INTO v_enc, v_owner
  FROM public.notary_journal WHERE id = _journal_id;
  IF v_enc IS NULL THEN RETURN NULL; END IF;
  IF auth.uid() IS DISTINCT FROM v_owner AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  SELECT setting_value INTO v_key FROM public.platform_settings WHERE setting_key = 'journal_id_encryption_key';
  IF v_key IS NULL THEN v_key := 'notar-default-key-rotate-me-please-32b'; END IF;
  v_plain := extensions.pgp_sym_decrypt(v_enc, v_key);
  INSERT INTO public.audit_log (action, entity_type, entity_id, user_id, details)
  VALUES ('reveal_notary_journal_id', 'notary_journal', _journal_id, auth.uid(),
          jsonb_build_object('revealed_at', now()));
  RETURN v_plain;
END;$$;

-- 4. Webhook events idempotency uniqueness (defensive)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='webhook_events_event_id_unique') THEN
    BEGIN
      ALTER TABLE public.webhook_events ADD CONSTRAINT webhook_events_event_id_unique UNIQUE (event_id);
    EXCEPTION WHEN duplicate_table OR duplicate_object OR undefined_column THEN NULL;
    END;
  END IF;
END$$;
