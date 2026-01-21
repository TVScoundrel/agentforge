/**
 * Types for askHuman tool and human-in-the-loop workflows
 * @module tools/builtin/ask-human/types
 */

import { z } from 'zod';

/**
 * Priority level for human requests
 */
export type HumanRequestPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Status of a human request
 */
export type HumanRequestStatus = 'pending' | 'answered' | 'timeout' | 'cancelled';

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

/**
 * Human request stored in state
 */
export interface HumanRequest {
  /**
   * Unique ID for this request
   */
  id: string;

  /**
   * The question being asked
   */
  question: string;

  /**
   * Optional context
   */
  context?: Record<string, any>;

  /**
   * Priority level
   */
  priority: HumanRequestPriority;

  /**
   * When the request was created
   */
  createdAt: number;

  /**
   * Timeout in milliseconds (0 = no timeout)
   */
  timeout: number;

  /**
   * Default response if timeout occurs
   */
  defaultResponse?: string;

  /**
   * Suggested responses
   */
  suggestions?: string[];

  /**
   * Current status
   */
  status: HumanRequestStatus;

  /**
   * The response (if answered)
   */
  response?: string;

  /**
   * When the response was received
   */
  respondedAt?: number;
}

