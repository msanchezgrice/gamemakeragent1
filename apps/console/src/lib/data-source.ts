// import { z } from 'zod';
// import { runRecord } from '@gametok/schemas';
import { mockRuns } from './mock-data';
import { supabase, type DatabaseRun, type DatabaseTask } from './supabase';

// const runsResponse = z.object({ runs: z.array(runRecord) });
// const orchestratorBaseUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL;

export async function loadRuns() {
  try {
    // First try to load from Supabase
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

    // Transform database format to our schema format
    const transformedRuns = runs.map((run: DatabaseRun & { blockers: DatabaseTask[] }) => ({
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

    return transformedRuns;
  } catch (error) {
    console.error('Failed to load runs from Supabase:', error);
    return mockRuns;
  }
}

export async function createRun(brief: {
  industry: string;
  goal: string;
  theme: string;
  targetAudience?: string;
  constraints: Record<string, unknown>;
}) {
  try {
    // Insert into Supabase
    const { data: run, error } = await supabase
      .from('orchestrator_runs')
      .insert({
        brief,
        status: 'queued',
        phase: 'intake'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating run:', error);
      throw new Error('Failed to create run in database');
    }

    // Transform to our schema format
    const transformedRun = {
      id: run.id,
      status: run.status,
      phase: run.phase,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      brief: run.brief,
      blockers: []
    };

    return transformedRun;
  } catch (error) {
    console.error('Failed to create run:', error);
    throw error;
  }
}

export async function advanceRun(runId: string) {
  try {
    // Update run status in Supabase
    const { data: run, error } = await supabase
      .from('orchestrator_runs')
      .update({
        status: 'running',
        updated_at: new Date().toISOString()
      })
      .eq('id', runId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error advancing run:', error);
      throw new Error('Failed to advance run in database');
    }

    return { success: true, run };
  } catch (error) {
    console.error('Failed to advance run:', error);
    throw error;
  }
}

export async function completeTask(taskId: string) {
  try {
    // Mark task as completed in Supabase
    const { data: task, error } = await supabase
      .from('orchestrator_manual_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error completing task:', error);
      throw new Error('Failed to complete task in database');
    }

    return { success: true, task };
  } catch (error) {
    console.error('Failed to complete task:', error);
    throw error;
  }
}
