import { nanoid } from 'nanoid';
export class InMemoryRunStore {
    runs = new Map();
    async createRun(run) {
        this.runs.set(run.id, JSON.parse(JSON.stringify(run)));
    }
    async getRun(id) {
        const run = this.runs.get(id);
        return run ? JSON.parse(JSON.stringify(run)) : null;
    }
    async listRuns() {
        return Array.from(this.runs.values()).map((run) => JSON.parse(JSON.stringify(run)));
    }
    async updateRun(run) {
        this.runs.set(run.id, JSON.parse(JSON.stringify(run)));
    }
    async addManualTask(task) {
        const run = this.runs.get(task.runId);
        if (!run)
            return;
        const next = { ...task, id: task.id ?? nanoid() };
        run.blockers = [...run.blockers.filter((b) => b.id !== next.id), next];
    }
    async completeManualTask(runId, taskId) {
        const run = this.runs.get(runId);
        if (!run)
            return;
        run.blockers = run.blockers.filter((task) => task.id !== taskId);
    }
}
//# sourceMappingURL=store.memory.js.map