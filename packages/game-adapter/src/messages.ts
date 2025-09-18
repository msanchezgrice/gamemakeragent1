export type EngineOutboundEvent =
  | { type: 'game_loaded'; payload?: Record<string, unknown> }
  | { type: 'game_started'; payload?: Record<string, unknown> }
  | { type: 'progress'; payload: { percent: number } }
  | { type: 'game_ended'; payload?: { reason?: string; score?: number } }
  | { type: 'telemetry'; payload: Record<string, unknown> };

export type EngineInboundCommand =
  | { type: 'init'; payload: { runId?: string; variantId?: string } }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'mute'; payload: { muted: boolean } }
  | { type: 'reset' };

export interface EngineMessage<TType extends string, TPayload = Record<string, unknown>> {
  type: TType;
  payload: TPayload;
}

export interface GameWindowAdapter {
  targetOrigin: string;
  post(event: EngineOutboundEvent): void;
  onCommand(handler: (command: EngineInboundCommand) => void): () => void;
}

export interface PerformanceBudget {
  timeToFirstInputMs: number;
  steadyFps: number;
  memoryMb: number;
}

export interface BundleManifest {
  entry: string;
  assets: Array<{ path: string; hash: string; size: number }>;
  orientation: 'portrait' | 'landscape';
  approximateSizeKb: number;
  performanceBudget: PerformanceBudget;
}
