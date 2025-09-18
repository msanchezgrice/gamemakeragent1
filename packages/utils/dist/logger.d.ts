type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LoggerOptions {
    scope?: string;
    level?: LogLevel;
    transport?: (entry: LogEntry) => void;
}
export interface LogEntry {
    level: LogLevel;
    scope?: string;
    message: string;
    meta?: Record<string, unknown>;
    timestamp: string;
}
export declare function createLogger(options?: LoggerOptions): {
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
};
export {};
