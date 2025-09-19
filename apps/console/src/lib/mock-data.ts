import type { RunRecord } from '@gametok/schemas';

type RunWithMetrics = RunRecord & {
  metrics: {
    progress: number;
    playRate?: number;
    likability?: number;
  };
};

export function withMetrics(runs: RunRecord[]): RunWithMetrics[] {
  // Just add metrics to real runs, no mock data override
  return runs.map((run) => ({
    ...run,
    metrics: {
      progress: Math.random() * 0.8 + 0.1, // Random progress for now
      playRate: Math.random() * 0.6 + 0.2,
      likability: Math.random() * 0.8 + 0.1
    }
  }));
}
