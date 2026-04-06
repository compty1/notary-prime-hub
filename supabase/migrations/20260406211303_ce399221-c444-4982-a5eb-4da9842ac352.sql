
ALTER TABLE tool_generations ADD COLUMN IF NOT EXISTS edited_at timestamptz;

CREATE TABLE IF NOT EXISTS tool_generation_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid NOT NULL REFERENCES tool_generations(id) ON DELETE CASCADE,
  result text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tool_generation_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own generation versions"
  ON tool_generation_versions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM tool_generations g WHERE g.id = generation_id AND g.user_id = auth.uid()));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';
