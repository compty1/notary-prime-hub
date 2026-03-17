-- Notary Journal table for Ohio compliance (ORC §147.551)
CREATE TABLE public.notary_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id),
  signer_name text NOT NULL,
  signer_address text,
  id_type text,
  id_number text,
  id_expiration date,
  document_type text NOT NULL,
  document_description text,
  service_performed text NOT NULL DEFAULT 'acknowledgment',
  notarization_type public.notarization_type NOT NULL DEFAULT 'in_person',
  fees_charged numeric(10,2),
  witnesses_present integer DEFAULT 0,
  oath_administered boolean DEFAULT false,
  oath_timestamp timestamptz,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notary_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage journal entries"
  ON public.notary_journal FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_notary_journal_updated_at
  BEFORE UPDATE ON public.notary_journal
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notary_journal;