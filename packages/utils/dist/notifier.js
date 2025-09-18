import { nanoid } from 'nanoid';
export class InMemoryNotifier {
    listeners = new Set();
    clock;
    constructor(options = {}) {
        this.clock = options.clock ?? (() => new Date());
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    notify(message, task) {
        const notification = {
            id: nanoid(),
            runId: task?.runId ?? nanoid(),
            task,
            message,
            level: task ? 'warning' : 'info',
            createdAt: this.clock().toISOString()
        };
        for (const listener of this.listeners) {
            listener(notification);
        }
    }
}
//# sourceMappingURL=notifier.js.map