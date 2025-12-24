/**
 * ReAct pattern state definition
 *
 * Defines the state structure for the ReAct (Reasoning and Action) pattern using
 * LangGraph's Annotation.Root() via our createStateAnnotation wrapper.
 *
 * @module langgraph/patterns/react/state
 */

import { z } from 'zod';
import { createStateAnnotation, type StateChannelConfig } from '../../state.js';
import {
  MessageSchema,
  ThoughtSchema,
  ToolCallSchema,
  ToolResultSchema,
  ScratchpadEntrySchema,
  type Message,
  type Thought,
  type ToolCall,
  type ToolResult,
  type ScratchpadEntry,
} from './schemas.js';

/**
 * ReAct state configuration
 *
 * This configuration is used with createStateAnnotation() to create a
 * LangGraph Annotation.Root() with optional Zod validation.
 */
export const ReActStateConfig = {
  /**
   * Conversation messages
   * Accumulates all messages in the conversation
   */
  messages: {
    schema: z.array(MessageSchema),
    reducer: (left: Message[], right: Message[]) => [...left, ...right],
    default: () => [],
    description: 'Conversation message history',
  } satisfies StateChannelConfig<Message[], Message[]>,

  /**
   * Reasoning thoughts
   * Accumulates all reasoning steps the agent takes
   */
  thoughts: {
    schema: z.array(ThoughtSchema),
    reducer: (left: Thought[], right: Thought[]) => [...left, ...right],
    default: () => [],
    description: 'Agent reasoning steps',
  } satisfies StateChannelConfig<Thought[], Thought[]>,

  /**
   * Tool calls (actions)
   * Accumulates all tool calls made by the agent
   */
  actions: {
    schema: z.array(ToolCallSchema),
    reducer: (left: ToolCall[], right: ToolCall[]) => [...left, ...right],
    default: () => [],
    description: 'Tool calls made by the agent',
  } satisfies StateChannelConfig<ToolCall[], ToolCall[]>,

  /**
   * Tool results (observations)
   * Accumulates all observations from tool executions
   */
  observations: {
    schema: z.array(ToolResultSchema),
    reducer: (left: ToolResult[], right: ToolResult[]) => [...left, ...right],
    default: () => [],
    description: 'Results from tool executions',
  } satisfies StateChannelConfig<ToolResult[], ToolResult[]>,

  /**
   * Scratchpad for intermediate reasoning
   * Accumulates step-by-step reasoning process
   */
  scratchpad: {
    schema: z.array(ScratchpadEntrySchema),
    reducer: (left: ScratchpadEntry[], right: ScratchpadEntry[]) => [...left, ...right],
    default: () => [],
    description: 'Intermediate reasoning scratchpad',
  } satisfies StateChannelConfig<ScratchpadEntry[], ScratchpadEntry[]>,

  /**
   * Current iteration count
   * Tracks how many thought-action-observation loops have been executed
   */
  iteration: {
    schema: z.number(),
    reducer: (left: number, right: number) => left + right,
    default: () => 0,
    description: 'Current iteration count',
  } satisfies StateChannelConfig<number, number>,

  /**
   * Whether the agent should continue iterating
   */
  shouldContinue: {
    schema: z.boolean().optional(),
    default: () => true,
    description: 'Whether to continue the ReAct loop',
  } satisfies StateChannelConfig<boolean | undefined>,

  /**
   * Final response (if any)
   */
  response: {
    schema: z.string().optional(),
    description: 'Final response from the agent',
  } satisfies StateChannelConfig<string | undefined>,
};

/**
 * Create the ReAct state annotation
 *
 * This uses LangGraph's Annotation.Root() under the hood, with optional Zod validation.
 */
export const ReActState = createStateAnnotation(ReActStateConfig);

/**
 * TypeScript type for ReAct state
 */
export type ReActStateType = typeof ReActState.State;

/**
 * Export schemas for external use
 */
export {
  MessageSchema,
  ThoughtSchema,
  ToolCallSchema,
  ToolResultSchema,
  ScratchpadEntrySchema,
  type Message,
  type Thought,
  type ToolCall,
  type ToolResult,
  type ScratchpadEntry,
};

