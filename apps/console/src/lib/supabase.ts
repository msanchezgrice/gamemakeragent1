import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for orchestrator tables
export interface DatabaseRun {
  id: string;
  status: 'queued' | 'running' | 'awaiting_human' | 'paused' | 'failed' | 'done';
  phase: 'intake' | 'market' | 'synthesis' | 'deconstruct' | 'prioritize' | 'build' | 'qa' | 'deploy' | 'measure' | 'decision';
  brief: {
    industry: string;
    goal: string;
    theme: string;
    targetAudience?: string;
    constraints: Record<string, unknown>;
  };
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface DatabaseTask {
  id: string;
  run_id: string;
  phase: string;
  task_type: 'portfolio_approval' | 'qa_verification' | 'deployment_upload';
  status: 'open' | 'completed' | 'cancelled';
  title: string;
  description: string;
  created_at: string;
  due_at?: string;
  completed_at?: string;
  assignee?: string;
}

export interface DatabaseArtifact {
  id: string;
  run_id: string;
  step_id?: string;
  phase: string;
  kind: string;
  path: string;
  sha256?: string;
  meta: Record<string, unknown>;
  created_at: string;
}
