
-- Add edited_at column to tool_generations
ALTER TABLE public.tool_generations ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- Add plan column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';

-- Create version history table for AI tool generation edits
CREATE TABLE public.tool_generation_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid NOT NULL REFERENCES public.tool_generations(id) ON DELETE CASCADE,
  result text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tool_generation_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own generation versions"
  ON public.tool_generation_versions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tool_generations g WHERE g.id = generation_id AND g.user_id = auth.uid()));
