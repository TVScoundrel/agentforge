/**
 * Tests for Multi-Agent Routing Strategies
 */

import { describe, it, expect, vi } from 'vitest';
import {
  llmBasedRouting,
  roundRobinRouting,
  skillBasedRouting,
  loadBalancedRouting,
  ruleBasedRouting,
  getRoutingStrategy,
} from '../../src/multi-agent/routing.js';
import type { MultiAgentStateType } from '../../src/multi-agent/state.js';
import type { SupervisorConfig } from '../../src/multi-agent/types.js';

describe('Multi-Agent Routing Strategies', () => {
  const mockState: MultiAgentStateType = {
    input: 'Test task requiring research and analysis',
    messages: [{
      from: 'user',
      to: ['supervisor'],
      type: 'user_input',
      content: 'Test task requiring research and analysis',
      timestamp: Date.now(),
    }],
    workers: {
      'researcher': {
        skills: ['research', 'analysis'],
        tools: ['search', 'scrape'],
        available: true,
        currentWorkload: 0,
      },
      'writer': {
        skills: ['writing', 'editing'],
        tools: ['format'],
        available: true,
        currentWorkload: 2,
      },
      'coder': {
        skills: ['coding', 'debugging'],
        tools: ['compiler', 'debugger'],
        available: true,
        currentWorkload: 1,
      },
    },
    currentAgent: 'supervisor',
    routingHistory: [],
    activeAssignments: [],
    completedTasks: [],
    handoffs: [],
    status: 'routing',
    iteration: 0,
    maxIterations: 10,
    response: '',
  };

  describe('Round-Robin Routing', () => {
    it('should distribute tasks evenly across workers', async () => {
      const config: SupervisorConfig = {
        strategy: 'round-robin',
      };

      const decision1 = await roundRobinRouting.route(mockState, config);
      expect(decision1.targetAgent).toBe('researcher');
      expect(decision1.strategy).toBe('round-robin');
      expect(decision1.confidence).toBe(1.0);

      const state2 = {
        ...mockState,
        routingHistory: [decision1],
      };
      const decision2 = await roundRobinRouting.route(state2, config);
      expect(decision2.targetAgent).toBe('writer');

      const state3 = {
        ...mockState,
        routingHistory: [decision1, decision2],
      };
      const decision3 = await roundRobinRouting.route(state3, config);
      expect(decision3.targetAgent).toBe('coder');
    });

    it('should only route to available workers', async () => {
      const stateWithUnavailable: MultiAgentStateType = {
        ...mockState,
        workers: {
          'researcher': {
            skills: ['research'],
            tools: [],
            available: false,
            currentWorkload: 0,
          },
          'writer': {
            skills: ['writing'],
            tools: [],
            available: true,
            currentWorkload: 0,
          },
        },
      };

      const config: SupervisorConfig = {
        strategy: 'round-robin',
      };

      const decision = await roundRobinRouting.route(stateWithUnavailable, config);
      expect(decision.targetAgent).toBe('writer');
    });

    it('should throw error if no workers available', async () => {
      const stateNoWorkers: MultiAgentStateType = {
        ...mockState,
        workers: {
          'researcher': {
            skills: ['research'],
            tools: [],
            available: false,
            currentWorkload: 0,
          },
        },
      };

      const config: SupervisorConfig = {
        strategy: 'round-robin',
      };

      await expect(roundRobinRouting.route(stateNoWorkers, config))
        .rejects.toThrow('No available workers');
    });
  });

  describe('Skill-Based Routing', () => {
    it('should route to worker with matching skills', async () => {
      const config: SupervisorConfig = {
        strategy: 'skill-based',
      };

      const decision = await skillBasedRouting.route(mockState, config);
      expect(decision.targetAgent).toBe('researcher');
      expect(decision.strategy).toBe('skill-based');
      expect(decision.reasoning).toContain('research');
    });

    it('should prioritize skills over tools', async () => {
      const stateWithToolMatch: MultiAgentStateType = {
        ...mockState,
        input: 'Use the compiler tool',
        messages: [{
          from: 'user',
          to: ['supervisor'],
          type: 'user_input',
          content: 'Use the compiler tool',
          timestamp: Date.now(),
        }],
      };

      const config: SupervisorConfig = {
        strategy: 'skill-based',
      };

      const decision = await skillBasedRouting.route(stateWithToolMatch, config);
      expect(decision.targetAgent).toBe('coder');
    });

    it('should fallback to first available worker if no matches', async () => {
      const stateNoMatch: MultiAgentStateType = {
        ...mockState,
        input: 'Something completely unrelated',
        messages: [{
          from: 'user',
          to: ['supervisor'],
          type: 'user_input',
          content: 'Something completely unrelated',
          timestamp: Date.now(),
        }],
      };

      const config: SupervisorConfig = {
        strategy: 'skill-based',
      };

      const decision = await skillBasedRouting.route(stateNoMatch, config);
      expect(decision.targetAgent).toBe('researcher');
      expect(decision.confidence).toBe(0.5);
      expect(decision.reasoning).toContain('No skill matches');
    });
  });

  describe('Load-Balanced Routing', () => {
    it('should route to worker with lowest workload', async () => {
      const config: SupervisorConfig = {
        strategy: 'load-balanced',
      };

      const decision = await loadBalancedRouting.route(mockState, config);
      expect(decision.targetAgent).toBe('researcher');
      expect(decision.strategy).toBe('load-balanced');
      expect(decision.reasoning).toContain('Lowest workload: 0');
    });

    it('should have high confidence for zero workload', async () => {
      const config: SupervisorConfig = {
        strategy: 'load-balanced',
      };

      const decision = await loadBalancedRouting.route(mockState, config);
      expect(decision.confidence).toBe(1.0);
    });

    it('should throw error if no workers available', async () => {
      const stateNoWorkers: MultiAgentStateType = {
        ...mockState,
        workers: {},
      };

      const config: SupervisorConfig = {
        strategy: 'load-balanced',
      };

      await expect(loadBalancedRouting.route(stateNoWorkers, config))
        .rejects.toThrow('No available workers');
    });
  });

  describe('Rule-Based Routing', () => {
    it('should use custom routing function', async () => {
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

      await expect(ruleBasedRouting.route(mockState, config))
        .rejects.toThrow('requires a custom routing function');
    });
  });

  describe('LLM-Based Routing', () => {
    it('should throw error if no LLM provided', async () => {
      const config: SupervisorConfig = {
        strategy: 'llm-based',
      };

      await expect(llmBasedRouting.route(mockState, config))
        .rejects.toThrow('requires an LLM');
    });
  });

  describe('getRoutingStrategy', () => {
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
});

