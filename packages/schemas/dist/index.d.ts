import { z } from 'zod';
export declare const runPhase: z.ZodEnum<["intake", "market", "synthesis", "deconstruct", "prioritize", "build", "qa", "deploy", "measure", "decision"]>;
export type RunPhase = z.infer<typeof runPhase>;
export declare const runStatus: z.ZodEnum<["queued", "running", "awaiting_human", "paused", "failed", "done"]>;
export type RunStatus = z.infer<typeof runStatus>;
export declare const manualTaskType: z.ZodEnum<["portfolio_approval", "qa_verification", "deployment_upload"]>;
export type ManualTaskType = z.infer<typeof manualTaskType>;
export declare const manualTask: z.ZodObject<{
    id: z.ZodString;
    runId: z.ZodString;
    phase: z.ZodEnum<["intake", "market", "synthesis", "deconstruct", "prioritize", "build", "qa", "deploy", "measure", "decision"]>;
    type: z.ZodEnum<["portfolio_approval", "qa_verification", "deployment_upload"]>;
    title: z.ZodString;
    description: z.ZodString;
    createdAt: z.ZodString;
    dueAt: z.ZodOptional<z.ZodString>;
    completedAt: z.ZodOptional<z.ZodString>;
    assignee: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "portfolio_approval" | "qa_verification" | "deployment_upload";
    id: string;
    runId: string;
    phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
    title: string;
    description: string;
    createdAt: string;
    dueAt?: string | undefined;
    completedAt?: string | undefined;
    assignee?: string | undefined;
}, {
    type: "portfolio_approval" | "qa_verification" | "deployment_upload";
    id: string;
    runId: string;
    phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
    title: string;
    description: string;
    createdAt: string;
    dueAt?: string | undefined;
    completedAt?: string | undefined;
    assignee?: string | undefined;
}>;
export type ManualTask = z.infer<typeof manualTask>;
export declare const intakeBrief: z.ZodObject<{
    industry: z.ZodString;
    targetAudience: z.ZodOptional<z.ZodString>;
    goal: z.ZodString;
    theme: z.ZodString;
    constraints: z.ZodDefault<z.ZodObject<{
        maxTokens: z.ZodOptional<z.ZodNumber>;
        budgetUsd: z.ZodOptional<z.ZodNumber>;
        timeboxHours: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxTokens?: number | undefined;
        budgetUsd?: number | undefined;
        timeboxHours?: number | undefined;
    }, {
        maxTokens?: number | undefined;
        budgetUsd?: number | undefined;
        timeboxHours?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    industry: string;
    goal: string;
    theme: string;
    constraints: {
        maxTokens?: number | undefined;
        budgetUsd?: number | undefined;
        timeboxHours?: number | undefined;
    };
    targetAudience?: string | undefined;
}, {
    industry: string;
    goal: string;
    theme: string;
    targetAudience?: string | undefined;
    constraints?: {
        maxTokens?: number | undefined;
        budgetUsd?: number | undefined;
        timeboxHours?: number | undefined;
    } | undefined;
}>;
export type IntakeBrief = z.infer<typeof intakeBrief>;
export declare const gameType: z.ZodEnum<["runner", "blockbreaker", "match3", "snake", "educational_math", "educational_colors", "custom"]>;
export type GameType = z.infer<typeof gameType>;
export declare const gameMetadata: z.ZodObject<{
    slug: z.ZodString;
    title: z.ZodString;
    shortDescription: z.ZodString;
    genre: z.ZodEnum<["runner", "blockbreaker", "match3", "snake", "educational_math", "educational_colors", "custom"]>;
    theme: z.ZodString;
    estimatedDurationSeconds: z.ZodNumber;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    thumbnailUrl: z.ZodOptional<z.ZodString>;
    playInstructions: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    theme: string;
    slug: string;
    shortDescription: string;
    genre: "runner" | "blockbreaker" | "match3" | "snake" | "educational_math" | "educational_colors" | "custom";
    estimatedDurationSeconds: number;
    tags: string[];
    thumbnailUrl?: string | undefined;
    playInstructions?: string | undefined;
}, {
    title: string;
    theme: string;
    slug: string;
    shortDescription: string;
    genre: "runner" | "blockbreaker" | "match3" | "snake" | "educational_math" | "educational_colors" | "custom";
    estimatedDurationSeconds: number;
    tags?: string[] | undefined;
    thumbnailUrl?: string | undefined;
    playInstructions?: string | undefined;
}>;
export type GameMetadata = z.infer<typeof gameMetadata>;
export declare const artifact: z.ZodObject<{
    id: z.ZodString;
    runId: z.ZodString;
    stepId: z.ZodOptional<z.ZodString>;
    phase: z.ZodEnum<["intake", "market", "synthesis", "deconstruct", "prioritize", "build", "qa", "deploy", "measure", "decision"]>;
    kind: z.ZodString;
    path: z.ZodString;
    sha256: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    meta: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    path: string;
    id: string;
    runId: string;
    phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
    createdAt: string;
    kind: string;
    meta: Record<string, any>;
    stepId?: string | undefined;
    sha256?: string | undefined;
}, {
    path: string;
    id: string;
    runId: string;
    phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
    createdAt: string;
    kind: string;
    stepId?: string | undefined;
    sha256?: string | undefined;
    meta?: Record<string, any> | undefined;
}>;
export type Artifact = z.infer<typeof artifact>;
export declare const runRecord: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodEnum<["queued", "running", "awaiting_human", "paused", "failed", "done"]>;
    phase: z.ZodEnum<["intake", "market", "synthesis", "deconstruct", "prioritize", "build", "qa", "deploy", "measure", "decision"]>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    brief: z.ZodObject<{
        industry: z.ZodString;
        targetAudience: z.ZodOptional<z.ZodString>;
        goal: z.ZodString;
        theme: z.ZodString;
        constraints: z.ZodDefault<z.ZodObject<{
            maxTokens: z.ZodOptional<z.ZodNumber>;
            budgetUsd: z.ZodOptional<z.ZodNumber>;
            timeboxHours: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            maxTokens?: number | undefined;
            budgetUsd?: number | undefined;
            timeboxHours?: number | undefined;
        }, {
            maxTokens?: number | undefined;
            budgetUsd?: number | undefined;
            timeboxHours?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        industry: string;
        goal: string;
        theme: string;
        constraints: {
            maxTokens?: number | undefined;
            budgetUsd?: number | undefined;
            timeboxHours?: number | undefined;
        };
        targetAudience?: string | undefined;
    }, {
        industry: string;
        goal: string;
        theme: string;
        targetAudience?: string | undefined;
        constraints?: {
            maxTokens?: number | undefined;
            budgetUsd?: number | undefined;
            timeboxHours?: number | undefined;
        } | undefined;
    }>;
    blockers: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        runId: z.ZodString;
        phase: z.ZodEnum<["intake", "market", "synthesis", "deconstruct", "prioritize", "build", "qa", "deploy", "measure", "decision"]>;
        type: z.ZodEnum<["portfolio_approval", "qa_verification", "deployment_upload"]>;
        title: z.ZodString;
        description: z.ZodString;
        createdAt: z.ZodString;
        dueAt: z.ZodOptional<z.ZodString>;
        completedAt: z.ZodOptional<z.ZodString>;
        assignee: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "portfolio_approval" | "qa_verification" | "deployment_upload";
        id: string;
        runId: string;
        phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
        title: string;
        description: string;
        createdAt: string;
        dueAt?: string | undefined;
        completedAt?: string | undefined;
        assignee?: string | undefined;
    }, {
        type: "portfolio_approval" | "qa_verification" | "deployment_upload";
        id: string;
        runId: string;
        phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
        title: string;
        description: string;
        createdAt: string;
        dueAt?: string | undefined;
        completedAt?: string | undefined;
        assignee?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    status: "queued" | "running" | "awaiting_human" | "paused" | "failed" | "done";
    id: string;
    phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
    createdAt: string;
    updatedAt: string;
    brief: {
        industry: string;
        goal: string;
        theme: string;
        constraints: {
            maxTokens?: number | undefined;
            budgetUsd?: number | undefined;
            timeboxHours?: number | undefined;
        };
        targetAudience?: string | undefined;
    };
    blockers: {
        type: "portfolio_approval" | "qa_verification" | "deployment_upload";
        id: string;
        runId: string;
        phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
        title: string;
        description: string;
        createdAt: string;
        dueAt?: string | undefined;
        completedAt?: string | undefined;
        assignee?: string | undefined;
    }[];
}, {
    status: "queued" | "running" | "awaiting_human" | "paused" | "failed" | "done";
    id: string;
    phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
    createdAt: string;
    updatedAt: string;
    brief: {
        industry: string;
        goal: string;
        theme: string;
        targetAudience?: string | undefined;
        constraints?: {
            maxTokens?: number | undefined;
            budgetUsd?: number | undefined;
            timeboxHours?: number | undefined;
        } | undefined;
    };
    blockers?: {
        type: "portfolio_approval" | "qa_verification" | "deployment_upload";
        id: string;
        runId: string;
        phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
        title: string;
        description: string;
        createdAt: string;
        dueAt?: string | undefined;
        completedAt?: string | undefined;
        assignee?: string | undefined;
    }[] | undefined;
}>;
export type RunRecord = z.infer<typeof runRecord>;
export declare const notification: z.ZodObject<{
    id: z.ZodString;
    runId: z.ZodString;
    task: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        runId: z.ZodString;
        phase: z.ZodEnum<["intake", "market", "synthesis", "deconstruct", "prioritize", "build", "qa", "deploy", "measure", "decision"]>;
        type: z.ZodEnum<["portfolio_approval", "qa_verification", "deployment_upload"]>;
        title: z.ZodString;
        description: z.ZodString;
        createdAt: z.ZodString;
        dueAt: z.ZodOptional<z.ZodString>;
        completedAt: z.ZodOptional<z.ZodString>;
        assignee: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "portfolio_approval" | "qa_verification" | "deployment_upload";
        id: string;
        runId: string;
        phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
        title: string;
        description: string;
        createdAt: string;
        dueAt?: string | undefined;
        completedAt?: string | undefined;
        assignee?: string | undefined;
    }, {
        type: "portfolio_approval" | "qa_verification" | "deployment_upload";
        id: string;
        runId: string;
        phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
        title: string;
        description: string;
        createdAt: string;
        dueAt?: string | undefined;
        completedAt?: string | undefined;
        assignee?: string | undefined;
    }>>;
    message: z.ZodString;
    level: z.ZodDefault<z.ZodEnum<["info", "warning", "critical"]>>;
    createdAt: z.ZodString;
    readAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message: string;
    id: string;
    runId: string;
    createdAt: string;
    level: "info" | "warning" | "critical";
    task?: {
        type: "portfolio_approval" | "qa_verification" | "deployment_upload";
        id: string;
        runId: string;
        phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
        title: string;
        description: string;
        createdAt: string;
        dueAt?: string | undefined;
        completedAt?: string | undefined;
        assignee?: string | undefined;
    } | undefined;
    readAt?: string | undefined;
}, {
    message: string;
    id: string;
    runId: string;
    createdAt: string;
    task?: {
        type: "portfolio_approval" | "qa_verification" | "deployment_upload";
        id: string;
        runId: string;
        phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
        title: string;
        description: string;
        createdAt: string;
        dueAt?: string | undefined;
        completedAt?: string | undefined;
        assignee?: string | undefined;
    } | undefined;
    level?: "info" | "warning" | "critical" | undefined;
    readAt?: string | undefined;
}>;
export type Notification = z.infer<typeof notification>;
export declare const lsScoreInput: z.ZodObject<{
    gameId: z.ZodString;
    variantId: z.ZodString;
    scoreClass: z.ZodEnum<["runner", "arcade", "puzzle", "skill", "strategy", "idle", "board"]>;
    playRate: z.ZodNumber;
    depthSec: z.ZodNumber;
    replayRate: z.ZodNumber;
    saveRate: z.ZodNumber;
    shareRate: z.ZodNumber;
    typeMetric: z.ZodNumber;
    penalties: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    gameId: string;
    variantId: string;
    scoreClass: "runner" | "arcade" | "puzzle" | "skill" | "strategy" | "idle" | "board";
    playRate: number;
    depthSec: number;
    replayRate: number;
    saveRate: number;
    shareRate: number;
    typeMetric: number;
    penalties: number;
}, {
    gameId: string;
    variantId: string;
    scoreClass: "runner" | "arcade" | "puzzle" | "skill" | "strategy" | "idle" | "board";
    playRate: number;
    depthSec: number;
    replayRate: number;
    saveRate: number;
    shareRate: number;
    typeMetric: number;
    penalties: number;
}>;
export type LsScoreInput = z.infer<typeof lsScoreInput>;
export declare const schemas: {
    runPhase: z.ZodEnum<["intake", "market", "synthesis", "deconstruct", "prioritize", "build", "qa", "deploy", "measure", "decision"]>;
    runStatus: z.ZodEnum<["queued", "running", "awaiting_human", "paused", "failed", "done"]>;
    manualTask: z.ZodObject<{
        id: z.ZodString;
        runId: z.ZodString;
        phase: z.ZodEnum<["intake", "market", "synthesis", "deconstruct", "prioritize", "build", "qa", "deploy", "measure", "decision"]>;
        type: z.ZodEnum<["portfolio_approval", "qa_verification", "deployment_upload"]>;
        title: z.ZodString;
        description: z.ZodString;
        createdAt: z.ZodString;
        dueAt: z.ZodOptional<z.ZodString>;
        completedAt: z.ZodOptional<z.ZodString>;
        assignee: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "portfolio_approval" | "qa_verification" | "deployment_upload";
        id: string;
        runId: string;
        phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
        title: string;
        description: string;
        createdAt: string;
        dueAt?: string | undefined;
        completedAt?: string | undefined;
        assignee?: string | undefined;
    }, {
        type: "portfolio_approval" | "qa_verification" | "deployment_upload";
        id: string;
        runId: string;
        phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
        title: string;
        description: string;
        createdAt: string;
        dueAt?: string | undefined;
        completedAt?: string | undefined;
        assignee?: string | undefined;
    }>;
    manualTaskType: z.ZodEnum<["portfolio_approval", "qa_verification", "deployment_upload"]>;
    intakeBrief: z.ZodObject<{
        industry: z.ZodString;
        targetAudience: z.ZodOptional<z.ZodString>;
        goal: z.ZodString;
        theme: z.ZodString;
        constraints: z.ZodDefault<z.ZodObject<{
            maxTokens: z.ZodOptional<z.ZodNumber>;
            budgetUsd: z.ZodOptional<z.ZodNumber>;
            timeboxHours: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            maxTokens?: number | undefined;
            budgetUsd?: number | undefined;
            timeboxHours?: number | undefined;
        }, {
            maxTokens?: number | undefined;
            budgetUsd?: number | undefined;
            timeboxHours?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        industry: string;
        goal: string;
        theme: string;
        constraints: {
            maxTokens?: number | undefined;
            budgetUsd?: number | undefined;
            timeboxHours?: number | undefined;
        };
        targetAudience?: string | undefined;
    }, {
        industry: string;
        goal: string;
        theme: string;
        targetAudience?: string | undefined;
        constraints?: {
            maxTokens?: number | undefined;
            budgetUsd?: number | undefined;
            timeboxHours?: number | undefined;
        } | undefined;
    }>;
    gameType: z.ZodEnum<["runner", "blockbreaker", "match3", "snake", "educational_math", "educational_colors", "custom"]>;
    gameMetadata: z.ZodObject<{
        slug: z.ZodString;
        title: z.ZodString;
        shortDescription: z.ZodString;
        genre: z.ZodEnum<["runner", "blockbreaker", "match3", "snake", "educational_math", "educational_colors", "custom"]>;
        theme: z.ZodString;
        estimatedDurationSeconds: z.ZodNumber;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        thumbnailUrl: z.ZodOptional<z.ZodString>;
        playInstructions: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        theme: string;
        slug: string;
        shortDescription: string;
        genre: "runner" | "blockbreaker" | "match3" | "snake" | "educational_math" | "educational_colors" | "custom";
        estimatedDurationSeconds: number;
        tags: string[];
        thumbnailUrl?: string | undefined;
        playInstructions?: string | undefined;
    }, {
        title: string;
        theme: string;
        slug: string;
        shortDescription: string;
        genre: "runner" | "blockbreaker" | "match3" | "snake" | "educational_math" | "educational_colors" | "custom";
        estimatedDurationSeconds: number;
        tags?: string[] | undefined;
        thumbnailUrl?: string | undefined;
        playInstructions?: string | undefined;
    }>;
    artifact: z.ZodObject<{
        id: z.ZodString;
        runId: z.ZodString;
        stepId: z.ZodOptional<z.ZodString>;
        phase: z.ZodEnum<["intake", "market", "synthesis", "deconstruct", "prioritize", "build", "qa", "deploy", "measure", "decision"]>;
        kind: z.ZodString;
        path: z.ZodString;
        sha256: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
        meta: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        id: string;
        runId: string;
        phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
        createdAt: string;
        kind: string;
        meta: Record<string, any>;
        stepId?: string | undefined;
        sha256?: string | undefined;
    }, {
        path: string;
        id: string;
        runId: string;
        phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
        createdAt: string;
        kind: string;
        stepId?: string | undefined;
        sha256?: string | undefined;
        meta?: Record<string, any> | undefined;
    }>;
    runRecord: z.ZodObject<{
        id: z.ZodString;
        status: z.ZodEnum<["queued", "running", "awaiting_human", "paused", "failed", "done"]>;
        phase: z.ZodEnum<["intake", "market", "synthesis", "deconstruct", "prioritize", "build", "qa", "deploy", "measure", "decision"]>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        brief: z.ZodObject<{
            industry: z.ZodString;
            targetAudience: z.ZodOptional<z.ZodString>;
            goal: z.ZodString;
            theme: z.ZodString;
            constraints: z.ZodDefault<z.ZodObject<{
                maxTokens: z.ZodOptional<z.ZodNumber>;
                budgetUsd: z.ZodOptional<z.ZodNumber>;
                timeboxHours: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                maxTokens?: number | undefined;
                budgetUsd?: number | undefined;
                timeboxHours?: number | undefined;
            }, {
                maxTokens?: number | undefined;
                budgetUsd?: number | undefined;
                timeboxHours?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            industry: string;
            goal: string;
            theme: string;
            constraints: {
                maxTokens?: number | undefined;
                budgetUsd?: number | undefined;
                timeboxHours?: number | undefined;
            };
            targetAudience?: string | undefined;
        }, {
            industry: string;
            goal: string;
            theme: string;
            targetAudience?: string | undefined;
            constraints?: {
                maxTokens?: number | undefined;
                budgetUsd?: number | undefined;
                timeboxHours?: number | undefined;
            } | undefined;
        }>;
        blockers: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            runId: z.ZodString;
            phase: z.ZodEnum<["intake", "market", "synthesis", "deconstruct", "prioritize", "build", "qa", "deploy", "measure", "decision"]>;
            type: z.ZodEnum<["portfolio_approval", "qa_verification", "deployment_upload"]>;
            title: z.ZodString;
            description: z.ZodString;
            createdAt: z.ZodString;
            dueAt: z.ZodOptional<z.ZodString>;
            completedAt: z.ZodOptional<z.ZodString>;
            assignee: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "portfolio_approval" | "qa_verification" | "deployment_upload";
            id: string;
            runId: string;
            phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
            title: string;
            description: string;
            createdAt: string;
            dueAt?: string | undefined;
            completedAt?: string | undefined;
            assignee?: string | undefined;
        }, {
            type: "portfolio_approval" | "qa_verification" | "deployment_upload";
            id: string;
            runId: string;
            phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
            title: string;
            description: string;
            createdAt: string;
            dueAt?: string | undefined;
            completedAt?: string | undefined;
            assignee?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        status: "queued" | "running" | "awaiting_human" | "paused" | "failed" | "done";
        id: string;
        phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
        createdAt: string;
        updatedAt: string;
        brief: {
            industry: string;
            goal: string;
            theme: string;
            constraints: {
                maxTokens?: number | undefined;
                budgetUsd?: number | undefined;
                timeboxHours?: number | undefined;
            };
            targetAudience?: string | undefined;
        };
        blockers: {
            type: "portfolio_approval" | "qa_verification" | "deployment_upload";
            id: string;
            runId: string;
            phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
            title: string;
            description: string;
            createdAt: string;
            dueAt?: string | undefined;
            completedAt?: string | undefined;
            assignee?: string | undefined;
        }[];
    }, {
        status: "queued" | "running" | "awaiting_human" | "paused" | "failed" | "done";
        id: string;
        phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
        createdAt: string;
        updatedAt: string;
        brief: {
            industry: string;
            goal: string;
            theme: string;
            targetAudience?: string | undefined;
            constraints?: {
                maxTokens?: number | undefined;
                budgetUsd?: number | undefined;
                timeboxHours?: number | undefined;
            } | undefined;
        };
        blockers?: {
            type: "portfolio_approval" | "qa_verification" | "deployment_upload";
            id: string;
            runId: string;
            phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
            title: string;
            description: string;
            createdAt: string;
            dueAt?: string | undefined;
            completedAt?: string | undefined;
            assignee?: string | undefined;
        }[] | undefined;
    }>;
    notification: z.ZodObject<{
        id: z.ZodString;
        runId: z.ZodString;
        task: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            runId: z.ZodString;
            phase: z.ZodEnum<["intake", "market", "synthesis", "deconstruct", "prioritize", "build", "qa", "deploy", "measure", "decision"]>;
            type: z.ZodEnum<["portfolio_approval", "qa_verification", "deployment_upload"]>;
            title: z.ZodString;
            description: z.ZodString;
            createdAt: z.ZodString;
            dueAt: z.ZodOptional<z.ZodString>;
            completedAt: z.ZodOptional<z.ZodString>;
            assignee: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "portfolio_approval" | "qa_verification" | "deployment_upload";
            id: string;
            runId: string;
            phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
            title: string;
            description: string;
            createdAt: string;
            dueAt?: string | undefined;
            completedAt?: string | undefined;
            assignee?: string | undefined;
        }, {
            type: "portfolio_approval" | "qa_verification" | "deployment_upload";
            id: string;
            runId: string;
            phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
            title: string;
            description: string;
            createdAt: string;
            dueAt?: string | undefined;
            completedAt?: string | undefined;
            assignee?: string | undefined;
        }>>;
        message: z.ZodString;
        level: z.ZodDefault<z.ZodEnum<["info", "warning", "critical"]>>;
        createdAt: z.ZodString;
        readAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        id: string;
        runId: string;
        createdAt: string;
        level: "info" | "warning" | "critical";
        task?: {
            type: "portfolio_approval" | "qa_verification" | "deployment_upload";
            id: string;
            runId: string;
            phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
            title: string;
            description: string;
            createdAt: string;
            dueAt?: string | undefined;
            completedAt?: string | undefined;
            assignee?: string | undefined;
        } | undefined;
        readAt?: string | undefined;
    }, {
        message: string;
        id: string;
        runId: string;
        createdAt: string;
        task?: {
            type: "portfolio_approval" | "qa_verification" | "deployment_upload";
            id: string;
            runId: string;
            phase: "intake" | "market" | "synthesis" | "deconstruct" | "prioritize" | "build" | "qa" | "deploy" | "measure" | "decision";
            title: string;
            description: string;
            createdAt: string;
            dueAt?: string | undefined;
            completedAt?: string | undefined;
            assignee?: string | undefined;
        } | undefined;
        level?: "info" | "warning" | "critical" | undefined;
        readAt?: string | undefined;
    }>;
    lsScoreInput: z.ZodObject<{
        gameId: z.ZodString;
        variantId: z.ZodString;
        scoreClass: z.ZodEnum<["runner", "arcade", "puzzle", "skill", "strategy", "idle", "board"]>;
        playRate: z.ZodNumber;
        depthSec: z.ZodNumber;
        replayRate: z.ZodNumber;
        saveRate: z.ZodNumber;
        shareRate: z.ZodNumber;
        typeMetric: z.ZodNumber;
        penalties: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        gameId: string;
        variantId: string;
        scoreClass: "runner" | "arcade" | "puzzle" | "skill" | "strategy" | "idle" | "board";
        playRate: number;
        depthSec: number;
        replayRate: number;
        saveRate: number;
        shareRate: number;
        typeMetric: number;
        penalties: number;
    }, {
        gameId: string;
        variantId: string;
        scoreClass: "runner" | "arcade" | "puzzle" | "skill" | "strategy" | "idle" | "board";
        playRate: number;
        depthSec: number;
        replayRate: number;
        saveRate: number;
        shareRate: number;
        typeMetric: number;
        penalties: number;
    }>;
};
export type Schemas = typeof schemas;
