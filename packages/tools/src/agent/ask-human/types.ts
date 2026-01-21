/**
 * Types for askHuman tool and human-in-the-loop workflows
 * @module tools/agent/ask-human/types
 */

import { z } from 'zod';
import type { HumanRequest, HumanRequestPriority, HumanRequestStatus } from '@agentforge/core';

/**
 * Input schema for askHuman tool
 */
export const AskHumanInputSchema = z.object({
  /**
   * The question to ask the human
   */
  question: z.string().min(1).describe('The question to ask the human'),

  /**
   * Optional context to help the human understand the question
   */
  context: z.record(z.any()).optional().describe('Additional context for the question'),

  /**
   * Priority level for this request
   */
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal').describe('Priority level for this request'),

  /**
   * Timeout in milliseconds (0 = no timeout)
   */
  timeout: z.number().min(0).default(0).describe('Timeout in milliseconds (0 = no timeout)'),

  /**
   * Default response if timeout occurs
   */
  defaultResponse: z.string().optional().describe('Default response if timeout occurs'),

  /**
   * Suggested responses (for UI to show as options)
   */
  suggestions: z.array(z.string()).optional().describe('Suggested responses for the human'),
});

/**
 * Input type for askHuman tool
 */
export type AskHumanInput = z.infer<typeof AskHumanInputSchema>;

/**
 * Output from askHuman tool
 */
export interface AskHumanOutput {
  /**
   * The human's response
   */
  response: string;

  /**
   * Metadata about the interaction
   */
  metadata: {
    /**
     * Unique ID for this request
     */
    requestId: string;

    /**
     * When the request was created
     */
    requestedAt: number;

    /**
     * When the response was received
     */
    respondedAt: number;

    /**
     * How long it took to get a response (ms)
     */
    duration: number;

    /**
     * Whether this was a timeout response
     */
    timedOut: boolean;

    /**
     * Priority level
     */
    priority: HumanRequestPriority;
  };
}

// HumanRequest, HumanRequestPriority, and HumanRequestStatus are now imported from @agentforge/core
// They are defined in packages/core/src/langgraph/interrupts/types.ts

