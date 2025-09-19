import { z } from 'zod';
import { runRecord } from '@gametok/schemas';
import { mockRuns } from './mock-data';

const runsResponse = z.object({ runs: z.array(runRecord) });

const orchestratorBaseUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL;

export async function loadRuns() {
  if (!orchestratorBaseUrl) {
    return mockRuns;
  }

  try {
    const response = await fetch(`${orchestratorBaseUrl}/runs`, {
      cache: 'no-store'
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch runs (${response.status})`);
    }
    const json = await response.json();
    const parsed = runsResponse.safeParse({ runs: json });
    if (!parsed.success) {
      throw parsed.error;
    }
    return parsed.data.runs;
  } catch (error) {
    console.error('Failed to load runs from orchestrator', error);
    return mockRuns;
  }
}

export async function createRun(brief: unknown) {
  if (!orchestratorBaseUrl) {
    // Mock creation - add to local storage or return mock ID
    const mockRun = {
      id: `mock-${Date.now()}`,
      status: 'queued' as const,
      phase: 'intake' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      brief,
      blockers: []
    };
    console.log('Mock run created:', mockRun);
    return mockRun;
  }

  try {
    const response = await fetch(`${orchestratorBaseUrl}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ brief })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create run (${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to create run:', error);
    throw error;
  }
}

export async function advanceRun(runId: string) {
  if (!orchestratorBaseUrl) {
    console.log('Mock advance run:', runId);
    return { success: true };
  }

  try {
    const response = await fetch(`${orchestratorBaseUrl}/runs/${runId}/advance`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to advance run (${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to advance run:', error);
    throw error;
  }
}

export async function completeTask(taskId: string) {
  if (!orchestratorBaseUrl) {
    console.log('Mock complete task:', taskId);
    return { success: true };
  }

  try {
    const response = await fetch(`${orchestratorBaseUrl}/tasks/${taskId}/complete`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to complete task (${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to complete task:', error);
    throw error;
  }
}
