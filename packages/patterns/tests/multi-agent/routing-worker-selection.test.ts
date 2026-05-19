import { describe, expect, it } from 'vitest';
import {
  loadBalancedRouting,
  roundRobinRouting,
  skillBasedRouting,
} from '../../src/multi-agent/routing.js';
import type { MultiAgentStateType } from '../../src/multi-agent/state.js';
import type { SupervisorConfig } from '../../src/multi-agent/types.js';
import { createMockRoutingState, createRoutingUserMessage } from './routing.fixtures.js';

describe('Multi-Agent Routing Worker Selection Strategies', () => {
  describe('Round-Robin Routing', () => {
    it('should distribute tasks evenly across workers', async () => {
      const config: SupervisorConfig = {
        strategy: 'round-robin',
      };
      const mockState = createMockRoutingState();

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
        ...createMockRoutingState(),
        workers: {
          researcher: {
            skills: ['research'],
            tools: [],
            available: false,
            currentWorkload: 0,
          },
          writer: {
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
        ...createMockRoutingState(),
        workers: {
          researcher: {
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

      const decision = await skillBasedRouting.route(createMockRoutingState(), config);
      expect(decision.targetAgent).toBe('researcher');
      expect(decision.strategy).toBe('skill-based');
      expect(decision.reasoning).toContain('research');
    });

    it('should prioritize skills over tools', async () => {
      const stateWithToolMatch: MultiAgentStateType = {
        ...createMockRoutingState(),
        input: 'Use the compiler tool',
        messages: [createRoutingUserMessage('Use the compiler tool')],
      };

      const config: SupervisorConfig = {
        strategy: 'skill-based',
      };

      const decision = await skillBasedRouting.route(stateWithToolMatch, config);
      expect(decision.targetAgent).toBe('coder');
    });

    it('should fallback to first available worker if no matches', async () => {
      const stateNoMatch: MultiAgentStateType = {
        ...createMockRoutingState(),
        input: 'Something completely unrelated',
        messages: [createRoutingUserMessage('Something completely unrelated')],
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

      const decision = await loadBalancedRouting.route(createMockRoutingState(), config);
      expect(decision.targetAgent).toBe('researcher');
      expect(decision.strategy).toBe('load-balanced');
      expect(decision.reasoning).toContain('Lowest workload: 0');
    });

    it('should have high confidence for zero workload', async () => {
      const config: SupervisorConfig = {
        strategy: 'load-balanced',
      };

      const decision = await loadBalancedRouting.route(createMockRoutingState(), config);
      expect(decision.confidence).toBe(1.0);
    });

    it('should throw error if no workers available', async () => {
      const stateNoWorkers: MultiAgentStateType = {
        ...createMockRoutingState(),
        workers: {},
      };

      const config: SupervisorConfig = {
        strategy: 'load-balanced',
      };

      await expect(loadBalancedRouting.route(stateNoWorkers, config))
        .rejects.toThrow('No available workers');
    });
  });
});
