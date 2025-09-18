import { describe, expect, it } from 'vitest';
import { createLogger } from './logger.js';

describe('logger', () => {
  it('emits entries above threshold', () => {
    const messages: string[] = [];
    const logger = createLogger({
      level: 'info',
      scope: 'test',
      transport(entry) {
        messages.push(`${entry.level}:${entry.message}`);
      }
    });
    logger.debug('skip');
    logger.info('hello');
    expect(messages).toEqual(['info:hello']);
  });
});
