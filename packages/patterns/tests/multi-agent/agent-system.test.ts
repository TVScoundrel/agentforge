import { MemorySaver, StateGraph } from '@langchain/langgraph';
import { describe, expect, it, vi } from 'vitest';
import { createMultiAgentSystem, WorkerLifecycleError } from '../../src/multi-agent/agent.js';
import type { MultiAgentStateType } from '../../src/multi-agent/state.js';
import type { MultiAgentSystemConfig } from '../../src/multi-agent/types.js';
import type { WorkerConfig } from '../../src/multi-agent/types.js';

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

    it('rejects an empty Worker topology before compilation', () => {
      const config: MultiAgentSystemConfig = {
        supervisor: {
          strategy: 'round-robin',
        },
        workers: [],
      };

      expect(() => createMultiAgentSystem(config)).toThrowError(
        expect.objectContaining<Partial<WorkerLifecycleError>>({
          reason: 'empty-topology',
        })
      );
    });

    it('delegates Worker validation to lifecycle admission', () => {
      const config: MultiAgentSystemConfig = {
        supervisor: { strategy: 'round-robin' },
        workers: [
          {
            id: 'worker,other',
            capabilities: {
              skills: [],
              tools: [],
              available: true,
              currentWorkload: 0,
            },
          },
        ],
      };

      expect(() => createMultiAgentSystem(config)).toThrowError(
        expect.objectContaining<Partial<WorkerLifecycleError>>({
          reason: 'invalid-identity',
        })
      );
    });

    it('executes with the canonical Worker snapshot after caller configuration changes', async () => {
      const skills = ['research'];
      const tool = { name: ' search ' } as unknown as NonNullable<WorkerConfig['tools']>[number];
      const config: MultiAgentSystemConfig = {
        supervisor: { strategy: 'round-robin' },
        workers: [
          {
            id: 'researcher',
            capabilities: {
              skills,
              tools: ['stale-declaration'],
              available: true,
              currentWorkload: 0,
            },
            tools: [tool],
          },
        ],
      };
      const system = createMultiAgentSystem(config);

      skills.push('late-skill');
      config.workers[0]!.capabilities.available = false;
      config.workers[0]!.tools!.push({ name: 'late-tool' } as unknown as NonNullable<
        WorkerConfig['tools']
      >[number]);

      const result = (await system.invoke({ input: 'test' })) as MultiAgentStateType;

      expect(result.workers.researcher).toMatchObject({
        skills: ['research'],
        tools: ['search'],
        available: true,
      });
    });

    it('preserves LangGraph compilation failure identity and cause', () => {
      const cause = new Error('compiler cause');
      const failure = new Error('compiler failure', { cause });
      const compile = vi.spyOn(StateGraph.prototype, 'compile').mockImplementationOnce(() => {
        throw failure;
      });
      const config: MultiAgentSystemConfig = {
        supervisor: { strategy: 'round-robin' },
        workers: [
          {
            id: 'worker',
            capabilities: {
              skills: [],
              tools: [],
              available: true,
              currentWorkload: 0,
            },
          },
        ],
      };

      let thrown: unknown;
      try {
        createMultiAgentSystem(config);
      } catch (error) {
        thrown = error;
      } finally {
        compile.mockRestore();
      }

      expect(thrown).toBe(failure);
      expect((thrown as Error).cause).toBe(cause);
    });

    it('preserves LangGraph execution failure identity and cause', async () => {
      const cause = new Error('checkpoint cause');
      const failure = new Error('checkpoint failure', { cause });
      const checkpointer = new MemorySaver();
      vi.spyOn(checkpointer, 'getTuple').mockRejectedValueOnce(failure);
      const system = createMultiAgentSystem({
        supervisor: { strategy: 'round-robin' },
        workers: [
          {
            id: 'worker',
            capabilities: {
              skills: [],
              tools: [],
              available: true,
              currentWorkload: 0,
            },
          },
        ],
        checkpointer,
      });

      await expect(
        system.invoke({ input: 'test' }, { configurable: { thread_id: 'failure-test' } })
      ).rejects.toBe(failure);
      expect(failure.cause).toBe(cause);
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
