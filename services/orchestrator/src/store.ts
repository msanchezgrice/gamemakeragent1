import type { ManualTask, RunRecord } from '@gametok/schemas';

export interface RunStore {
  createRun(run: RunRecord): Promise<void>;
  getRun(id: string): Promise<RunRecord | null>;
  listRuns(): Promise<RunRecord[]>;
  updateRun(run: RunRecord): Promise<void>;
  addManualTask(task: ManualTask): Promise<void>;
  completeManualTask(runId: string, taskId: string): Promise<void>;
}
