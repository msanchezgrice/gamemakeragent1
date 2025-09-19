import type { ManualTask, RunRecord } from '@gametok/schemas';
import type { RunStore } from './store.js';
export declare class PgRunStore implements RunStore {
    private readonly sql;
    constructor(databaseUrl: string);
    createRun(run: RunRecord): Promise<void>;
    getRun(id: string): Promise<RunRecord | null>;
    listRuns(): Promise<RunRecord[]>;
    updateRun(run: RunRecord): Promise<void>;
    addManualTask(task: ManualTask): Promise<void>;
    completeManualTask(runId: string, taskId: string): Promise<void>;
    private loadTasks;
}
