
-- Deals table for CRM pipeline
CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  value numeric DEFAULT 0,
  stage text NOT NULL DEFAULT 'discovery',
  expected_close date,
  assigned_to uuid,
  notes text,
  hubspot_deal_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage deals" ON public.deals FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Notaries view assigned deals" ON public.deals FOR SELECT TO authenticated USING (has_role(auth.uid(), 'notary'::app_role) AND assigned_to = auth.uid());

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CRM Activities table
CREATE TABLE public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_type text NOT NULL DEFAULT 'lead',
  contact_id uuid NOT NULL,
  activity_type text NOT NULL DEFAULT 'note',
  subject text,
  body text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage crm activities" ON public.crm_activities FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Notaries view own activities" ON public.crm_activities FOR SELECT TO authenticated USING (has_role(auth.uid(), 'notary'::app_role) AND created_by = auth.uid());
CREATE POLICY "Authenticated insert activities" ON public.crm_activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Indexes
CREATE INDEX idx_deals_stage ON public.deals(stage);
CREATE INDEX idx_deals_lead_id ON public.deals(lead_id);
CREATE INDEX idx_deals_contact_id ON public.deals(contact_id);
CREATE INDEX idx_crm_activities_contact ON public.crm_activities(contact_type, contact_id);
CREATE INDEX idx_crm_activities_type ON public.crm_activities(activity_type);
