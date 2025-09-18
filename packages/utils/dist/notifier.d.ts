import type { ManualTask, Notification } from '@gametok/schemas';
export type NotificationListener = (notification: Notification) => void;
interface NotifierOptions {
    clock?: () => Date;
}
export declare class InMemoryNotifier {
    private listeners;
    private readonly clock;
    constructor(options?: NotifierOptions);
    subscribe(listener: NotificationListener): () => void;
    notify(message: string, task?: ManualTask): void;
}
export {};
