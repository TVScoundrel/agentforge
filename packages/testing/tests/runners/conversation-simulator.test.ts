import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { describe, expect, it } from 'vitest';
import {
  ConversationSimulator,
  createConversationSimulator,
} from '../../src/runners/conversation-simulator.js';

describe('conversation simulator', () => {
  it('simulates a static conversation and appends only the latest agent message each turn', async () => {
    const simulator = createConversationSimulator({
      invoke: async (input: { messages: Array<HumanMessage | AIMessage> }) => ({
        messages: [...input.messages, new AIMessage(`reply ${input.messages.length}`)],
        score: input.messages.length,
      }),
    });

    const result = await simulator.simulate(['hello', 'world']);

    expect(result.completed).toBe(true);
    expect(result.stopReason).toBe('max_turns');
    expect(result.turns).toBe(2);
    expect(result.messages).toHaveLength(4);
    expect(result.messages[0]).toEqual(new HumanMessage('hello'));
    expect(result.messages[1]).toEqual(new AIMessage('reply 1'));
    expect(result.messages[2]).toEqual(new HumanMessage('world'));
    expect(result.messages[3]).toEqual(new AIMessage('reply 3'));
  });

  it('supports dynamic input generation until the generator stops', async () => {
    const simulator = new ConversationSimulator({
      invoke: async (input: { messages: Array<HumanMessage | AIMessage> }) => ({
        messages: [...input.messages, new AIMessage(`ack ${input.messages.length}`)],
      }),
    });

    const result = await simulator.simulateDynamic((messages) => {
      if (messages.length >= 4) {
        return null;
      }

      return `turn ${messages.length}`;
    });

    expect(result.completed).toBe(true);
    expect(result.stopReason).toBe('stop_condition');
    expect(result.turns).toBe(2);
    expect(result.messages).toHaveLength(4);
  });

  it('stops early when maxTurns is lower than the provided input count', async () => {
    const simulator = createConversationSimulator(
      {
        invoke: async (input: { messages: Array<HumanMessage | AIMessage> }) => ({
          messages: [...input.messages, new AIMessage(`reply ${input.messages.length}`)],
        }),
      },
      { maxTurns: 1 }
    );

    const result = await simulator.simulate(['hello', 'world']);

    expect(result.completed).toBe(true);
    expect(result.stopReason).toBe('max_turns');
    expect(result.turns).toBe(1);
    expect(result.messages).toHaveLength(2);
  });

  it('honors the configured stop condition after appending the latest agent message', async () => {
    const simulator = createConversationSimulator(
      {
        invoke: async (input: { messages: Array<HumanMessage | AIMessage> }) => ({
          messages: [...input.messages, new AIMessage(`reply ${input.messages.length}`)],
        }),
      },
      {
        stopCondition: (messages) =>
          messages[messages.length - 1] instanceof AIMessage,
      }
    );

    const result = await simulator.simulate(['hello', 'world']);

    expect(result.completed).toBe(true);
    expect(result.stopReason).toBe('stop_condition');
    expect(result.turns).toBe(1);
    expect(result.messages).toHaveLength(2);
  });

  it('captures malformed invoke results as errors without throwing', async () => {
    const simulator = createConversationSimulator({
      invoke: async () => ({
        messages: 'not-an-array',
      }),
    });

    const result = await simulator.simulate(['hello']);

    expect(result.completed).toBe(false);
    expect(result.stopReason).toBe('error');
    expect(result.turns).toBe(0);
    expect(result.messages).toEqual([new HumanMessage('hello')]);
    expect(result.error).toBeInstanceOf(Error);
  });
});
