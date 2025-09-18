import type { ManualTask, RunRecord } from '@gametok/schemas';

type RunWithMetrics = RunRecord & {
  metrics: {
    progress: number;
    playRate?: number;
    likability?: number;
  };
};

const templateRuns: RunWithMetrics[] = [
  {
    id: 'run-1',
    status: 'awaiting_human',
    phase: 'prioritize',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    brief: {
      industry: 'Hypercasual',
      goal: 'Find top 3 math-runner variants',
      theme: 'Neon Math Runner',
      constraints: { budgetUsd: 50 }
    },
    blockers: [
      {
        id: 'task-1',
        runId: 'run-1',
        phase: 'prioritize',
        type: 'portfolio_approval',
        title: 'Approve portfolio candidates',
        description: 'Review Neon Math Runner variants and unlock build phase.',
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
      } as ManualTask
    ],
    metrics: {
      progress: 0.42
    }
  },
  {
    id: 'run-2',
    status: 'running',
    phase: 'measure',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    brief: {
      industry: 'Education',
      goal: 'Test color matching prototypes',
      theme: 'Color Match Kids',
      constraints: { timeboxHours: 12 }
    },
    blockers: [],
    metrics: {
      progress: 0.78,
      playRate: 0.64,
      likability: 0.58
    }
  },
  {
    id: 'run-3',
    status: 'awaiting_human',
    phase: 'deploy',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 54).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    brief: {
      industry: 'Arcade',
      goal: 'Ship blockbreaker variants',
      theme: 'Cosmic Blockbreaker',
      constraints: { budgetUsd: 75 }
    },
    blockers: [
      {
        id: 'task-3',
        runId: 'run-3',
        phase: 'deploy',
        type: 'deployment_upload',
        title: 'Upload bundle to Clipcade',
        description: 'Upload Cosmic Blockbreaker bundle and confirm metadata.',
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
      } as ManualTask
    ],
    metrics: {
      progress: 0.9,
      playRate: 0.71,
      likability: 0.76
    }
  }
];

export const mockRuns: RunRecord[] = templateRuns.map((run) => {
  const { metrics, ...rest } = run;
  void metrics;
  return rest;
});

export const mockTasks: ManualTask[] = templateRuns.flatMap((run) => run.blockers);

export function withMetrics(runs: RunRecord[]): RunWithMetrics[] {
  const lookup = new Map(templateRuns.map((run) => [run.id, run]));
  return runs.map((run) => {
    const template = lookup.get(run.id);
    return {
      ...run,
      blockers: run.blockers.length ? run.blockers : template?.blockers ?? [],
      metrics: template?.metrics ?? {
        progress: 0.2,
        playRate: undefined,
        likability: undefined
      }
    };
  });
}
