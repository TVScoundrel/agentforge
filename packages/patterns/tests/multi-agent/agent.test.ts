/**
 * Tests for Multi-Agent System Factory
 */

import { describe, it, expect } from 'vitest';
import { createMultiAgentSystem, registerWorkers, MultiAgentSystemBuilder } from '../../src/multi-agent/agent.js';
import type { MultiAgentSystemConfig } from '../../src/multi-agent/types.js';
import { MemorySaver } from '@langchain/langgraph';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

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
  });

  describe('registerWorkers', () => {
    it('should create workers registry', () => {
      const config: MultiAgentSystemConfig = {
        supervisor: {
          strategy: 'round-robin',
        },
        workers: [
          {
            id: 'initial',
            capabilities: {
              skills: ['initial'],
              tools: [],
              available: true,
              currentWorkload: 0,
            },
          },
        ],
      };

      const system = createMultiAgentSystem(config);

      const workers = [
        {
          name: 'worker1',
          capabilities: ['skill1'],
          tools: [{ name: 'tool1' }],
        },
        {
          name: 'worker2',
          capabilities: ['skill2'],
          tools: [{ name: 'tool2' }],
        },
      ];

      registerWorkers(system, workers);

      expect(system._workerRegistry).toEqual({
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
          currentWorkload: 0,
        },
      });
    });

    it('should handle empty workers array', () => {
      const config: MultiAgentSystemConfig = {
        supervisor: {
          strategy: 'round-robin',
        },
        workers: [
          {
            id: 'initial',
            capabilities: {
              skills: ['initial'],
              tools: [],
              available: true,
              currentWorkload: 0,
            },
          },
        ],
      };

      const system = createMultiAgentSystem(config);
      registerWorkers(system, []);

      expect(system._workerRegistry).toEqual({});
    });

    it('should handle single worker', () => {
      const config: MultiAgentSystemConfig = {
        supervisor: {
          strategy: 'round-robin',
        },
        workers: [
          {
            id: 'initial',
            capabilities: {
              skills: ['initial'],
              tools: [],
              available: true,
              currentWorkload: 0,
            },
          },
        ],
      };

      const system = createMultiAgentSystem(config);

      const workers = [
        {
          name: 'solo',
          capabilities: ['everything'],
          tools: [{ name: 'all' }],
        },
      ];

      registerWorkers(system, workers);

      expect(system._workerRegistry).toEqual({
        solo: {
          skills: ['everything'],
          tools: ['all'],
          available: true,
          currentWorkload: 0,
        },
      });
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
        // No checkpointer - should still work
      };

      const system = createMultiAgentSystem(config);
      expect(system).toBeDefined();
      expect(typeof system.invoke).toBe('function');
    });
  });

  describe('Tool Name Extraction', () => {
    it('should correctly extract tool names from AgentForge Tools in registerWorkers', () => {
      // Create AgentForge Tools with metadata.name
      const agentforgeTool1 = toolBuilder()
        .name('agentforge-tool-1')
        .description('First AgentForge tool')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      const agentforgeTool2 = toolBuilder()
        .name('agentforge-tool-2')
        .description('Second AgentForge tool')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      const config: MultiAgentSystemConfig = {
        supervisor: {
          strategy: 'round-robin',
        },
        workers: [
          {
            id: 'initial',
            capabilities: {
              skills: ['initial'],
              tools: [],
              available: true,
              currentWorkload: 0,
            },
          },
        ],
      };

      const system = createMultiAgentSystem(config);

      const workers = [
        {
          name: 'worker1',
          capabilities: ['skill1'],
          tools: [agentforgeTool1, agentforgeTool2],
        },
      ];

      registerWorkers(system, workers);

      expect(system._workerRegistry).toEqual({
        worker1: {
          skills: ['skill1'],
          tools: ['agentforge-tool-1', 'agentforge-tool-2'],
          available: true,
          currentWorkload: 0,
        },
      });
    });

    it('should correctly extract tool names from LangChain tools in registerWorkers', () => {
      // Create LangChain-style tools with name property
      const langchainTool1 = { name: 'langchain-tool-1' };
      const langchainTool2 = { name: 'langchain-tool-2' };

      const config: MultiAgentSystemConfig = {
        supervisor: {
          strategy: 'round-robin',
        },
        workers: [
          {
            id: 'initial',
            capabilities: {
              skills: ['initial'],
              tools: [],
              available: true,
              currentWorkload: 0,
            },
          },
        ],
      };

      const system = createMultiAgentSystem(config);

      const workers = [
        {
          name: 'worker1',
          capabilities: ['skill1'],
          tools: [langchainTool1, langchainTool2],
        },
      ];

      registerWorkers(system, workers);

      expect(system._workerRegistry).toEqual({
        worker1: {
          skills: ['skill1'],
          tools: ['langchain-tool-1', 'langchain-tool-2'],
          available: true,
          currentWorkload: 0,
        },
      });
    });

    it('should handle mixed AgentForge and LangChain tools in registerWorkers', () => {
      const agentforgeTool = toolBuilder()
        .name('agentforge-tool')
        .description('AgentForge tool')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      const langchainTool = { name: 'langchain-tool' };

      const config: MultiAgentSystemConfig = {
        supervisor: {
          strategy: 'round-robin',
        },
        workers: [
          {
            id: 'initial',
            capabilities: {
              skills: ['initial'],
              tools: [],
              available: true,
              currentWorkload: 0,
            },
          },
        ],
      };

      const system = createMultiAgentSystem(config);

      const workers = [
        {
          name: 'worker1',
          capabilities: ['skill1'],
          tools: [agentforgeTool, langchainTool],
        },
      ];

      registerWorkers(system, workers);

      expect(system._workerRegistry).toEqual({
        worker1: {
          skills: ['skill1'],
          tools: ['agentforge-tool', 'langchain-tool'],
          available: true,
          currentWorkload: 0,
        },
      });
    });

    it('should correctly extract tool names from AgentForge Tools in MultiAgentSystemBuilder', async () => {
      const agentforgeTool1 = toolBuilder()
        .name('builder-tool-1')
        .description('First builder tool')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      const agentforgeTool2 = toolBuilder()
        .name('builder-tool-2')
        .description('Second builder tool')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      const builder = new MultiAgentSystemBuilder({
        supervisor: {
          strategy: 'round-robin',
        },
      });

      builder.registerWorkers([
        {
          name: 'worker1',
          capabilities: ['skill1'],
          tools: [agentforgeTool1, agentforgeTool2],
        },
      ]);

      const system = builder.build();
      expect(system).toBeDefined();

      // Invoke the system to get the initial state with workers
      const result = await system.invoke({
        input: 'test',
      });

      // Verify the worker was registered with correct tool names
      expect(result.workers).toBeDefined();
      expect(result.workers['worker1']).toBeDefined();
      expect(result.workers['worker1'].tools).toEqual(['builder-tool-1', 'builder-tool-2']);
    });

    it('should handle tools without name or metadata gracefully', () => {
      const invalidTool = {}; // No name or metadata

      const config: MultiAgentSystemConfig = {
        supervisor: {
          strategy: 'round-robin',
        },
        workers: [
          {
            id: 'initial',
            capabilities: {
              skills: ['initial'],
              tools: [],
              available: true,
              currentWorkload: 0,
            },
          },
        ],
      };

      const system = createMultiAgentSystem(config);

      const workers = [
        {
          name: 'worker1',
          capabilities: ['skill1'],
          tools: [invalidTool],
        },
      ];

      registerWorkers(system, workers);

      expect(system._workerRegistry).toEqual({
        worker1: {
          skills: ['skill1'],
          tools: ['unknown'], // Should fallback to 'unknown'
          available: true,
          currentWorkload: 0,
        },
      });
    });

    it('should wrap stream() method when workers are registered', async () => {
      const config: MultiAgentSystemConfig = {
        supervisor: {
          strategy: 'round-robin',
        },
        workers: [
          {
            id: 'initial',
            capabilities: {
              skills: ['initial'],
              tools: [],
              available: true,
              currentWorkload: 0,
            },
          },
        ],
      };

      const system = createMultiAgentSystem(config);

      const workers = [
        {
          name: 'worker1',
          capabilities: ['skill1'],
          tools: [],
        },
      ];

      registerWorkers(system, workers);

      // Verify that stream method was wrapped
      const systemWithRegistry = system as any;
      expect(systemWithRegistry._originalStream).toBeDefined();
      expect(typeof systemWithRegistry._originalStream).toBe('function');

      // Verify the worker registry was created with correct data
      expect(systemWithRegistry._workerRegistry).toBeDefined();
      expect(systemWithRegistry._workerRegistry['worker1']).toBeDefined();
      expect(systemWithRegistry._workerRegistry['worker1'].skills).toEqual(['skill1']);

      // Spy on the original stream method to verify it receives merged workers
      const originalStreamSpy = vi.fn(systemWithRegistry._originalStream);
      systemWithRegistry._originalStream = originalStreamSpy;

      // Call stream() - the wrapper should merge workers into the input
      await system.stream({
        input: 'test',
      });

      // Verify the original stream was called with merged workers
      expect(originalStreamSpy).toHaveBeenCalledTimes(1);
      const callArgs = originalStreamSpy.mock.calls[0][0] as any;
      expect(callArgs.workers).toBeDefined();
      expect(callArgs.workers['worker1']).toBeDefined();
      expect(callArgs.workers['worker1'].skills).toEqual(['skill1']);
    });

    it('should inject registered workers with AgentForge Tools when using stream() method', async () => {
      const agentforgeTool = toolBuilder()
        .name('stream-tool')
        .description('Tool for streaming test')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }: { input: string }) => input)
        .build();

      const config: MultiAgentSystemConfig = {
        supervisor: {
          strategy: 'round-robin',
        },
        workers: [
          {
            id: 'initial',
            capabilities: {
              skills: ['initial'],
              tools: [],
              available: true,
              currentWorkload: 0,
            },
          },
        ],
      };

      const system = createMultiAgentSystem(config);

      const workers = [
        {
          name: 'worker1',
          capabilities: ['skill1'],
          tools: [agentforgeTool],
        },
      ];

      registerWorkers(system, workers);

      // Verify that stream method was wrapped and worker registry contains correct tool names
      const systemWithRegistry = system as any;
      expect(systemWithRegistry._originalStream).toBeDefined();
      expect(systemWithRegistry._workerRegistry['worker1']).toBeDefined();
      expect(systemWithRegistry._workerRegistry['worker1'].tools).toEqual(['stream-tool']);

      // Spy on the original stream method to verify it receives merged workers with correct tool names
      const originalStreamSpy = vi.fn(systemWithRegistry._originalStream);
      systemWithRegistry._originalStream = originalStreamSpy;

      // Call stream() - the wrapper should merge workers (with correct tool names) into the input
      await system.stream({
        input: 'test',
      });

      // Verify the original stream was called with merged workers that have correct tool names
      expect(originalStreamSpy).toHaveBeenCalledTimes(1);
      const callArgs = originalStreamSpy.mock.calls[0][0] as any;
      expect(callArgs.workers).toBeDefined();
      expect(callArgs.workers['worker1']).toBeDefined();
      expect(callArgs.workers['worker1'].tools).toEqual(['stream-tool']);
    });
  });
});

