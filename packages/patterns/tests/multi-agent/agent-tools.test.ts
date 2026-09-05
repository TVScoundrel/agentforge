import { toolBuilder, ToolCategory } from '@agentforge/core';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  createMultiAgentSystem,
  registerWorkers,
  WorkerLifecycleError,
} from '../../src/multi-agent/agent.js';
import type { MultiAgentStateType } from '../../src/multi-agent/state.js';
import type { WorkerConfig } from '../../src/multi-agent/types.js';

function createSystem(tools: WorkerConfig['tools'] = []) {
  return createMultiAgentSystem({
    supervisor: { strategy: 'round-robin' },
    workers: [
      {
        id: 'worker1',
        capabilities: {
          skills: ['initial'],
          tools: [],
          available: true,
          currentWorkload: 0,
        },
        tools,
      },
    ],
    maxIterations: 0,
  });
}

async function registeredWorker(tools: WorkerConfig['tools'], assertedTools = tools) {
  const system = createSystem(tools);
  registerWorkers(system, [
    {
      name: 'worker1',
      capabilities: ['updated'],
      tools: assertedTools,
    },
  ]);

  const result = (await system.invoke({ input: 'test' })) as MultiAgentStateType;
  return result.workers.worker1;
}

describe('Multi-Agent legacy tool assertions', () => {
  it('accepts matching AgentForge tool names', async () => {
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

    expect(await registeredWorker([agentforgeTool1, agentforgeTool2])).toMatchObject({
      skills: ['updated'],
      tools: ['agentforge-tool-1', 'agentforge-tool-2'],
    });
  });

  it('treats compiled tool names as an unordered set', async () => {
    const compiledTools = [{ name: 'first' }, { name: 'second' }] as WorkerConfig['tools'];
    const assertedTools = [{ name: ' second ' }, { name: 'first' }] as WorkerConfig['tools'];

    expect(await registeredWorker(compiledTools, assertedTools)).toMatchObject({
      skills: ['updated'],
      tools: ['first', 'second'],
    });
  });

  it('rejects a tool set that differs from compiled executable tools', () => {
    const system = createSystem([{ name: 'search' }] as WorkerConfig['tools']);

    expect(() =>
      registerWorkers(system, [
        { name: 'worker1', capabilities: ['updated'], tools: [{ name: 'write' }] },
      ])
    ).toThrowError(
      expect.objectContaining<Partial<WorkerLifecycleError>>({ reason: 'invalid-tool' })
    );
  });

  it('rejects tools without a name through lifecycle validation', () => {
    const system = createSystem();

    expect(() =>
      registerWorkers(system, [
        {
          name: 'worker1',
          capabilities: ['updated'],
          tools: [{}],
        },
      ])
    ).toThrowError(
      expect.objectContaining<Partial<WorkerLifecycleError>>({ reason: 'invalid-tool' })
    );
  });

  it('rejects duplicate normalized tool names through lifecycle validation', () => {
    const system = createSystem([{ name: 'search' }] as WorkerConfig['tools']);

    expect(() =>
      registerWorkers(system, [
        {
          name: 'worker1',
          capabilities: ['updated'],
          tools: [{ name: 'search' }, { name: ' search ' }],
        },
      ])
    ).toThrowError(
      expect.objectContaining<Partial<WorkerLifecycleError>>({ reason: 'invalid-tool' })
    );
  });

  it('preserves the observable Worker snapshot after a failed tool assertion', async () => {
    const system = createMultiAgentSystem({
      supervisor: { strategy: 'round-robin' },
      workers: [
        {
          id: 'worker1',
          capabilities: {
            skills: ['initial'],
            tools: [],
            available: false,
            currentWorkload: 3,
          },
          tools: [{ name: 'search' }],
        },
      ],
      maxIterations: 0,
    });

    expect(() =>
      registerWorkers(system, [
        {
          name: 'worker1',
          capabilities: ['must-not-publish'],
          tools: [{ name: 'write' }],
        },
      ])
    ).toThrowError(
      expect.objectContaining<Partial<WorkerLifecycleError>>({ reason: 'invalid-tool' })
    );

    const result = (await system.invoke({ input: 'test' })) as MultiAgentStateType;
    expect(result.workers.worker1).toEqual({
      skills: ['initial'],
      tools: ['search'],
      available: false,
      currentWorkload: 3,
    });
  });
});
