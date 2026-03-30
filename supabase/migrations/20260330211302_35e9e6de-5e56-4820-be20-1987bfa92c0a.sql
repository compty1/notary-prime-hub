
-- Batch 3: Remaining foreign keys, constraints, and cleanup

-- FK: appointment_emails → appointments (already has FK per types)
-- FK: document_reminders → documents (already has FK per types)
-- FK: e_seal_verifications → documents & appointments (already has FK per types)
-- FK: notarization_sessions → appointments (already has FK per types)

-- Add missing FK: apostille_requests.client_id → profiles.user_id (item 67)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'apostille_requests_client_id_fkey' AND table_name = 'apostille_requests') THEN
    ALTER TABLE public.apostille_requests ADD CONSTRAINT apostille_requests_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add missing FK: mailroom_items.client_id → profiles.user_id (item 68)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'mailroom_items_client_id_fkey' AND table_name = 'mailroom_items') THEN
    ALTER TABLE public.mailroom_items ADD CONSTRAINT mailroom_items_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add missing FK: client_correspondence.client_id → profiles.user_id (item 69)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'client_correspondence_client_id_fkey' AND table_name = 'client_correspondence') THEN
    ALTER TABLE public.client_correspondence ADD CONSTRAINT client_correspondence_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add missing FK: service_requests.client_id → profiles.user_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'service_requests_client_id_fkey' AND table_name = 'service_requests') THEN
    ALTER TABLE public.service_requests ADD CONSTRAINT service_requests_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add missing FK: notary_journal.created_by → profiles.user_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'notary_journal_created_by_fkey' AND table_name = 'notary_journal') THEN
    ALTER TABLE public.notary_journal ADD CONSTRAINT notary_journal_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add missing FK: notary_payouts.notary_user_id → profiles.user_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'notary_payouts_notary_user_id_fkey' AND table_name = 'notary_payouts') THEN
    ALTER TABLE public.notary_payouts ADD CONSTRAINT notary_payouts_notary_user_id_fkey FOREIGN KEY (notary_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes for remaining tables (items 73-82 continued)
CREATE INDEX IF NOT EXISTS idx_apostille_requests_client_id ON public.apostille_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_apostille_requests_status ON public.apostille_requests(status);
CREATE INDEX IF NOT EXISTS idx_mailroom_items_client_id ON public.mailroom_items(client_id);
CREATE INDEX IF NOT EXISTS idx_client_correspondence_client_id ON public.client_correspondence(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_client_id ON public.service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_notary_journal_created_by ON public.notary_journal(created_by);
CREATE INDEX IF NOT EXISTS idx_notary_journal_appointment_id ON public.notary_journal(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notary_payouts_notary_user_id ON public.notary_payouts(notary_user_id);
CREATE INDEX IF NOT EXISTS idx_e_seal_verifications_document_id ON public.e_seal_verifications(document_id);
CREATE INDEX IF NOT EXISTS idx_document_reminders_user_id ON public.document_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_document_reminders_expiry_date ON public.document_reminders(expiry_date);
CREATE INDEX IF NOT EXISTS idx_notarization_sessions_status ON public.notarization_sessions(status);
CREATE INDEX IF NOT EXISTS idx_notarization_sessions_appointment_id ON public.notarization_sessions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_appointment_id ON public.reviews(appointment_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_user_id ON public.email_drafts(user_id);

-- updated_at triggers for remaining tables
CREATE OR REPLACE TRIGGER set_updated_at_apostille BEFORE UPDATE ON public.apostille_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_correspondence BEFORE UPDATE ON public.client_correspondence FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_service_requests BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_notary_journal BEFORE UPDATE ON public.notary_journal FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_updated_at_notarization_sessions BEFORE UPDATE ON public.notarization_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add notary RLS to notarization_sessions (notaries should manage sessions)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Notaries manage sessions' AND tablename = 'notarization_sessions') THEN
    CREATE POLICY "Notaries manage sessions" ON public.notarization_sessions FOR ALL TO public
      USING (has_role(auth.uid(), 'notary'::app_role))
      WITH CHECK (has_role(auth.uid(), 'notary'::app_role));
  END IF;
END $$;

-- Enable realtime for key tables that aren't already enabled
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
