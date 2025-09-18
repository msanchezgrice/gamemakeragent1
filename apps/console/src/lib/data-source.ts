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
