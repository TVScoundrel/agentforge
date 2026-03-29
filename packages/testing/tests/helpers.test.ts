import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { describe, expect, it } from 'vitest';
import {
  assertHasKeys,
  assertIsMessage,
  assertStateSnapshot,
  assertToolCalled,
  createPlanningState,
  createReActState,
  createStateBuilder,
} from '../src/index.js';

describe('testing helpers', () => {
  it('assertIsMessage narrows system messages', () => {
    const message: unknown = new SystemMessage('System ready');

    assertIsMessage(message, 'system');

    expect(message).toBeInstanceOf(SystemMessage);
  });

  it('assertToolCalled matches typed tool arguments', () => {
    const toolCalls = [
      {
        name: 'search',
        args: { query: 'agentforge docs', limit: 5 },
      },
    ];

    expect(() =>
      assertToolCalled(toolCalls, 'search', { query: 'agentforge docs' }),
    ).not.toThrow();
  });

  it('StateBuilder preserves custom fields while adding messages ergonomically', () => {
    const state = createStateBuilder<{ iteration: number; metadata: { source: string } }>()
      .set('iteration', 2)
      .set('metadata', { source: 'test' })
      .addHumanMessage('hello')
      .addAIMessage('hi')
      .build();

    expect(state.iteration).toBe(2);
    expect(state.metadata).toEqual({ source: 'test' });
    expect(state.messages).toHaveLength(2);
    expect(state.messages?.[0]).toBeInstanceOf(HumanMessage);
    expect(state.messages?.[1]).toBeInstanceOf(AIMessage);
  });

  it('createReActState preserves explicit falsy defaults and typed tool results', () => {
    const state = createReActState<{ query: string }, number>({
      iterations: 0,
      maxIterations: 0,
      toolCalls: [{ name: 'search', args: { query: 'docs' } }],
      toolResults: [{ name: 'search', result: 3 }],
    });

    expect(state.iterations).toBe(0);
    expect(state.maxIterations).toBe(0);
    expect(state.toolCalls[0]?.args).toEqual({ query: 'docs' });
    expect(state.toolResults[0]?.result).toBe(3);
  });

  it('createPlanningState preserves explicit zero currentStep and structured results', () => {
    const state = createPlanningState<{ search: { hits: number } }>({
      currentStep: 0,
      results: {
        search: { hits: 4 },
      },
    });

    expect(state.currentStep).toBe(0);
    assertStateSnapshot(state, {
      currentStep: 0,
      results: {
        search: { hits: 4 },
      },
    });
    assertHasKeys(state, ['messages', 'plan', 'currentStep', 'results']);
  });
});
