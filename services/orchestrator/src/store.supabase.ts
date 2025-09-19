import { createClient } from '@supabase/supabase-js';
import type { RunRecord, ManualTask } from '@gametok/schemas';
import type { RunStore } from './store.js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export class SupabaseRunStore implements RunStore {
  private supabase;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async listRuns(): Promise<RunRecord[]> {
    const { data: runs, error } = await this.supabase
      .from('orchestrator_runs')
      .select(`
        *,
        blockers:orchestrator_manual_tasks!run_id(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list runs: ${error.message}`);
    }

    return runs.map(this.transformDatabaseRun);
  }

  async getRun(id: string): Promise<RunRecord | null> {
    const { data: run, error } = await this.supabase
      .from('orchestrator_runs')
      .select(`
        *,
        blockers:orchestrator_manual_tasks!run_id(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get run: ${error.message}`);
    }

    return this.transformDatabaseRun(run);
  }

  async createRun(run: RunRecord): Promise<void> {
    const { error } = await this.supabase
      .from('orchestrator_runs')
      .insert({
        id: run.id,
        status: run.status,
        phase: run.phase,
        brief: run.brief,
        created_at: run.createdAt,
        updated_at: run.updatedAt,
        notes: null
      });

    if (error) {
      throw new Error(`Failed to create run: ${error.message}`);
    }
  }

  async updateRun(run: RunRecord): Promise<void> {
    const { error } = await this.supabase
      .from('orchestrator_runs')
      .update({
        status: run.status,
        phase: run.phase,
        brief: run.brief,
        updated_at: run.updatedAt
      })
      .eq('id', run.id);

    if (error) {
      throw new Error(`Failed to update run: ${error.message}`);
    }
  }

  async createTask(task: ManualTask): Promise<void> {
    const { error } = await this.supabase
      .from('orchestrator_manual_tasks')
      .insert({
        id: task.id,
        run_id: task.runId,
        phase: task.phase,
        task_type: task.type,
        title: task.title,
        description: task.description,
        created_at: task.createdAt,
        due_at: task.dueAt,
        completed_at: task.completedAt,
        assignee: task.assignee,
        status: 'open'
      });

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  async updateTask(task: ManualTask): Promise<void> {
    const { error } = await this.supabase
      .from('orchestrator_manual_tasks')
      .update({
        status: task.completedAt ? 'completed' : 'open',
        completed_at: task.completedAt,
        assignee: task.assignee
      })
      .eq('id', task.id);

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }
  }

  async addManualTask(task: ManualTask): Promise<void> {
    return this.createTask(task);
  }

  async completeManualTask(runId: string, taskId: string): Promise<void> {
    const { error } = await this.supabase
      .from('orchestrator_manual_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('run_id', runId);

    if (error) {
      throw new Error(`Failed to complete manual task: ${error.message}`);
    }
  }

  private transformDatabaseRun(dbRun: any): RunRecord {
    return {
      id: dbRun.id,
      status: dbRun.status,
      phase: dbRun.phase,
      createdAt: dbRun.created_at,
      updatedAt: dbRun.updated_at,
      brief: dbRun.brief,
      blockers: (dbRun.blockers || []).map((task: any) => ({
        id: task.id,
        runId: task.run_id,
        phase: task.phase,
        type: task.task_type,
        title: task.title,
        description: task.description,
        createdAt: task.created_at,
        dueAt: task.due_at,
        completedAt: task.completed_at,
        assignee: task.assignee
      }))
    };
  }
}
