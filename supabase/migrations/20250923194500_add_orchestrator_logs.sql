-- Add missing orchestrator_logs table for activity tracking

CREATE TABLE orchestrator_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES orchestrator_runs(id) ON DELETE CASCADE,
  phase orchestrator_run_phase NOT NULL,
  agent text NOT NULL,
  level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  thinking_trace text,
  llm_response text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add RLS policies for orchestrator_logs
ALTER TABLE orchestrator_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access" ON orchestrator_logs
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "console read logs" ON orchestrator_logs
  FOR SELECT USING (auth.role() IN ('service_role','authenticated'));

-- Add index for performance
CREATE INDEX idx_orchestrator_logs_run_id ON orchestrator_logs(run_id);
CREATE INDEX idx_orchestrator_logs_created_at ON orchestrator_logs(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE orchestrator_logs IS 'Activity logs for orchestrator runs including agent activities and LLM interactions';
COMMENT ON COLUMN orchestrator_logs.run_id IS 'Reference to the orchestrator run';
COMMENT ON COLUMN orchestrator_logs.phase IS 'Phase during which this log entry was created';
COMMENT ON COLUMN orchestrator_logs.agent IS 'Name of the agent that generated this log';
COMMENT ON COLUMN orchestrator_logs.level IS 'Log level: info, warning, error, success';
COMMENT ON COLUMN orchestrator_logs.message IS 'Human-readable log message';
COMMENT ON COLUMN orchestrator_logs.thinking_trace IS 'LLM prompt or reasoning trace';
COMMENT ON COLUMN orchestrator_logs.llm_response IS 'Raw LLM response content';
