import { describe, expect, it } from 'vitest';
describe('engine messages', () => {
    it('accepts pause command shape', () => {
        const cmd = { type: 'pause' };
        expect(cmd.type).toBe('pause');
    });
});
//# sourceMappingURL=messages.test.js.map