import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { describe, expect, it } from 'vitest';
import { AgentTestRunner, createAgentTestRunner } from '../../src/runners/agent-test-runner.js';

describe('agent test runner', () => {
  it('runs an agent and returns final state, messages, and execution metadata', async () => {
    const messages = [new HumanMessage('hello'), new AIMessage('hi')];
    const agent = {
      invoke: async (input: { messages: HumanMessage[] }) => ({
        messages: [...input.messages, messages[1]],
        score: 1,
      }),
    };
    const runner = createAgentTestRunner(agent, { captureSteps: true });

    const result = await runner.run({ messages: [messages[0]] });

    expect(result.passed).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.finalState).toEqual({ messages, score: 1 });
    expect(result.messages).toEqual(messages);
    expect(result.steps).toEqual([]);
    expect(result.executionTime).toBeGreaterThanOrEqual(0);
  });

  it('reports timeout failures without throwing', async () => {
    const runner = new AgentTestRunner(
      {
        invoke: () => new Promise(() => undefined),
      },
      { timeout: 1 }
    );

    const result = await runner.run({ messages: [] });

    expect(result.passed).toBe(false);
    expect(result.finalState).toBeUndefined();
    expect(result.messages).toEqual([]);
    expect(result.error?.message).toBe('Agent test timeout');
  });

  it('runs configured validation against the final state', async () => {
    const runner = createAgentTestRunner(
      {
        invoke: async () => ({ messages: [], valid: false }),
      },
      {
        validateState: true,
        stateValidator: (state) => state?.valid === true,
      }
    );

    const result = await runner.run({ messages: [] });

    expect(result.passed).toBe(false);
    expect(result.finalState).toEqual({ messages: [], valid: false });
    expect(result.error?.message).toBe('State validation failed');
  });

  it('runs multiple inputs independently', async () => {
    const runner = createAgentTestRunner({
      invoke: async (input: { value: number }) => ({
        messages: [new AIMessage(String(input.value * 2))],
        value: input.value * 2,
      }),
    });

    const results = await runner.runMany([{ value: 1 }, { value: 2 }]);

    expect(results).toHaveLength(2);
    expect(results.map((result) => result.passed)).toEqual([true, true]);
    expect(results.map((result) => result.finalState?.value)).toEqual([2, 4]);
    expect(results.map((result) => result.messages[0]?.content)).toEqual(['2', '4']);
  });
});
