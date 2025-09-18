const levelOrder = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40
};
export function createLogger(options = {}) {
    const minLevel = options.level ?? 'info';
    const scope = options.scope;
    const writer = options.transport ?? defaultTransport;
    function log(level, message, meta) {
        if (levelOrder[level] < levelOrder[minLevel])
            return;
        writer({
            level,
            scope,
            message,
            meta,
            timestamp: new Date().toISOString()
        });
    }
    return {
        debug(message, meta) {
            log('debug', message, meta);
        },
        info(message, meta) {
            log('info', message, meta);
        },
        warn(message, meta) {
            log('warn', message, meta);
        },
        error(message, meta) {
            log('error', message, meta);
        }
    };
}
function defaultTransport(entry) {
    const { level, scope, message, meta, timestamp } = entry;
    // Scope formatting keeps console output compact.
    const prefix = scope ? `[${scope}]` : '';
    // eslint-disable-next-line no-console
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](`${timestamp} ${level.toUpperCase()} ${prefix} ${message}`.trim(), meta ?? '');
}
//# sourceMappingURL=logger.js.map