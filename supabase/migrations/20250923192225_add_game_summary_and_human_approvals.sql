-- Add game_summary and require_human_approvals columns to orchestrator_runs table

ALTER TABLE orchestrator_runs 
ADD COLUMN game_summary TEXT,
ADD COLUMN require_human_approvals BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN orchestrator_runs.game_summary IS 'Generated descriptive summary of the game for display purposes';
COMMENT ON COLUMN orchestrator_runs.require_human_approvals IS 'Whether this run requires human approvals at key stages (synthesis, QA)';
