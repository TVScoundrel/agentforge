/**
 * Tests for Multi-Agent System Factory
 */

import { describe, it, expect } from 'vitest';
import { createMultiAgentSystem, registerWorkers } from '../../src/multi-agent/agent.js';
import type { MultiAgentSystemConfig } from '../../src/multi-agent/types.js';

describe('Multi-Agent System Factory', () => {
  describe('createMultiAgentSystem', () => {
    it('should create a multi-agent system', () => {
      const config: MultiAgentSystemConfig = {
        supervisor: {
          strategy: 'round-robin',
        },
        workers: [
          {
            id: 'worker1',
            capabilities: {
              skills: ['skill1'],
              tools: ['tool1'],
              available: true,
              currentWorkload: 0,
            },
          },
          {
            id: 'worker2',
            capabilities: {
              skills: ['skill2'],
              tools: ['tool2'],
              available: true,
              currentWorkload: 0,
            },
          },
        ],
      };

      const system = createMultiAgentSystem(config);
      expect(system).toBeDefined();
      expect(typeof system.invoke).toBe('function');
    });

    it('should throw error if no workers configured', () => {
      const config: MultiAgentSystemConfig = {
        supervisor: {
          strategy: 'round-robin',
        },
        workers: [],
      };

      expect(() => createMultiAgentSystem(config))
        .toThrow('At least one worker must be configured');
    });

    it('should create system with aggregator', () => {
      const config: MultiAgentSystemConfig = {
        supervisor: {
          strategy: 'skill-based',
        },
        workers: [
          {
            id: 'worker1',
            capabilities: {
              skills: ['skill1'],
              tools: [],
              available: true,
              currentWorkload: 0,
            },
          },
        ],
        aggregator: {
          verbose: true,
        },
      };

      const system = createMultiAgentSystem(config);
      expect(system).toBeDefined();
    });

    it('should respect maxIterations config', () => {
      const config: MultiAgentSystemConfig = {
        supervisor: {
          strategy: 'round-robin',
        },
        workers: [
          {
            id: 'worker1',
            capabilities: {
              skills: ['skill1'],
              tools: [],
              available: true,
              currentWorkload: 0,
            },
          },
        ],
        maxIterations: 5,
      };

      const system = createMultiAgentSystem(config);
      expect(system).toBeDefined();
    });

    it('should respect verbose config', () => {
      const config: MultiAgentSystemConfig = {
        supervisor: {
          strategy: 'load-balanced',
        },
        workers: [
          {
            id: 'worker1',
            capabilities: {
              skills: ['skill1'],
              tools: [],
              available: true,
              currentWorkload: 0,
            },
          },
        ],
        verbose: true,
      };

      const system = createMultiAgentSystem(config);
      expect(system).toBeDefined();
    });
  });

  describe('registerWorkers', () => {
    it('should create workers registry', () => {
      const workers = [
        {
          id: 'worker1',
          capabilities: {
            skills: ['skill1'],
            tools: ['tool1'],
            available: true,
            currentWorkload: 0,
          },
        },
        {
          id: 'worker2',
          capabilities: {
            skills: ['skill2'],
            tools: ['tool2'],
            available: true,
            currentWorkload: 1,
          },
        },
      ];

      const registry = registerWorkers(workers);

      expect(registry).toEqual({
        worker1: {
          skills: ['skill1'],
          tools: ['tool1'],
          available: true,
          currentWorkload: 0,
        },
        worker2: {
          skills: ['skill2'],
          tools: ['tool2'],
          available: true,
          currentWorkload: 1,
        },
      });
    });

    it('should handle empty workers array', () => {
      const registry = registerWorkers([]);
      expect(registry).toEqual({});
    });

    it('should handle single worker', () => {
      const workers = [
        {
          id: 'solo',
          capabilities: {
            skills: ['everything'],
            tools: ['all'],
            available: true,
            currentWorkload: 0,
          },
        },
      ];

      const registry = registerWorkers(workers);

      expect(registry).toEqual({
        solo: {
          skills: ['everything'],
          tools: ['all'],
          available: true,
          currentWorkload: 0,
        },
      });
    });
  });
});

