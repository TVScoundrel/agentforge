import { toolBuilder, ToolCategory } from '@agentforge/core';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  createMultiAgentSystem,
  registerWorkers,
  WorkerLifecycleError,
} from '../../src/multi-agent/agent.js';
import type { MultiAgentSystemConfig } from '../../src/multi-agent/types.js';

function createBaseConfig(): MultiAgentSystemConfig {
  return {
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
}

describe('Multi-Agent tool mapping and stream registration', () => {
  it('should correctly extract tool names from AgentForge Tools in registerWorkers', () => {
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

    const system = createMultiAgentSystem(createBaseConfig());

    registerWorkers(system, [
      {
        name: 'worker1',
        capabilities: ['skill1'],
        tools: [agentforgeTool1, agentforgeTool2],
      },
    ]);

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
    const system = createMultiAgentSystem(createBaseConfig());

    registerWorkers(system, [
      {
        name: 'worker1',
        capabilities: ['skill1'],
        tools: [{ name: 'langchain-tool-1' }, { name: 'langchain-tool-2' }],
      },
    ]);

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

    const system = createMultiAgentSystem(createBaseConfig());

    registerWorkers(system, [
      {
        name: 'worker1',
        capabilities: ['skill1'],
        tools: [agentforgeTool, { name: 'langchain-tool' }],
      },
    ]);

    expect(system._workerRegistry).toEqual({
      worker1: {
        skills: ['skill1'],
        tools: ['agentforge-tool', 'langchain-tool'],
        available: true,
        currentWorkload: 0,
      },
    });
  });

  it('rejects tools without a name through lifecycle validation', () => {
    const system = createMultiAgentSystem(createBaseConfig());

    expect(() =>
      registerWorkers(system, [
        {
          name: 'worker1',
          capabilities: ['skill1'],
          tools: [{}],
        },
      ])
    ).toThrowError(
      expect.objectContaining<Partial<WorkerLifecycleError>>({ reason: 'invalid-tool' })
    );
  });

  it('rejects duplicate normalized tool names through lifecycle validation', () => {
    const system = createMultiAgentSystem(createBaseConfig());

    expect(() =>
      registerWorkers(system, [
        {
          name: 'worker1',
          capabilities: ['skill1'],
          tools: [{ name: 'search' }, { name: ' search ' }],
        },
      ])
    ).toThrowError(
      expect.objectContaining<Partial<WorkerLifecycleError>>({ reason: 'invalid-tool' })
    );
  });
});
