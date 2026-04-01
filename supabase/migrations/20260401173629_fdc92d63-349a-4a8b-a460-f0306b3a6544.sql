
-- New table for tracking implementation plans
CREATE TABLE public.build_tracker_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_title text NOT NULL,
  plan_summary text,
  plan_items jsonb NOT NULL DEFAULT '[]',
  source text NOT NULL DEFAULT 'manual',
  chat_context text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.build_tracker_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage build tracker plans"
  ON public.build_tracker_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_build_tracker_plans_updated_at
  BEFORE UPDATE ON public.build_tracker_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add new columns to build_tracker_items
ALTER TABLE public.build_tracker_items
  ADD COLUMN IF NOT EXISTS flow_steps jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS page_route text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.build_tracker_plans(id) ON DELETE SET NULL;
