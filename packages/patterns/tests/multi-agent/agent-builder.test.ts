import { toolBuilder, ToolCategory } from '@agentforge/core';
import { StateGraph } from '@langchain/langgraph';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  createMultiAgentSystem,
  MultiAgentSystemBuilder,
  WorkerLifecycleError,
} from '../../src/multi-agent/agent.js';
import type { MultiAgentStateType } from '../../src/multi-agent/state.js';
import type { WorkerConfig } from '../../src/multi-agent/types.js';

describe('MultiAgentSystemBuilder', () => {
  it('keeps registration atomic when a Worker batch fails admission', async () => {
    const builder = new MultiAgentSystemBuilder({
      supervisor: { strategy: 'round-robin' },
      workers: [
        {
          id: 'existing',
          capabilities: {
            skills: ['accepted'],
            tools: [],
            available: true,
            currentWorkload: 0,
          },
        },
      ],
    });

    expect(() =>
      builder.registerWorkers([
        { name: 'partial', capabilities: ['must-not-be-admitted'] },
        { name: 'existing', capabilities: ['duplicate'] },
      ])
    ).toThrowError(
      expect.objectContaining<Partial<WorkerLifecycleError>>({
        reason: 'duplicate-identity',
      })
    );

    builder.registerWorkers([{ name: 'retry', capabilities: ['accepted'] }]);
    const result = (await builder.build().invoke({ input: 'test' })) as MultiAgentStateType;

    expect(Object.keys(result.workers)).toEqual(['existing', 'retry']);
  });

  it('uses factory lifecycle validation when building without Workers', () => {
    const builder = new MultiAgentSystemBuilder({
      supervisor: { strategy: 'round-robin' },
    });

    expect(() => builder.build()).toThrowError(
      expect.objectContaining<Partial<WorkerLifecycleError>>({
        reason: 'empty-topology',
      })
    );
  });

  it('matches factory admission and observable execution behavior', async () => {
    const factorySkills = ['research'];
    const builderSkills = ['research'];
    const tool = { name: ' search ' } as unknown as NonNullable<WorkerConfig['tools']>[number];
    const factory = createMultiAgentSystem({
      supervisor: { strategy: 'round-robin' },
      workers: [
        {
          id: 'researcher',
          capabilities: {
            skills: factorySkills,
            tools: ['stale-declaration'],
            available: true,
            currentWorkload: 0,
          },
          tools: [tool],
        },
      ],
    });
    const builder = new MultiAgentSystemBuilder({
      supervisor: { strategy: 'round-robin' },
    });
    builder.registerWorkers([{ name: 'researcher', capabilities: builderSkills, tools: [tool] }]);

    factorySkills.push('late-factory-skill');
    builderSkills.push('late-builder-skill');

    const factoryResult = (await factory.invoke({ input: 'test' })) as MultiAgentStateType;
    const builderResult = (await builder.build().invoke({ input: 'test' })) as MultiAgentStateType;

    expect(builderResult.workers).toEqual(factoryResult.workers);
    expect(builderResult.workers.researcher.tools).toEqual(['search']);
    expect(builderResult.status).toBe(factoryResult.status);
    expect(builderResult.completedTasks[0]).toMatchObject({
      workerId: factoryResult.completedTasks[0]?.workerId,
      success: factoryResult.completedTasks[0]?.success,
      error: factoryResult.completedTasks[0]?.error,
    });
  });

  it('remains retryable with admitted Workers after compilation fails', () => {
    const failure = new Error('compiler failure');
    const compile = vi.spyOn(StateGraph.prototype, 'compile').mockImplementationOnce(() => {
      throw failure;
    });
    const builder = new MultiAgentSystemBuilder({
      supervisor: { strategy: 'round-robin' },
    }).registerWorkers([{ name: 'worker', capabilities: ['accepted'] }]);

    try {
      expect(() => builder.build()).toThrow(failure);
      expect(builder.build()).toBeDefined();
    } finally {
      compile.mockRestore();
    }
  });

  it('seals registration and building after successful compilation', () => {
    const builder = new MultiAgentSystemBuilder({
      supervisor: { strategy: 'round-robin' },
    }).registerWorkers([{ name: 'worker', capabilities: [] }]);

    builder.build();

    expect(() => builder.registerWorkers([{ name: 'late', capabilities: [] }])).toThrow(
      'Cannot register workers after the system has been compiled'
    );
    expect(() => builder.build()).toThrow('System has already been compiled');
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
    const result = (await system.invoke({
      input: 'test',
    })) as MultiAgentStateType;

    expect(result.workers?.worker1?.tools).toEqual(['builder-tool-1', 'builder-tool-2']);
  });
});
