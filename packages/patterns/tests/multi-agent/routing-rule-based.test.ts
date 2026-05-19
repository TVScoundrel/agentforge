import { describe, expect, it, vi } from 'vitest';
import { ruleBasedRouting } from '../../src/multi-agent/routing.js';
import type { SupervisorConfig } from '../../src/multi-agent/types.js';
import { createMockRoutingState } from './routing.fixtures.js';

describe('Multi-Agent Rule-Based Routing', () => {
  it('should use custom routing function', async () => {
    const mockState = createMockRoutingState();
    const customRoutingFn = vi.fn().mockResolvedValue({
      targetAgent: 'writer',
      reasoning: 'Custom rule applied',
      confidence: 0.9,
      strategy: 'rule-based',
      timestamp: Date.now(),
    });

    const config: SupervisorConfig = {
      strategy: 'rule-based',
      routingFn: customRoutingFn,
    };

    const decision = await ruleBasedRouting.route(mockState, config);
    expect(customRoutingFn).toHaveBeenCalledWith(mockState);
    expect(decision.targetAgent).toBe('writer');
    expect(decision.reasoning).toBe('Custom rule applied');
  });

  it('should throw error if no routing function provided', async () => {
    const config: SupervisorConfig = {
      strategy: 'rule-based',
    };

    await expect(ruleBasedRouting.route(createMockRoutingState(), config))
      .rejects.toThrow('requires a custom routing function');
  });
});
