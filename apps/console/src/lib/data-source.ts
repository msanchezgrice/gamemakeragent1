// import { z } from 'zod';
// import { runRecord } from '@gametok/schemas';
import { mockRuns } from './mock-data';
import { supabase } from './supabase';

const orchestratorBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL 
  ? process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/orchestrator-api'
  : null;

export async function loadRuns() {
  console.log('🔍 loadRuns: Starting to load runs...');
  console.log('🔍 orchestratorBaseUrl:', orchestratorBaseUrl);
  console.log('🔍 SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  try {
    // Try Edge Function first, fallback to direct Supabase, then mock
    if (orchestratorBaseUrl) {
      console.log('🚀 Trying Edge Function:', `${orchestratorBaseUrl}/runs`);
      
      const response = await fetch(`${orchestratorBaseUrl}/runs`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔍 Edge Function response status:', response.status);
      
      if (response.ok) {
        const runs = await response.json();
        console.log('✅ Edge Function success, runs count:', runs.length);
        const transformed = transformSupabaseRuns(runs);
        console.log('✅ Transformed runs:', transformed.length);
        return transformed;
      } else {
        console.warn('⚠️ Edge Function failed, status:', response.status);
      }
    } else {
      console.log('⚠️ No orchestratorBaseUrl, skipping Edge Function');
    }

    // Fallback to direct Supabase
    console.log('🔄 Falling back to direct Supabase...');
    const { data: runs, error } = await supabase
      .from('orchestrator_runs')
      .select(`
        *,
        blockers:orchestrator_manual_tasks(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error);
      console.log('🔄 Using mock data due to Supabase error');
      return mockRuns;
    }

    if (!runs || runs.length === 0) {
      console.log('📭 No runs in database, using mock data');
      return mockRuns;
    }

    console.log('✅ Direct Supabase success, runs count:', runs.length);
    const transformed = transformSupabaseRuns(runs);
    console.log('✅ Final transformed runs:', transformed.length);
    return transformed;
  } catch (error) {
    console.error('❌ Failed to load runs:', error);
    console.log('🔄 Using mock data due to error');
    return mockRuns;
  }
}

function transformSupabaseRuns(runs: unknown[]) {
  console.log('🔧 transformSupabaseRuns: Processing', runs.length, 'runs');
  
  return runs.map((run: any, index) => {
    console.log(`🔧 Transform run ${index}:`, run.id, run.brief?.theme || 'No theme');
    
    const transformedRun = {
      id: run.id,
      status: run.status,
      phase: run.phase,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      brief: run.brief,
      blockers: (run.blockers || []).map((task: any) => ({
        id: task.id,
        runId: task.run_id,
        phase: task.phase as 'prioritize',
        type: task.task_type,
        title: task.title,
        description: task.description,
        createdAt: task.created_at,
        dueAt: task.due_at,
        completedAt: task.completed_at,
        assignee: task.assignee
      }))
    };
    
    console.log(`✅ Transformed run ${index}:`, transformedRun.brief?.theme, 'blockers:', transformedRun.blockers.length);
    return transformedRun;
  });
}

export async function createRun(brief: {
  industry: string;
  goal: string;
  theme: string;
  targetAudience?: string;
  constraints: Record<string, unknown>;
}) {
  console.log('🚀 createRun: Starting with brief:', brief);
  console.log('🚀 createRun: Using URL:', `${orchestratorBaseUrl}/runs`);
  
  try {
    const response = await fetch(`${orchestratorBaseUrl}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ brief })
    });

    console.log('🔍 createRun: Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ createRun: Error response:', errorText);
      throw new Error(`Failed to create run: ${response.status} - ${errorText}`);
    }

    const run = await response.json();
    console.log('✅ createRun: Success, created run:', run.id);
    
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
    
    console.log('✅ createRun: Transformed run:', transformedRun);
    return transformedRun;
  } catch (error) {
    console.error('❌ createRun: Failed:', error);
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
