import type { IntakeBrief, ManualTask, RunRecord } from '@gametok/schemas';
import { InMemoryNotifier } from '@gametok/utils';
interface OrchestratorOptions {
    notifier?: InMemoryNotifier;
}
interface CreateRunInput {
    brief: IntakeBrief;
}
interface AdvanceResult {
    run: RunRecord;
    createdArtifacts: string[];
    createdTasks: ManualTask[];
}
export declare class OrchestratorService {
    private runs;
    private readonly notifier;
    private readonly logger;
    constructor(options?: OrchestratorOptions);
    listRuns(): {
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
    }[];
    getRun(id: string): {
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
    } | undefined;
    createRun(input: CreateRunInput): RunRecord;
    advance(runId: string): Promise<AdvanceResult>;
    resolveTask(runId: string, taskId: string): {
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
    };
    private buildAgentContext;
    private createManualTask;
    private pushBlocker;
    private taskTitle;
    private taskDescription;
}
export {};
