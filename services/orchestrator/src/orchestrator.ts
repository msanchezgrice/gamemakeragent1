import { nanoid } from 'nanoid';
import { ThemeSynthesisAgent } from '@gametok/agents';
import type { AgentContext } from '@gametok/agents';
import {
  intakeBrief,
  manualTask,
  manualTaskType,
  runRecord
} from '@gametok/schemas';
import type { IntakeBrief, ManualTask, RunRecord, RunPhase } from '@gametok/schemas';
import { InMemoryNotifier, createLogger } from '@gametok/utils';

interface OrchestratorOptions {
  notifier?: InMemoryNotifier;
}

interface CreateRunInput {
  brief: IntakeBrief;
}

interface AdvanceResult {
  run: RunRecord;
  createdArtifacts: string[];
  createdTasks: ManualTask[];
}

type RunStoreRecord = RunRecord;

export class OrchestratorService {
  private runs = new Map<string, RunStoreRecord>();
  private readonly notifier: InMemoryNotifier;
  private readonly logger = createLogger({ scope: 'orchestrator' });

  constructor(options: OrchestratorOptions = {}) {
    this.notifier = options.notifier ?? new InMemoryNotifier();
  }

  listRuns() {
    return Array.from(this.runs.values());
  }

  getRun(id: string) {
    return this.runs.get(id);
  }

  createRun(input: CreateRunInput): RunRecord {
    const brief = intakeBrief.parse(input.brief);
    const id = nanoid();
    const now = new Date().toISOString();
    const run: RunRecord = {
      id,
      status: 'queued',
      phase: 'market',
      createdAt: now,
      updatedAt: now,
      brief,
      blockers: []
    };
    this.runs.set(id, run);
    this.logger.info('Created run', { id });
    return run;
  }

  async advance(runId: string): Promise<AdvanceResult> {
    const run = this.runs.get(runId);
    if (!run) throw new Error('Run not found');

    const createdArtifacts: string[] = [];
    const createdTasks: ManualTask[] = [];

    switch (run.phase) {
      case 'market': {
        const context = this.buildAgentContext(run);
        const result = await ThemeSynthesisAgent.run(
          {
            theme: run.brief.theme,
            targetGameTypes: ['runner', 'match3', 'blockbreaker']
          },
          context
        );
        createdArtifacts.push(result.summaryPath);
        run.phase = 'prioritize';
        run.status = 'awaiting_human';
        const task = this.createManualTask(run, 'portfolio_approval');
        createdTasks.push(task);
        this.pushBlocker(run, task);
        break;
      }
      case 'prioritize':
        run.phase = 'build';
        run.status = 'running';
        break;
      case 'build': {
        run.phase = 'qa';
        run.status = 'awaiting_human';
        const task = this.createManualTask(run, 'qa_verification');
        createdTasks.push(task);
        this.pushBlocker(run, task);
        break;
      }
      case 'qa': {
        run.phase = 'deploy';
        run.status = 'awaiting_human';
        const task = this.createManualTask(run, 'deployment_upload');
        createdTasks.push(task);
        this.pushBlocker(run, task);
        break;
      }
      case 'deploy':
        run.phase = 'measure';
        run.status = 'running';
        break;
      case 'measure':
        run.phase = 'decision';
        run.status = 'running';
        break;
      case 'decision':
        run.status = 'done';
        break;
      default:
        break;
    }

    run.updatedAt = new Date().toISOString();
    this.runs.set(runId, run);
    return { run, createdArtifacts, createdTasks };
  }

  resolveTask(runId: string, taskId: string) {
    const run = this.runs.get(runId);
    if (!run) throw new Error('Run not found');
    run.blockers = run.blockers.filter((task) => task.id !== taskId);
    if (run.blockers.length === 0 && run.status === 'awaiting_human') {
      run.status = 'running';
    }
    run.updatedAt = new Date().toISOString();
    this.runs.set(runId, run);
    return run;
  }

  private buildAgentContext(run: RunRecord): AgentContext {
    return {
      runId: run.id,
      stepId: nanoid(),
      phase: run.phase as RunPhase,
      brief: run.brief,
      clock: () => new Date(),
      saveArtifact: async ({ kind, extension, data, meta }) => {
        const path = `artifacts/${run.id}/${kind}.${extension}`;
        const sha256 = nanoid();
        this.logger.info('Writing artifact', { path, meta, size: data instanceof Buffer ? data.byteLength : data.length });
        return { path, sha256 };
      },
      emitBlocker: async (blocker) => {
        const task = this.createManualTask(run, blocker.blockerType);
        this.pushBlocker(run, task);
        this.notifier.notify(blocker.title, task);
      }
    };
  }

  private createManualTask(run: RunRecord, type: ManualTask['type']): ManualTask {
    const task = manualTask.parse({
      id: nanoid(),
      runId: run.id,
      phase: run.phase,
      type,
      title: this.taskTitle(type),
      description: this.taskDescription(type),
      createdAt: new Date().toISOString()
    });
    return task;
  }

  private pushBlocker(run: RunRecord, task: ManualTask) {
    run.blockers = [...run.blockers.filter((existing) => existing.id !== task.id), task];
    this.notifier.notify(`Action required: ${task.title}`, task);
  }

  private taskTitle(type: ManualTask['type']) {
    switch (type) {
      case 'portfolio_approval':
        return 'Approve portfolio candidates';
      case 'qa_verification':
        return 'Verify QA results';
      case 'deployment_upload':
        return 'Upload bundle to Clipcade';
      default:
        return 'Manual review';
    }
  }

  private taskDescription(type: ManualTask['type']) {
    switch (type) {
      case 'portfolio_approval':
        return 'Review candidate games, select winners, and unblock the build phase.';
      case 'qa_verification':
        return 'Run manual playtests and confirm autoplayer evidence before deployment.';
      case 'deployment_upload':
        return 'Upload bundle assets to Clipcade and confirm metadata accuracy.';
      default:
        return 'Manual action required.';
    }
  }
}
