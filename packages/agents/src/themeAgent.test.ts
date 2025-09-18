import { describe, expect, it } from 'vitest';
import { ThemeSynthesisAgent } from './themeAgent.js';

describe('ThemeSynthesisAgent', () => {
  it('produces markdown artifact', async () => {
    const saved: any[] = [];
    const output = await ThemeSynthesisAgent.run(
      { theme: 'neon runners', targetGameTypes: ['runner'] },
      {
        runId: '00000000-0000-0000-0000-000000000000',
        stepId: '00000000-0000-0000-0000-000000000001',
        phase: 'market',
        brief: {
          industry: 'hypercasual',
          goal: 'discover trends',
          theme: 'neon runners',
          constraints: {}
        },
        clock: () => new Date('2024-01-01T00:00:00Z'),
        async saveArtifact(input) {
          saved.push(input);
          return { path: 'artifacts/theme.md', sha256: 'placeholder' };
        },
        async emitBlocker() {}
      }
    );
    expect(saved[0].kind).toBe('market_theme_summary');
    expect(output.summaryPath).toBe('artifacts/theme.md');
  });
});
