-- Client feedback table
CREATE TABLE public.client_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  client_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_appointment ON public.client_feedback (appointment_id);
CREATE INDEX idx_feedback_client ON public.client_feedback (client_id);

ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can insert own feedback"
ON public.client_feedback FOR INSERT TO authenticated
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can view own feedback"
ON public.client_feedback FOR SELECT TO authenticated
USING (client_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Continuing education tracking
CREATE TABLE public.continuing_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_name text NOT NULL,
  provider text,
  credits numeric(5,2) NOT NULL DEFAULT 0,
  completed_date date NOT NULL,
  certificate_path text,
  deadline_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ce_user ON public.continuing_education (user_id);
ALTER TABLE public.continuing_education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own CE records"
ON public.continuing_education FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_continuing_education_updated_at
BEFORE UPDATE ON public.continuing_education
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add recurrence rule to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS recurrence_rule text DEFAULT NULL;