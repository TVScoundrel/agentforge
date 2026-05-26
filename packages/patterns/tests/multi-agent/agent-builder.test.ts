import { toolBuilder, ToolCategory } from '@agentforge/core';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { MultiAgentSystemBuilder } from '../../src/multi-agent/agent.js';
import type { MultiAgentStateType } from '../../src/multi-agent/state.js';

describe('MultiAgentSystemBuilder', () => {
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
