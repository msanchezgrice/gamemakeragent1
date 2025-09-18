import { createLogger } from '@gametok/utils';
export function createAgentLogger(options) {
    return createLogger({ ...options, scope: options.scope ?? 'agent' });
}
//# sourceMappingURL=base.js.map