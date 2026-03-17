import { describe, expect, it } from 'vitest';
import { END } from '@langchain/langgraph';
import { createStateAnnotation, type StateChannelConfig } from '@agentforge/core';
import { z } from 'zod';
import { buildAgent } from '../../src/shared/agent-builder.js';

const TestAgentState = createStateAnnotation({
  routeTo: {
    schema: z.enum(['continue', 'end']),
    default: () => 'continue',
    description: 'Desired route for the workflow',
  } satisfies StateChannelConfig<'continue' | 'end'>,
  history: {
    schema: z.array(z.string()),
    reducer: (left: string[], right: string[]) => [...left, ...right],
    default: () => [],
    description: 'Workflow execution history',
  } satisfies StateChannelConfig<string[], string[]>,
  count: {
    schema: z.number().int().nonnegative(),
    default: () => 0,
    description: 'Counter incremented by the workflow',
  } satisfies StateChannelConfig<number>,
  done: {
    schema: z.boolean(),
    default: () => false,
    description: 'Completion flag',
  } satisfies StateChannelConfig<boolean>,
});

type TestAgentStateType = typeof TestAgentState.State;

describe('buildAgent', () => {
  it('should follow mapped conditional routes through the configured nodes', async () => {
    const agent = buildAgent({
      state: TestAgentState,
      nodes: [
        {
          name: 'decide',
          fn: (state: TestAgentStateType) => ({
            history: [`decide:${state.routeTo}`],
          }),
        },
        {
          name: 'step',
          fn: () => ({
            history: ['step'],
            count: 1,
          }),
        },
        {
          name: 'finish',
          fn: () => ({
            history: ['finish'],
            done: true,
          }),
        },
      ],
      entryPoint: 'decide',
      edges: [{ from: 'step', to: 'finish' }],
      conditionalEdges: [
        {
          from: 'decide',
          condition: (state: TestAgentStateType) => state.routeTo,
          mapping: {
            continue: 'step',
            end: END,
          },
        },
      ],
    });

    const result = await agent.invoke({
      routeTo: 'continue',
      history: [],
      count: 0,
      done: false,
    });

    expect(result.history).toEqual(['decide:continue', 'step', 'finish']);
    expect(result.count).toBe(1);
    expect(result.done).toBe(true);
  });

  it('should allow conditional routes to end the workflow directly', async () => {
    const agent = buildAgent({
      state: TestAgentState,
      nodes: [
        {
          name: 'decide',
          fn: (state: TestAgentStateType) => ({
            history: [`decide:${state.routeTo}`],
          }),
        },
        {
          name: 'finish',
          fn: () => ({
            history: ['finish'],
            done: true,
          }),
        },
      ],
      entryPoint: 'decide',
      conditionalEdges: [
        {
          from: 'decide',
          condition: (state: TestAgentStateType) => state.routeTo,
          mapping: {
            continue: 'finish',
            end: END,
          },
        },
      ],
    });

    const result = await agent.invoke({
      routeTo: 'end',
      history: [],
      count: 0,
      done: false,
    });

    expect(result.history).toEqual(['decide:end']);
    expect(result.count).toBe(0);
    expect(result.done).toBe(false);
  });
});
