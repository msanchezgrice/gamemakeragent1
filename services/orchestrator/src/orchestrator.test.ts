import { describe, expect, it } from 'vitest';
import { OrchestratorService } from './orchestrator.js';
import { InMemoryRunStore } from './store.memory.js';

describe('OrchestratorService', () => {
  it('creates and advances runs with blockers', async () => {
    const orchestrator = new OrchestratorService({ store: new InMemoryRunStore() });
    const run = await orchestrator.createRun({
      brief: {
        industry: 'hypercasual',
        goal: 'Generate runner concepts',
        theme: 'neon skyline',
        constraints: {}
      }
    });
    expect(run.status).toBe('queued');
    const result = await orchestrator.advance(run.id);
    expect(result.run.blockers.length).toBeGreaterThan(0);
  });
});
