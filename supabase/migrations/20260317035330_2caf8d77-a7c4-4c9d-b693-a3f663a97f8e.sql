
-- 3. Scope notary journal RLS
DROP POLICY IF EXISTS "Notaries manage journal" ON public.notary_journal;

CREATE POLICY "Notaries manage own journal"
  ON public.notary_journal FOR ALL
  USING (public.has_role(auth.uid(), 'notary') AND created_by = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'notary') AND created_by = auth.uid());

-- 4. Notary policies for documents
CREATE POLICY "Notaries view documents"
  ON public.documents FOR SELECT
  USING (public.has_role(auth.uid(), 'notary'));

-- 5. Notary update appointments
CREATE POLICY "Notaries update appointments"
  ON public.appointments FOR UPDATE
  USING (public.has_role(auth.uid(), 'notary'))
  WITH CHECK (public.has_role(auth.uid(), 'notary'));

-- 6. Notary chat policies
CREATE POLICY "Notaries manage chat"
  ON public.chat_messages FOR ALL
  USING (public.has_role(auth.uid(), 'notary'))
  WITH CHECK (public.has_role(auth.uid(), 'notary'));

-- 7. Notary view apostille
CREATE POLICY "Notaries view apostille"
  ON public.apostille_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'notary'));

-- 8. Payments table
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id),
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  method text,
  paid_at timestamp with time zone,
  invoice_url text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients view own payments" ON public.payments FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Admins manage payments" ON public.payments FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients create own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients view own reviews" ON public.reviews FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public view reviews" ON public.reviews FOR SELECT TO anon USING (true);

-- 10. Service requirements table
CREATE TABLE public.service_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  requirement_type text NOT NULL DEFAULT 'document',
  description text NOT NULL,
  is_required boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  ohio_statute_ref text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.service_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view requirements" ON public.service_requirements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage requirements" ON public.service_requirements FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 11. Service workflows table
CREATE TABLE public.service_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  step_number integer NOT NULL DEFAULT 1,
  step_name text NOT NULL,
  step_description text,
  requires_client_action boolean NOT NULL DEFAULT false,
  requires_admin_action boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.service_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view workflows" ON public.service_workflows FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage workflows" ON public.service_workflows FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 12. Leads table
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'manual',
  source_url text,
  name text,
  phone text,
  email text,
  business_name text,
  address text,
  city text,
  state text DEFAULT 'OH',
  zip text,
  lead_type text NOT NULL DEFAULT 'individual',
  service_needed text,
  intent_score text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'new',
  notes text,
  contacted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage leads" ON public.leads FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Notaries view leads" ON public.leads FOR SELECT USING (public.has_role(auth.uid(), 'notary'));
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Lead sources table
CREATE TABLE public.lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source_type text NOT NULL DEFAULT 'manual',
  url text,
  last_scraped_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage lead sources" ON public.lead_sources FOR ALL USING (public.has_role(auth.uid(), 'admin'));
