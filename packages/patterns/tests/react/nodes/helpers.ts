import { AIMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import type { ReActStateType } from '../../../src/react/state.js';

export type MockReasoningResponse = {
  content: string;
  tool_calls?: Array<{
    id?: string;
    name: string;
    args?: Record<string, unknown>;
  }>;
};

export function createMockChatModel(mockResponse?: MockReasoningResponse): BaseChatModel {
  const response = mockResponse || {
    content: 'I need to use a tool',
    tool_calls: [
      {
        id: 'call_123',
        name: 'test-tool',
        args: { input: 'test' },
      },
    ],
  };

  return {
    bindTools: () => createMockChatModel(mockResponse),
    invoke: async () => new AIMessage(response),
  } as unknown as BaseChatModel;
}

export const testTool = toolBuilder()
  .name('test-tool')
  .description('A test tool')
  .category(ToolCategory.UTILITY)
  .schema(z.object({ input: z.string().describe('Input') }))
  .implement(async ({ input }) => `Result: ${input}`)
  .build();

export const bigintTool = toolBuilder()
  .name('bigint-tool')
  .description('A test tool for bigint input')
  .category(ToolCategory.UTILITY)
  .schema(z.object({ input: z.bigint().describe('Input') }))
  .implement(async ({ input }) => `BigInt: ${String(input)}`)
  .build();

export function createBaseState(
  overrides: Partial<ReActStateType> = {}
): ReActStateType {
  const {
    messages,
    thoughts,
    actions,
    observations,
    scratchpad,
    iteration,
    shouldContinue,
    response,
    ...rest
  } = overrides;

  return {
    messages: messages ?? [],
    thoughts: thoughts ?? [],
    actions: actions ?? [],
    observations: observations ?? [],
    scratchpad: scratchpad ?? [],
    iteration: iteration ?? 0,
    shouldContinue: shouldContinue ?? true,
    response: response ?? undefined,
    ...rest,
  };
}
