import type { IntakeBrief, RunPhase } from '@gametok/schemas';
import type { LoggerOptions } from '@gametok/utils';
import { createLogger } from '@gametok/utils';

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
  data: string | Uint8Array;
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

export function createAgentLogger(options: LoggerOptions) {
  return createLogger({ ...options, scope: options.scope ?? 'agent' });
}
