import { describe, expect, it } from 'vitest';
import { gameMetadata, runPhase } from './index';
describe('schemas', () => {
    it('validates game metadata', () => {
        const parsed = gameMetadata.parse({
            slug: 'neon-runner',
            title: 'Neon Runner',
            shortDescription: 'Dash through neon skies to rack up points.',
            genre: 'runner',
            theme: 'futuristic city',
            estimatedDurationSeconds: 90,
            tags: ['fast', 'endless'],
            thumbnailUrl: 'https://example.com/thumb.jpg'
        });
        expect(parsed.slug).toBe('neon-runner');
    });
    it('enumerates phases', () => {
        expect(runPhase.options).toContain('build');
    });
});
//# sourceMappingURL=index.test.js.map