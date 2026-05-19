import { describe, expect, it } from 'vitest';
import {
  getRoutingStrategy,
  llmBasedRouting,
  loadBalancedRouting,
  roundRobinRouting,
  ruleBasedRouting,
  skillBasedRouting,
} from '../../src/multi-agent/routing.js';

describe('Multi-Agent Routing Strategy Registry', () => {
  it('should return correct strategy implementation', () => {
    expect(getRoutingStrategy('round-robin')).toBe(roundRobinRouting);
    expect(getRoutingStrategy('skill-based')).toBe(skillBasedRouting);
    expect(getRoutingStrategy('load-balanced')).toBe(loadBalancedRouting);
    expect(getRoutingStrategy('rule-based')).toBe(ruleBasedRouting);
    expect(getRoutingStrategy('llm-based')).toBe(llmBasedRouting);
  });

  it('should throw error for unknown strategy', () => {
    expect(() => getRoutingStrategy('unknown'))
      .toThrow('Unknown routing strategy');
  });
});
