// import { z } from 'zod';
// import { runRecord } from '@gametok/schemas';
import { supabase } from './supabase';
import type { RunRecord } from '@gametok/schemas';

type RunWithMetrics = RunRecord & {
  metrics: {
    progress: number;
    playRate?: number;
    likability?: number;
  };
};

function addMetrics(runs: RunRecord[]): RunWithMetrics[] {
  return runs.map((run) => {
    const phaseProgress = calculatePhaseProgress(run.phase, run.status);
    return {
      ...run,
      metrics: {
        progress: phaseProgress,
        playRate: run.status === 'done' ? Math.random() * 0.6 + 0.3 : undefined,
        likability: run.status === 'done' ? Math.random() * 0.8 + 0.2 : undefined
      }
    };
  });
}

function calculatePhaseProgress(phase: string, status: string): number {
  const phaseOrder = ['intake', 'market', 'synthesis', 'deconstruct', 'prioritize', 'build', 'qa', 'deploy', 'measure', 'decision'];
  const currentPhaseIndex = phaseOrder.indexOf(phase);
  
  if (currentPhaseIndex === -1) return 0;
  
  // Base progress from completed phases
  const baseProgress = currentPhaseIndex / phaseOrder.length;
  
  // Add progress within current phase based on status
  let phaseProgress = 0;
  switch (status) {
    case 'queued':
      phaseProgress = 0;
      break;
    case 'running':
      phaseProgress = 0.5; // 50% through current phase
      break;
    case 'awaiting_human':
      phaseProgress = 0.8; // 80% through current phase, waiting for approval
      break;
    case 'done':
      return 1.0; // 100% complete
    case 'failed':
      return baseProgress; // Stuck at current phase
    default:
      phaseProgress = 0.3; // Default partial progress
  }
  
  // Add the within-phase progress
  const phaseWeight = 1 / phaseOrder.length;
  return Math.min(baseProgress + (phaseProgress * phaseWeight), 1.0);
}

const orchestratorBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL 
  ? process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/orchestrator-api'
  : null;

export async function loadRuns(): Promise<RunWithMetrics[]> {
  console.log('🔍 loadRuns: Starting to load runs...');
  console.log('🔍 orchestratorBaseUrl:', orchestratorBaseUrl);
  console.log('🔍 SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  try {
    // Try Edge Function first, fallback to direct Supabase, then mock
    if (orchestratorBaseUrl && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('🚀 Trying Edge Function:', `${orchestratorBaseUrl}/runs`);
      
      try {
        const response = await fetch(`${orchestratorBaseUrl}/runs`, {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          cache: 'no-store'
        });
        
        console.log('🔍 Edge Function response status:', response.status);
        
        if (response.ok) {
          const runs = await response.json();
        console.log('✅ Edge Function success, runs count:', runs.length);
        const transformed = transformSupabaseRuns(runs);
        console.log('✅ Transformed runs:', transformed.length);
        return addMetrics(transformed);
        } else {
          const errorText = await response.text();
          console.warn('⚠️ Edge Function failed, status:', response.status, 'error:', errorText);
        }
      } catch (fetchError) {
        console.warn('⚠️ Edge Function fetch failed:', fetchError);
      }
    } else {
      console.log('⚠️ No orchestratorBaseUrl or anon key, skipping Edge Function');
      console.log('🔍 orchestratorBaseUrl:', orchestratorBaseUrl);
      console.log('🔍 anonKey available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
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
      console.log('🔄 Returning empty array due to Supabase error');
      return [];
    }

    if (!runs || runs.length === 0) {
      console.log('📭 No runs in database, returning empty array');
      return [];
    }

      console.log('✅ Direct Supabase success, runs count:', runs.length);
      const transformed = transformSupabaseRuns(runs);
      console.log('✅ Final transformed runs:', transformed.length);
      return addMetrics(transformed);
  } catch (error) {
    console.error('❌ Failed to load runs:', error);
    console.log('🔄 Returning empty array due to error');
    return [];
  }
}

function transformSupabaseRuns(runs: unknown[]): RunRecord[] {
  console.log('🔧 transformSupabaseRuns: Processing', runs.length, 'runs');
  
  return runs.map((run: any, index) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.log(`🔧 Transform run ${index}:`, run.id, run.brief?.theme || 'No theme');
    
    const transformedRun: RunRecord = {
      id: run.id as string,
      status: run.status as RunRecord['status'],
      phase: run.phase as RunRecord['phase'],
      createdAt: run.created_at as string,
      updatedAt: run.updated_at as string,
      brief: run.brief as RunRecord['brief'],
      blockers: (run.blockers || [])
        .filter((task: any) => task.status === 'open') // eslint-disable-line @typescript-eslint/no-explicit-any -- Only include open tasks
        .map((task: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
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
  console.log('🔥 =================================');
  console.log('🚀 createRun: STARTING NEW RUN CREATION');
  console.log('🔥 =================================');
  console.log('📝 Brief data:', JSON.stringify(brief, null, 2));
  console.log('🌐 Target URL:', `${orchestratorBaseUrl}/runs`);
  console.log('🔑 Auth available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  try {
    console.log('📡 Making POST request to Edge Function...');
    
    const requestBody = { brief };
    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${orchestratorBaseUrl}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📊 Response received:');
    console.log('  - Status:', response.status);
    console.log('  - Status Text:', response.statusText);
    console.log('  - Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ createRun: Error response body:', errorText);
      throw new Error(`Failed to create run: ${response.status} - ${errorText}`);
    }

    const run = await response.json();
    console.log('🎉 createRun: SUCCESS! Raw response:', JSON.stringify(run, null, 2));
    
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
    
    console.log('✨ createRun: Transformed run:', JSON.stringify(transformedRun, null, 2));
    console.log('🔥 =================================');
    console.log('✅ RUN CREATION COMPLETE - ID:', run.id);
    console.log('🔥 =================================');
    
    return transformedRun;
  } catch (error) {
    console.log('🔥 =================================');
    console.error('💥 createRun: FAILED WITH ERROR:', error);
    console.log('🔥 =================================');
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
