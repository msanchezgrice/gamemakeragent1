import postgres from 'postgres';
import type { ManualTask, RunRecord } from '@gametok/schemas';
import type { RunStore } from './store.js';

export class PgRunStore implements RunStore {
  private readonly sql: ReturnType<typeof postgres>;

  constructor(databaseUrl: string) {
    this.sql = postgres(databaseUrl);
  }

  async createRun(run: RunRecord): Promise<void> {
    await this.sql`
      insert into orchestrator_runs (id, status, phase, brief, created_at, updated_at)
      values (${run.id}::uuid, ${run.status}, ${run.phase}, ${this.sql.json(run.brief)}, ${run.createdAt}::timestamptz, ${run.updatedAt}::timestamptz)
      on conflict (id) do nothing
    `;
  }

  async getRun(id: string): Promise<RunRecord | null> {
    const runs = await this.sql<RunRow[]>`
      select id, status, phase, brief, created_at, updated_at
      from orchestrator_runs
      where id = ${id}::uuid
    `;
    if (!runs.length) return null;
    const row = runs[0];
    const blockers = await this.loadTasks([row.id]);
    return mapRowToRun(row, blockers.get(row.id) ?? []);
  }

  async listRuns(): Promise<RunRecord[]> {
    const rows = await this.sql<RunRow[]>`
      select id, status, phase, brief, created_at, updated_at
      from orchestrator_runs
      order by created_at desc
    `;
    if (!rows.length) return [];
    const blockers = await this.loadTasks(rows.map((row) => row.id));
    return rows.map((row) => mapRowToRun(row, blockers.get(row.id) ?? []));
  }

  async updateRun(run: RunRecord): Promise<void> {
    await this.sql`
      update orchestrator_runs
      set status = ${run.status},
          phase = ${run.phase},
          brief = ${this.sql.json(run.brief)},
          updated_at = ${run.updatedAt}::timestamptz
      where id = ${run.id}::uuid
    `;
  }

  async addManualTask(task: ManualTask): Promise<void> {
    await this.sql`
      insert into orchestrator_manual_tasks (id, run_id, phase, task_type, title, description, created_at, status)
      values (
        ${task.id}::uuid,
        ${task.runId}::uuid,
        ${task.phase},
        ${task.type},
        ${task.title},
        ${task.description},
        ${task.createdAt}::timestamptz,
        'open'
      )
      on conflict (id) do update set
        phase = excluded.phase,
        task_type = excluded.task_type,
        title = excluded.title,
        description = excluded.description,
        status = excluded.status,
        created_at = excluded.created_at
    `;
  }

  async completeManualTask(runId: string, taskId: string): Promise<void> {
    await this.sql`
      update orchestrator_manual_tasks
      set status = 'completed', completed_at = now()
      where id = ${taskId}::uuid and run_id = ${runId}::uuid
    `;
  }

  private async loadTasks(runIds: string[]): Promise<Map<string, ManualTask[]>> {
    if (!runIds.length) return new Map();
    const rows = await this.sql<TaskRow[]>`
      select id, run_id, phase, task_type, title, description, created_at, status, completed_at, due_at, assignee
      from orchestrator_manual_tasks
      where run_id = any(${this.sql.array(runIds)}::uuid[])
        and status = 'open'
    `;
    const grouped = new Map<string, ManualTask[]>();
    for (const row of rows) {
      const task: ManualTask = {
        id: row.id,
        runId: row.run_id,
        phase: row.phase,
        type: row.task_type,
        title: row.title,
        description: row.description,
        createdAt: row.created_at.toISOString(),
        dueAt: row.due_at ? row.due_at.toISOString() : undefined,
        completedAt: row.completed_at ? row.completed_at.toISOString() : undefined,
        assignee: row.assignee ?? undefined
      };
      const bucket = grouped.get(row.run_id) ?? [];
      bucket.push(task);
      grouped.set(row.run_id, bucket);
    }
    return grouped;
  }
}

type RunRow = {
  id: string;
  status: RunRecord['status'];
  phase: RunRecord['phase'];
  brief: RunRecord['brief'];
  created_at: Date;
  updated_at: Date;
};

type TaskRow = {
  id: string;
  run_id: string;
  phase: ManualTask['phase'];
  task_type: ManualTask['type'];
  title: string;
  description: string;
  created_at: Date;
  due_at: Date | null;
  completed_at: Date | null;
  status: string;
  assignee: string | null;
};

function mapRowToRun(row: RunRow, blockers: ManualTask[]): RunRecord {
  return {
    id: row.id,
    status: row.status,
    phase: row.phase,
    brief: row.brief,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    blockers
  };
}
