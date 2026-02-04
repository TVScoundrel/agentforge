/**
 * Zod schemas for ReAct pattern state
 *
 * These schemas define the structure of messages, thoughts, actions, and observations
 * used in the ReAct (Reasoning and Action) pattern.
 *
 * @module langgraph/patterns/react/schemas
 */

import { z } from 'zod';

/**
 * Message role types
 */
export const MessageRoleSchema = z.enum(['system', 'user', 'assistant', 'tool']);

/**
 * Base message schema
 *
 * Note: tool_call_id is required for messages with role='tool' to properly
 * construct ToolMessage instances in LangChain. It links tool results back
 * to their corresponding tool calls.
 */
export const MessageSchema = z.object({
  role: MessageRoleSchema,
  content: z.string(),
  name: z.string().optional(),
  tool_call_id: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type Message = z.infer<typeof MessageSchema>;

/**
 * Thought schema - represents a reasoning step
 */
export const ThoughtSchema = z.object({
  content: z.string(),
  timestamp: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

export type Thought = z.infer<typeof ThoughtSchema>;

/**
 * Tool call schema - represents an action to take
 */
export const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  arguments: z.record(z.any()),
  timestamp: z.number().optional(),
});

export type ToolCall = z.infer<typeof ToolCallSchema>;

/**
 * Tool result schema - represents an observation from a tool
 */
export const ToolResultSchema = z.object({
  toolCallId: z.string(),
  result: z.any(),
  error: z.string().optional(),
  timestamp: z.number().optional(),
  isDuplicate: z.boolean().optional(), // Flag indicating this was a duplicate tool call
});

export type ToolResult = z.infer<typeof ToolResultSchema>;

/**
 * Scratchpad entry schema - intermediate reasoning
 */
export const ScratchpadEntrySchema = z.object({
  step: z.number(),
  thought: z.string().optional(),
  action: z.string().optional(),
  observation: z.string().optional(),
  timestamp: z.number().optional(),
});

export type ScratchpadEntry = z.infer<typeof ScratchpadEntrySchema>;

