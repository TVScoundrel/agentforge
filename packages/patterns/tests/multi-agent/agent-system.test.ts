import { MemorySaver } from '@langchain/langgraph';
import { describe, expect, it } from 'vitest';
import { createMultiAgentSystem } from '../../src/multi-agent/agent.js';
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

    it('should allow empty workers array (workers can be registered later)', () => {
      const config: MultiAgentSystemConfig = {
        supervisor: {
          strategy: 'round-robin',
        },
        workers: [],
      };

      const system = createMultiAgentSystem(config);
      expect(system).toBeDefined();
      expect(typeof system.invoke).toBe('function');
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

    it('should accept optional checkpointer parameter', () => {
      const checkpointer = new MemorySaver();
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
        ],
        checkpointer,
      };

      const system = createMultiAgentSystem(config);
      expect(system).toBeDefined();
      expect(typeof system.invoke).toBe('function');
    });

    it('should work without checkpointer (backward compatibility)', () => {
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
        ],
      };

      const system = createMultiAgentSystem(config);
      expect(system).toBeDefined();
      expect(typeof system.invoke).toBe('function');
    });
  });
});
