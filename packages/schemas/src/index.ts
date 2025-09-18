import { z } from 'zod';

export const runPhase = z.enum([
  'intake',
  'market',
  'synthesis',
  'deconstruct',
  'prioritize',
  'build',
  'qa',
  'deploy',
  'measure',
  'decision'
]);
export type RunPhase = z.infer<typeof runPhase>;

export const runStatus = z.enum([
  'queued',
  'running',
  'awaiting_human',
  'paused',
  'failed',
  'done'
]);
export type RunStatus = z.infer<typeof runStatus>;

export const manualTaskType = z.enum([
  'portfolio_approval',
  'qa_verification',
  'deployment_upload'
]);
export type ManualTaskType = z.infer<typeof manualTaskType>;

export const manualTask = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  phase: runPhase,
  type: manualTaskType,
  title: z.string(),
  description: z.string(),
  createdAt: z.string().datetime(),
  dueAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  assignee: z.string().optional()
});
export type ManualTask = z.infer<typeof manualTask>;

export const intakeBrief = z.object({
  industry: z.string(),
  targetAudience: z.string().optional(),
  goal: z.string(),
  theme: z.string(),
  constraints: z.object({
    maxTokens: z.number().int().positive().optional(),
    budgetUsd: z.number().nonnegative().optional(),
    timeboxHours: z.number().positive().optional()
  }).default({})
});
export type IntakeBrief = z.infer<typeof intakeBrief>;

export const gameType = z.enum([
  'runner',
  'blockbreaker',
  'match3',
  'snake',
  'educational_math',
  'educational_colors',
  'custom'
]);
export type GameType = z.infer<typeof gameType>;

export const gameMetadata = z.object({
  slug: z.string(),
  title: z.string(),
  shortDescription: z.string().min(10),
  genre: gameType,
  theme: z.string(),
  estimatedDurationSeconds: z.number().int().positive(),
  tags: z.array(z.string()).default([]),
  thumbnailUrl: z.string().url().optional(),
  playInstructions: z.string().optional()
});
export type GameMetadata = z.infer<typeof gameMetadata>;

export const artifact = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  stepId: z.string().uuid().optional(),
  phase: runPhase,
  kind: z.string(),
  path: z.string(),
  sha256: z.string().length(64).optional(),
  createdAt: z.string().datetime(),
  meta: z.record(z.any()).default({})
});
export type Artifact = z.infer<typeof artifact>;

export const runRecord = z.object({
  id: z.string().uuid(),
  status: runStatus,
  phase: runPhase,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  brief: intakeBrief,
  blockers: z.array(manualTask).default([])
});
export type RunRecord = z.infer<typeof runRecord>;

export const notification = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  task: manualTask.optional(),
  message: z.string(),
  level: z.enum(['info', 'warning', 'critical']).default('info'),
  createdAt: z.string().datetime(),
  readAt: z.string().datetime().optional()
});
export type Notification = z.infer<typeof notification>;

export const lsScoreInput = z.object({
  gameId: z.string().uuid(),
  variantId: z.string().uuid(),
  scoreClass: z.enum([
    'runner',
    'arcade',
    'puzzle',
    'skill',
    'strategy',
    'idle',
    'board'
  ]),
  playRate: z.number().min(0).max(1),
  depthSec: z.number().nonnegative(),
  replayRate: z.number().min(0).max(1),
  saveRate: z.number().min(0).max(1),
  shareRate: z.number().min(0).max(1),
  typeMetric: z.number().min(0).max(1),
  penalties: z.number().min(0).max(1)
});
export type LsScoreInput = z.infer<typeof lsScoreInput>;

export const schemas = {
  runPhase,
  runStatus,
  manualTask,
  manualTaskType,
  intakeBrief,
  gameType,
  gameMetadata,
  artifact,
  runRecord,
  notification,
  lsScoreInput
};

export type Schemas = typeof schemas;
