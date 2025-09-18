import { describe, expect, it } from 'vitest';
import { DEFAULT_WEIGHTS, lsScore } from './ls.js';
describe('lsScore', () => {
    it('clamps output between 0 and 1', () => {
        const score = lsScore({
            gameId: '00000000-0000-0000-0000-000000000001',
            variantId: '00000000-0000-0000-0000-000000000002',
            scoreClass: 'runner',
            playRate: 0.9,
            depthSec: 120,
            replayRate: 0.4,
            saveRate: 0.2,
            shareRate: 0.2,
            typeMetric: 0.6,
            penalties: 0.05
        }, { runner: 90 }, DEFAULT_WEIGHTS);
        expect(score).toBeGreaterThan(0);
        expect(score).toBeLessThanOrEqual(1);
    });
});
//# sourceMappingURL=ls.test.js.map