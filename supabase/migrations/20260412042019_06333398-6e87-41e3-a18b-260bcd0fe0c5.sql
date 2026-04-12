
-- UX Projects
CREATE TABLE public.ux_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'ux_audit',
  title TEXT NOT NULL DEFAULT 'Untitled UX Project',
  status TEXT NOT NULL DEFAULT 'intake',
  scope_description TEXT,
  deliverable_format TEXT,
  budget NUMERIC(10,2),
  assigned_to UUID,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  package_tier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ux_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ux_projects" ON public.ux_projects
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view own ux_projects" ON public.ux_projects
  FOR SELECT TO authenticated USING (client_id = auth.uid());

CREATE TRIGGER trg_ux_projects_updated_at BEFORE UPDATE ON public.ux_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- UX Deliverables
CREATE TABLE public.ux_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.ux_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  deliverable_type TEXT NOT NULL DEFAULT 'report',
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  review_notes TEXT,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ux_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ux_deliverables" ON public.ux_deliverables
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view own ux_deliverables" ON public.ux_deliverables
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.ux_projects WHERE id = project_id AND client_id = auth.uid())
  );

CREATE TRIGGER trg_ux_deliverables_updated_at BEFORE UPDATE ON public.ux_deliverables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- UX Audit Reports
CREATE TABLE public.ux_audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.ux_projects(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL,
  analyzed_url TEXT,
  overall_score INT,
  findings JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  report_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ux_audit_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ux_audit_reports" ON public.ux_audit_reports
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own ux_audit_reports" ON public.ux_audit_reports
  FOR SELECT TO authenticated USING (requested_by = auth.uid());

-- Indexes
CREATE INDEX idx_ux_projects_client ON public.ux_projects(client_id);
CREATE INDEX idx_ux_projects_status ON public.ux_projects(status);
CREATE INDEX idx_ux_deliverables_project ON public.ux_deliverables(project_id);
CREATE INDEX idx_ux_audit_reports_project ON public.ux_audit_reports(project_id);
