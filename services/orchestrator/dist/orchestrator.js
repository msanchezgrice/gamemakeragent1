import { nanoid } from 'nanoid';
import { ThemeSynthesisAgent } from '@gametok/agents';
import { intakeBrief, manualTask } from '@gametok/schemas';
import { InMemoryNotifier, createLogger } from '@gametok/utils';
export class OrchestratorService {
    runs = new Map();
    notifier;
    logger = createLogger({ scope: 'orchestrator' });
    constructor(options = {}) {
        this.notifier = options.notifier ?? new InMemoryNotifier();
    }
    listRuns() {
        return Array.from(this.runs.values());
    }
    getRun(id) {
        return this.runs.get(id);
    }
    createRun(input) {
        const brief = intakeBrief.parse(input.brief);
        const id = nanoid();
        const now = new Date().toISOString();
        const run = {
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
    async advance(runId) {
        const run = this.runs.get(runId);
        if (!run)
            throw new Error('Run not found');
        const createdArtifacts = [];
        const createdTasks = [];
        switch (run.phase) {
            case 'market': {
                const context = this.buildAgentContext(run);
                const result = await ThemeSynthesisAgent.run({
                    theme: run.brief.theme,
                    targetGameTypes: ['runner', 'match3', 'blockbreaker']
                }, context);
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
    resolveTask(runId, taskId) {
        const run = this.runs.get(runId);
        if (!run)
            throw new Error('Run not found');
        run.blockers = run.blockers.filter((task) => task.id !== taskId);
        if (run.blockers.length === 0 && run.status === 'awaiting_human') {
            run.status = 'running';
        }
        run.updatedAt = new Date().toISOString();
        this.runs.set(runId, run);
        return run;
    }
    buildAgentContext(run) {
        return {
            runId: run.id,
            stepId: nanoid(),
            phase: run.phase,
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
    createManualTask(run, type) {
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
    pushBlocker(run, task) {
        run.blockers = [...run.blockers.filter((existing) => existing.id !== task.id), task];
        this.notifier.notify(`Action required: ${task.title}`, task);
    }
    taskTitle(type) {
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
    taskDescription(type) {
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
//# sourceMappingURL=orchestrator.js.map