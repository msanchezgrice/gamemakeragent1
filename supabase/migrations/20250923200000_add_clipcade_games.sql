-- Add clipcade_games table for GameTok/Clipcade integration

CREATE TABLE clipcade_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  theme text,
  game_type text,
  html_content text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  source text DEFAULT 'multiagent_builder',
  run_id uuid REFERENCES orchestrator_runs(id),
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  approved_by text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE clipcade_games ENABLE ROW LEVEL SECURITY;

-- Allow all operations for service role and anon users (for demo)
CREATE POLICY "clipcade_games_policy" ON clipcade_games
  FOR ALL USING (true)
  WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX idx_clipcade_games_status ON clipcade_games(status);
CREATE INDEX idx_clipcade_games_created_at ON clipcade_games(created_at DESC);
CREATE INDEX idx_clipcade_games_run_id ON clipcade_games(run_id);

-- Add comments for documentation
COMMENT ON TABLE clipcade_games IS 'Games uploaded to Clipcade/GameTok feed from the multiagent builder';
COMMENT ON COLUMN clipcade_games.status IS 'Game approval status: pending, approved, rejected';
COMMENT ON COLUMN clipcade_games.html_content IS 'Complete HTML5 game code';
COMMENT ON COLUMN clipcade_games.metadata IS 'Additional game metadata (file size, features, etc.)';
