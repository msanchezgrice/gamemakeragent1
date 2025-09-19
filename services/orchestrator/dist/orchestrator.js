import { v4 as uuidv4 } from 'uuid';
import { ThemeSynthesisAgent } from '@gametok/agents';
import { intakeBrief, manualTask } from '@gametok/schemas';
import { InMemoryNotifier, createLogger } from '@gametok/utils';
export class OrchestratorService {
    notifier;
    logger = createLogger({ scope: 'orchestrator' });
    store;
    constructor(options = {}) {
        this.notifier = options.notifier ?? new InMemoryNotifier();
        if (!options.store) {
            throw new Error('RunStore is required');
        }
        this.store = options.store;
    }
    listRuns() {
        return this.store.listRuns();
    }
    getRun(id) {
        return this.store.getRun(id);
    }
    async createRun(input) {
        const brief = intakeBrief.parse(input.brief);
        const now = new Date().toISOString();
        const run = {
            id: uuidv4(),
            status: 'queued',
            phase: 'market',
            createdAt: now,
            updatedAt: now,
            brief,
            blockers: []
        };
        await this.store.createRun(run);
        this.logger.info('Created run', { id: run.id });
        return run;
    }
    async advance(runId) {
        const run = await this.requireRun(runId);
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
                const task = await this.createManualTask(run, 'portfolio_approval');
                createdTasks.push(task);
                break;
            }
            case 'prioritize':
                run.phase = 'build';
                run.status = 'running';
                run.updatedAt = new Date().toISOString();
                await this.store.updateRun(run);
                break;
            case 'build': {
                run.phase = 'qa';
                run.status = 'awaiting_human';
                const task = await this.createManualTask(run, 'qa_verification');
                createdTasks.push(task);
                break;
            }
            case 'qa': {
                run.phase = 'deploy';
                run.status = 'awaiting_human';
                const task = await this.createManualTask(run, 'deployment_upload');
                createdTasks.push(task);
                break;
            }
            case 'deploy':
                run.phase = 'measure';
                run.status = 'running';
                run.updatedAt = new Date().toISOString();
                await this.store.updateRun(run);
                break;
            case 'measure':
                run.phase = 'decision';
                run.status = 'running';
                run.updatedAt = new Date().toISOString();
                await this.store.updateRun(run);
                break;
            case 'decision':
                run.status = 'done';
                run.updatedAt = new Date().toISOString();
                await this.store.updateRun(run);
                break;
            default:
                break;
        }
        const latestRun = await this.requireRun(runId);
        return { run: latestRun, createdArtifacts, createdTasks };
    }
    async resolveTask(runId, taskId) {
        await this.store.completeManualTask(runId, taskId);
        const run = await this.requireRun(runId);
        if (run.blockers.length === 0 && run.status === 'awaiting_human') {
            run.status = 'running';
            run.updatedAt = new Date().toISOString();
            await this.store.updateRun(run);
            return this.requireRun(runId);
        }
        return run;
    }
    buildAgentContext(run) {
        return {
            runId: run.id,
            stepId: uuidv4(),
            phase: run.phase,
            brief: run.brief,
            clock: () => new Date(),
            saveArtifact: async ({ kind, extension, data, meta }) => {
                const path = `artifacts/${run.id}/${kind}.${extension}`;
                const sha256 = uuidv4();
                this.logger.info('Writing artifact', { path, meta, size: data instanceof Buffer ? data.byteLength : data.length });
                return { path, sha256 };
            },
            emitBlocker: async (blocker) => {
                const task = await this.createManualTask(run, blocker.blockerType);
                this.notifier.notify(blocker.title, task);
            }
        };
    }
    async createManualTask(run, type) {
        const task = manualTask.parse({
            id: uuidv4(),
            runId: run.id,
            phase: run.phase,
            type,
            title: this.taskTitle(type),
            description: this.taskDescription(type),
            createdAt: new Date().toISOString()
        });
        await this.store.addManualTask(task);
        run.blockers = [...run.blockers.filter((existing) => existing.id !== task.id), task];
        run.updatedAt = new Date().toISOString();
        await this.store.updateRun(run);
        return task;
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
    async requireRun(runId) {
        const run = await this.store.getRun(runId);
        if (!run)
            throw new Error('Run not found');
        return run;
    }
}
//# sourceMappingURL=orchestrator.js.map