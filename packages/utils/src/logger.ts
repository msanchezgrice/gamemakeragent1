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

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

export function createLogger(options: LoggerOptions = {}) {
  const minLevel = options.level ?? 'info';
  const scope = options.scope;
  const writer = options.transport ?? defaultTransport;

  function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    if (levelOrder[level] < levelOrder[minLevel]) return;
    writer({
      level,
      scope,
      message,
      meta,
      timestamp: new Date().toISOString()
    });
  }

  return {
    debug(message: string, meta?: Record<string, unknown>) {
      log('debug', message, meta);
    },
    info(message: string, meta?: Record<string, unknown>) {
      log('info', message, meta);
    },
    warn(message: string, meta?: Record<string, unknown>) {
      log('warn', message, meta);
    },
    error(message: string, meta?: Record<string, unknown>) {
      log('error', message, meta);
    }
  };
}

function defaultTransport(entry: LogEntry) {
  const { level, scope, message, meta, timestamp } = entry;
  // Scope formatting keeps console output compact.
  const prefix = scope ? `[${scope}]` : '';
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
    `${timestamp} ${level.toUpperCase()} ${prefix} ${message}`.trim(),
    meta ?? ''
  );
}
