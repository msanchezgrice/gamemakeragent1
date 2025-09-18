import { nanoid } from 'nanoid';
import type { ManualTask, Notification } from '@gametok/schemas';

export type NotificationListener = (notification: Notification) => void;

interface NotifierOptions {
  clock?: () => Date;
}

export class InMemoryNotifier {
  private listeners = new Set<NotificationListener>();
  private readonly clock: () => Date;

  constructor(options: NotifierOptions = {}) {
    this.clock = options.clock ?? (() => new Date());
  }

  subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(message: string, task?: ManualTask) {
    const notification: Notification = {
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
