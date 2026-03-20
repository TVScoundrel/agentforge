import { describe, expect, it } from 'vitest';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import { createActionNode } from '../../../src/react/nodes.js';
import { bigintTool, createBaseState, testTool } from './helpers.js';

describe('ReAct Nodes: action', () => {
  it('executes tool calls successfully', async () => {
    const actionNode = createActionNode([testTool], false);

    const result = await actionNode(
      createBaseState({
        actions: [
          {
            id: 'call_123',
            name: 'test-tool',
            arguments: { input: 'hello' },
            timestamp: Date.now(),
          },
        ],
        iteration: 1,
      })
    );

    expect(result.observations).toHaveLength(1);
    expect(result.observations?.[0].result).toBe('Result: hello');
    expect(result.observations?.[0].error).toBeUndefined();
  });

  it('handles tool not found errors', async () => {
    const actionNode = createActionNode([testTool], false);

    const result = await actionNode(
      createBaseState({
        actions: [
          {
            id: 'call_456',
            name: 'non-existent-tool',
            arguments: {},
            timestamp: Date.now(),
          },
        ],
        iteration: 1,
      })
    );

    expect(result.observations).toHaveLength(1);
    expect(result.observations?.[0].error).toContain('not found');
  });

  it('handles tool execution errors', async () => {
    const errorTool = toolBuilder()
      .name('error-tool')
      .description('A tool that throws errors')
      .category(ToolCategory.UTILITY)
      .schema(z.object({ input: z.string().describe('Input') }))
      .implement(async () => {
        throw new Error('Tool execution failed');
      })
      .build();

    const actionNode = createActionNode([errorTool], false);

    const result = await actionNode(
      createBaseState({
        actions: [
          {
            id: 'call_789',
            name: 'error-tool',
            arguments: { input: 'test' },
            timestamp: Date.now(),
          },
        ],
        iteration: 1,
      })
    );

    expect(result.observations).toHaveLength(1);
    expect(result.observations?.[0].error).toBe('Tool execution failed');
  });

  it('executes actions when dedup cache key serialization fails', async () => {
    const actionNode = createActionNode([bigintTool], false, true);

    const result = await actionNode(
      createBaseState({
        actions: [
          {
            id: 'call_bigint_action',
            name: 'bigint-tool',
            arguments: { input: 1n },
            timestamp: Date.now(),
          },
        ],
        iteration: 1,
      })
    );

    expect(result.observations).toHaveLength(1);
    expect(result.observations?.[0].result).toBe('BigInt: 1');
    expect(result.observations?.[0].isDuplicate).toBeUndefined();
  });
});
