import type { RunRecord, ManualTask } from '@gametok/schemas';
import type { RunStore } from './store.js';
export declare class SupabaseRunStore implements RunStore {
    private supabase;
    constructor();
    listRuns(): Promise<RunRecord[]>;
    getRun(id: string): Promise<RunRecord | null>;
    createRun(run: RunRecord): Promise<void>;
    updateRun(run: RunRecord): Promise<void>;
    createTask(task: ManualTask): Promise<void>;
    updateTask(task: ManualTask): Promise<void>;
    addManualTask(task: ManualTask): Promise<void>;
    completeManualTask(runId: string, taskId: string): Promise<void>;
    private transformDatabaseRun;
}
