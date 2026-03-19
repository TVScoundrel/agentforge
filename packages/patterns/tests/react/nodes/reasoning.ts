import { describe, expect, it, vi } from 'vitest';
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { createReasoningNode } from '../../../src/react/nodes.js';
import { createBaseState, createMockChatModel, testTool } from './helpers.js';

describe('ReAct Nodes: reasoning', () => {
  it('generates thoughts and tool calls', async () => {
    const reasoningNode = createReasoningNode(
      createMockChatModel(),
      [testTool],
      'System prompt',
      10,
      false
    );

    const result = await reasoningNode(
      createBaseState({
        messages: [{ role: 'user', content: 'Hello' }],
      })
    );

    expect(result.thoughts).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.actions).toHaveLength(1);
    expect(result.iteration).toBe(1);
  });

  it('sets shouldContinue to false when no tool calls are returned', async () => {
    const reasoningNode = createReasoningNode(
      createMockChatModel({
        content: 'Final answer',
        tool_calls: [],
      }),
      [testTool],
      'System prompt',
      10,
      false
    );

    const result = await reasoningNode(
      createBaseState({
        messages: [{ role: 'user', content: 'Hello' }],
      })
    );

    expect(result.shouldContinue).toBe(false);
    expect(result.response).toBe('Final answer');
  });

  it('respects the max iteration cap', async () => {
    const reasoningNode = createReasoningNode(
      createMockChatModel(),
      [testTool],
      'System prompt',
      5,
      false
    );

    const result = await reasoningNode(
      createBaseState({
        messages: [{ role: 'user', content: 'Hello' }],
        iteration: 4,
      })
    );

    expect(result.shouldContinue).toBe(false);
  });

  it('normalizes tool messages and appends scratchpad context', async () => {
    const invoke = vi.fn().mockResolvedValue(new AIMessage('Final answer'));
    const mockLLM = {
      bindTools: vi.fn().mockReturnThis(),
      invoke,
    } as unknown as BaseChatModel;

    const reasoningNode = createReasoningNode(mockLLM, [testTool], 'System prompt', 10, false);

    await reasoningNode(
      createBaseState({
        messages: [
          { role: 'user', content: 'Hello' },
          {
            role: 'tool',
            content: 'Tool output',
            name: 'test-tool',
            tool_call_id: 'call_123',
          },
        ],
        scratchpad: [
          {
            step: 1,
            thought: 'Need more context',
            action: 'test-tool({"input":"hello"})',
            observation: 'Tool output',
          },
        ],
      })
    );

    expect(invoke).toHaveBeenCalledTimes(1);

    const [messages] = invoke.mock.calls[0] as [unknown[]];
    expect(messages[2]).toBeInstanceOf(ToolMessage);
    expect((messages[2] as ToolMessage).tool_call_id).toBe('call_123');
    expect(messages[3]).toBeInstanceOf(SystemMessage);
    expect(String((messages[3] as SystemMessage).content)).toContain('Previous steps');
  });

  it('falls back to a human message when tool_call_id is missing', async () => {
    const invoke = vi.fn().mockResolvedValue(new AIMessage('Final answer'));
    const mockLLM = {
      bindTools: vi.fn().mockReturnThis(),
      invoke,
    } as unknown as BaseChatModel;

    const reasoningNode = createReasoningNode(mockLLM, [testTool], 'System prompt', 10, false);

    await reasoningNode(
      createBaseState({
        messages: [
          {
            role: 'tool',
            content: 'Detached tool output',
            name: 'test-tool',
          },
        ],
      })
    );

    const [messages] = invoke.mock.calls[0] as [unknown[]];
    expect(messages[1]).toBeInstanceOf(HumanMessage);
    expect(
      (messages[1] as AIMessage | SystemMessage | ToolMessage | { content: string }).content
    ).toBe('Detached tool output');
  });
});
