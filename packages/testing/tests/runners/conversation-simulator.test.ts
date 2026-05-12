import { createLogger } from '@agentforge/core';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { Writable } from 'stream';
import { describe, expect, it, vi } from 'vitest';
import {
  ConversationSimulator,
  createConversationSimulator,
} from '../../src/runners/conversation-simulator.js';

class CaptureStream extends Writable {
  public output: string[] = [];

  _write(
    chunk: string | Uint8Array,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): void {
    this.output.push(chunk.toString());
    callback();
  }
}

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

  it('routes verbose turn output through the structured logger instead of console.log', async () => {
    const stream = new CaptureStream();
    const logger = createLogger('test-conversation-simulator', {
      destination: stream,
      includeTimestamp: false,
    });
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const simulator = createConversationSimulator(
        {
          invoke: async (input: { messages: Array<HumanMessage | AIMessage> }) => ({
            messages: [...input.messages, new AIMessage(`reply ${input.messages.length}`)],
          }),
        },
        {
          verbose: true,
          logger,
        }
      );

      await simulator.simulate(['hello']);
    } finally {
      consoleSpy.mockRestore();
    }

    expect(stream.output).toHaveLength(2);
    expect(stream.output[0]).toContain('User: hello');
    expect(stream.output[1]).toContain('AI: reply 1');
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('does not emit verbose logs when verbose mode is disabled', async () => {
    const stream = new CaptureStream();
    const logger = createLogger('test-conversation-simulator', {
      destination: stream,
      includeTimestamp: false,
    });
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const simulator = createConversationSimulator(
        {
          invoke: async (input: { messages: Array<HumanMessage | AIMessage> }) => ({
            messages: [...input.messages, new AIMessage(`reply ${input.messages.length}`)],
          }),
        },
        { logger }
      );

      await simulator.simulate(['hello']);
    } finally {
      consoleSpy.mockRestore();
    }

    expect(stream.output).toEqual([]);
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
