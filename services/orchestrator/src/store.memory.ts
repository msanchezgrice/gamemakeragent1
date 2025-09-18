import { nanoid } from 'nanoid';
import type { ManualTask, RunRecord } from '@gametok/schemas';
import type { RunStore } from './store.js';

export class InMemoryRunStore implements RunStore {
  private runs = new Map<string, RunRecord>();

  async createRun(run: RunRecord): Promise<void> {
    this.runs.set(run.id, JSON.parse(JSON.stringify(run)));
  }

  async getRun(id: string): Promise<RunRecord | null> {
    const run = this.runs.get(id);
    return run ? JSON.parse(JSON.stringify(run)) : null;
  }

  async listRuns(): Promise<RunRecord[]> {
    return Array.from(this.runs.values()).map((run) => JSON.parse(JSON.stringify(run)));
  }

  async updateRun(run: RunRecord): Promise<void> {
    this.runs.set(run.id, JSON.parse(JSON.stringify(run)));
  }

  async addManualTask(task: ManualTask): Promise<void> {
    const run = this.runs.get(task.runId);
    if (!run) return;
    const next = { ...task, id: task.id ?? nanoid() } as ManualTask;
    run.blockers = [...run.blockers.filter((b) => b.id !== next.id), next];
  }

  async completeManualTask(runId: string, taskId: string): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) return;
    run.blockers = run.blockers.filter((task) => task.id !== taskId);
  }
}
