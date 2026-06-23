import { describe, expect, it, vi } from 'vitest';
import { isReActAgent } from '../../../src/multi-agent/utils.js';

describe('Multi-Agent Utils detection', () => {
  it('accepts compiled state-graph shaped agents', () => {
    const compiledStateGraphLike = {
      invoke: vi.fn(),
      stream: vi.fn(),
      constructor: { name: 'CompiledStateGraph' },
    };

    expect(isReActAgent(compiledStateGraphLike)).toBe(true);
  });

  it('rejects objects that only partially match the interface', () => {
    expect(
      isReActAgent({
        invoke: vi.fn(),
        constructor: { name: 'CompiledStateGraph' },
      })
    ).toBe(false);
    expect(
      isReActAgent({
        invoke: vi.fn(),
        stream: vi.fn(),
        constructor: { name: 'PlainObject' },
      })
    ).toBe(false);
  });
});
