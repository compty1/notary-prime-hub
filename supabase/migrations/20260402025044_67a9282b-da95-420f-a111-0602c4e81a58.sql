-- Batch 7: Business portal role-based permissions (items 563-564)
CREATE TABLE IF NOT EXISTS public.business_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);
ALTER TABLE public.business_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business owners can manage roles" ON public.business_roles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles bp
      WHERE bp.id = business_roles.business_id
        AND bp.created_by = auth.uid()
    )
  );
CREATE POLICY "Members can view own business role" ON public.business_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Batch 8: RON credential analysis table (item 585)
CREATE TABLE IF NOT EXISTS public.ron_credential_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.notarization_sessions(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  id_type text NOT NULL,
  id_number_hash text,
  id_expiration date,
  id_state text,
  analysis_result jsonb DEFAULT '{}',
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ron_credential_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage credential analysis" ON public.ron_credential_analysis
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'notary')
  );

-- Batch 8: Session pause/resume tracking (item 591)
ALTER TABLE public.notarization_sessions
  ADD COLUMN IF NOT EXISTS paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS pause_reason text,
  ADD COLUMN IF NOT EXISTS total_pause_duration_seconds integer DEFAULT 0;

-- Batch 9: Admin saved filters table (item 678)
CREATE TABLE IF NOT EXISTS public.admin_saved_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  page_key text NOT NULL,
  filter_name text NOT NULL,
  filter_config jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_saved_filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved filters" ON public.admin_saved_filters
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Enable realtime for credential analysis
ALTER PUBLICATION supabase_realtime ADD TABLE public.ron_credential_analysis;