import type { IntakeBrief, RunPhase } from '@gametok/schemas';
import type { LoggerOptions } from '@gametok/utils';
export interface AgentContext {
    runId: string;
    stepId: string;
    phase: RunPhase;
    brief: IntakeBrief;
    clock: () => Date;
    saveArtifact: (input: AgentArtifactInput) => Promise<AgentArtifactReference>;
    emitBlocker: (blocker: AgentBlocker) => Promise<void>;
}
export interface AgentArtifactInput {
    kind: string;
    extension: 'json' | 'md';
    data: string | Buffer;
    meta?: Record<string, unknown>;
}
export interface AgentArtifactReference {
    path: string;
    sha256?: string;
}
export interface AgentBlocker {
    title: string;
    description: string;
    blockerType: 'portfolio_approval' | 'qa_verification' | 'deployment_upload';
}
export interface Agent<I, O> {
    name: string;
    run(input: I, ctx: AgentContext): Promise<O>;
}
export declare function createAgentLogger(options: LoggerOptions): {
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
};
