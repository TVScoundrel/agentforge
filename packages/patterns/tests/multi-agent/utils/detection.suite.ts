import { describe, expect, it, vi } from 'vitest';
import { ToolRegistry } from '@agentforge/core';
import { createMockLLM } from '@agentforge/testing';
import { createReActAgent } from '../../../src/react/agent.js';
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

  it('accepts compiled ReAct agents even when the constructor name is unstable', () => {
    const compiledAgent = createReActAgent({
      model: createMockLLM({ responses: ['Mock response'] }) as any,
      tools: new ToolRegistry(),
    });
    const maskedConstructorAgent = Object.create(compiledAgent) as typeof compiledAgent;

    Object.defineProperty(maskedConstructorAgent, 'constructor', {
      value: { name: 'a' },
      configurable: true,
    });

    expect(isReActAgent(maskedConstructorAgent)).toBe(true);
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
