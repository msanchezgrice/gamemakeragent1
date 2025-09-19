import postgres from 'postgres';
export class PgRunStore {
    sql;
    constructor(databaseUrl) {
        this.sql = postgres(databaseUrl);
    }
    async createRun(run) {
        await this.sql `
      insert into orchestrator_runs (id, status, phase, brief, created_at, updated_at)
      values (${run.id}::uuid, ${run.status}, ${run.phase}, ${this.sql.json(run.brief)}, ${run.createdAt}::timestamptz, ${run.updatedAt}::timestamptz)
      on conflict (id) do nothing
    `;
    }
    async getRun(id) {
        const runs = await this.sql `
      select id, status, phase, brief, created_at, updated_at
      from orchestrator_runs
      where id = ${id}::uuid
    `;
        if (!runs.length)
            return null;
        const row = runs[0];
        const blockers = await this.loadTasks([row.id]);
        return mapRowToRun(row, blockers.get(row.id) ?? []);
    }
    async listRuns() {
        const rows = await this.sql `
      select id, status, phase, brief, created_at, updated_at
      from orchestrator_runs
      order by created_at desc
    `;
        if (!rows.length)
            return [];
        const blockers = await this.loadTasks(rows.map((row) => row.id));
        return rows.map((row) => mapRowToRun(row, blockers.get(row.id) ?? []));
    }
    async updateRun(run) {
        await this.sql `
      update orchestrator_runs
      set status = ${run.status},
          phase = ${run.phase},
          brief = ${this.sql.json(run.brief)},
          updated_at = ${run.updatedAt}::timestamptz
      where id = ${run.id}::uuid
    `;
    }
    async addManualTask(task) {
        await this.sql `
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
    async completeManualTask(runId, taskId) {
        await this.sql `
      update orchestrator_manual_tasks
      set status = 'completed', completed_at = now()
      where id = ${taskId}::uuid and run_id = ${runId}::uuid
    `;
    }
    async loadTasks(runIds) {
        if (!runIds.length)
            return new Map();
        const rows = await this.sql `
      select id, run_id, phase, task_type, title, description, created_at, status, completed_at, due_at, assignee
      from orchestrator_manual_tasks
      where run_id = any(${this.sql.array(runIds)}::uuid[])
        and status = 'open'
    `;
        const grouped = new Map();
        for (const row of rows) {
            const task = {
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
function mapRowToRun(row, blockers) {
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
//# sourceMappingURL=store.pg.js.map