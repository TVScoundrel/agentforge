import { toolBuilder, ToolCategory } from '@agentforge/core';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createMultiAgentSystem, registerWorkers } from '../../src/multi-agent/agent.js';
import type { MultiAgentStateType } from '../../src/multi-agent/state.js';
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

  it('should handle tools without name or metadata gracefully', () => {
    const system = createMultiAgentSystem(createBaseConfig());

    registerWorkers(system, [
      {
        name: 'worker1',
        capabilities: ['skill1'],
        tools: [{}],
      },
    ]);

    expect(system._workerRegistry).toEqual({
      worker1: {
        skills: ['skill1'],
        tools: ['unknown'],
        available: true,
        currentWorkload: 0,
      },
    });
  });

  it('should wrap stream() method when workers are registered', async () => {
    const system = createMultiAgentSystem(createBaseConfig());

    registerWorkers(system, [
      {
        name: 'worker1',
        capabilities: ['skill1'],
        tools: [],
      },
    ]);

    const systemWithRegistry = system;
    expect(systemWithRegistry._originalStream).toBeDefined();
    expect(typeof systemWithRegistry._originalStream).toBe('function');
    expect(systemWithRegistry._workerRegistry?.worker1?.skills).toEqual(['skill1']);

    const originalStreamSpy = vi.fn(systemWithRegistry._originalStream);
    systemWithRegistry._originalStream = originalStreamSpy;

    await system.stream({
      input: 'test',
    });

    expect(originalStreamSpy).toHaveBeenCalledTimes(1);
    const [callArgs] = originalStreamSpy.mock.calls[0] as [Partial<MultiAgentStateType>];
    expect(callArgs.workers?.worker1?.skills).toEqual(['skill1']);
  });

  it('should inject registered workers with AgentForge Tools when using stream() method', async () => {
    const agentforgeTool = toolBuilder()
      .name('stream-tool')
      .description('Tool for streaming test')
      .category(ToolCategory.UTILITY)
      .schema(z.object({ input: z.string().describe('Input') }))
      .implement(async ({ input }: { input: string }) => input)
      .build();

    const system = createMultiAgentSystem(createBaseConfig());

    registerWorkers(system, [
      {
        name: 'worker1',
        capabilities: ['skill1'],
        tools: [agentforgeTool],
      },
    ]);

    const systemWithRegistry = system;
    expect(systemWithRegistry._originalStream).toBeDefined();
    expect(systemWithRegistry._workerRegistry?.worker1?.tools).toEqual(['stream-tool']);

    const originalStreamSpy = vi.fn(systemWithRegistry._originalStream);
    systemWithRegistry._originalStream = originalStreamSpy;

    await system.stream({
      input: 'test',
    });

    expect(originalStreamSpy).toHaveBeenCalledTimes(1);
    const [callArgs] = originalStreamSpy.mock.calls[0] as [Partial<MultiAgentStateType>];
    expect(callArgs.workers?.worker1?.tools).toEqual(['stream-tool']);
  });
});
