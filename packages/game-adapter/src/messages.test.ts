import { describe, expect, it } from 'vitest';
import type { EngineInboundCommand } from './messages.js';

describe('engine messages', () => {
  it('accepts pause command shape', () => {
    const cmd: EngineInboundCommand = { type: 'pause' };
    expect(cmd.type).toBe('pause');
  });
});
