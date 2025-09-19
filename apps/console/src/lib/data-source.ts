// import { z } from 'zod';
// import { runRecord } from '@gametok/schemas';
import { mockRuns } from './mock-data';
import { supabase, type DatabaseRun, type DatabaseTask } from './supabase';

const orchestratorBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL 
  ? process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/orchestrator-api'
  : null;

export async function loadRuns() {
  try {
    // Try Edge Function first, fallback to direct Supabase, then mock
    if (orchestratorBaseUrl) {
      const response = await fetch(`${orchestratorBaseUrl}/runs`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const runs = await response.json();
        return transformSupabaseRuns(runs);
      }
    }

    // Fallback to direct Supabase
    const { data: runs, error } = await supabase
      .from('orchestrator_runs')
      .select(`
        *,
        blockers:orchestrator_manual_tasks(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return mockRuns;
    }

    if (!runs || runs.length === 0) {
      console.log('No runs in database, using mock data');
      return mockRuns;
    }

    return transformSupabaseRuns(runs);
  } catch (error) {
    console.error('Failed to load runs:', error);
    return mockRuns;
  }
}

function transformSupabaseRuns(runs: Array<DatabaseRun & { blockers: DatabaseTask[] }>) {
  return runs.map((run) => ({
    id: run.id,
    status: run.status,
    phase: run.phase,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    brief: run.brief,
    blockers: run.blockers.map(task => ({
      id: task.id,
      runId: task.run_id,
      phase: task.phase as 'prioritize', // Type assertion for now
      type: task.task_type,
      title: task.title,
      description: task.description,
      createdAt: task.created_at,
      dueAt: task.due_at,
      completedAt: task.completed_at,
      assignee: task.assignee
    }))
  }));
}

export async function createRun(brief: {
  industry: string;
  goal: string;
  theme: string;
  targetAudience?: string;
  constraints: Record<string, unknown>;
}) {
  try {
    const response = await fetch(`${orchestratorBaseUrl}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ brief })
    });

    if (!response.ok) {
      throw new Error(`Failed to create run: ${response.status}`);
    }

    const run = await response.json();
    
    // Transform to our schema format
    return {
      id: run.id,
      status: run.status,
      phase: run.phase,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      brief: run.brief,
      blockers: []
    };
  } catch (error) {
    console.error('Failed to create run:', error);
    throw error;
  }
}

export async function advanceRun(runId: string) {
  try {
    const response = await fetch(`${orchestratorBaseUrl}/runs/${runId}/advance`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to advance run: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to advance run:', error);
    throw error;
  }
}

export async function completeTask(taskId: string) {
  try {
    const response = await fetch(`${orchestratorBaseUrl}/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to complete task: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to complete task:', error);
    throw error;
  }
}
