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
export const runStatus = z.enum([
    'queued',
    'running',
    'awaiting_human',
    'paused',
    'failed',
    'done'
]);
export const manualTaskType = z.enum([
    'portfolio_approval',
    'qa_verification',
    'deployment_upload'
]);
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
export const gameType = z.enum([
    'runner',
    'blockbreaker',
    'match3',
    'snake',
    'educational_math',
    'educational_colors',
    'custom'
]);
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
export const runRecord = z.object({
    id: z.string().uuid(),
    status: runStatus,
    phase: runPhase,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    brief: intakeBrief,
    blockers: z.array(manualTask).default([])
});
export const notification = z.object({
    id: z.string().uuid(),
    runId: z.string().uuid(),
    task: manualTask.optional(),
    message: z.string(),
    level: z.enum(['info', 'warning', 'critical']).default('info'),
    createdAt: z.string().datetime(),
    readAt: z.string().datetime().optional()
});
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
//# sourceMappingURL=index.js.map