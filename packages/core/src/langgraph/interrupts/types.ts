/**
 * Types for LangGraph interrupt handling
 * @module langgraph/interrupts/types
 */

import type { HumanRequest } from '../../tools/builtin/ask-human/types.js';

/**
 * Interrupt type - identifies what kind of interrupt occurred
 */
export type InterruptType = 'human_request' | 'approval_required' | 'custom';

/**
 * Interrupt data stored in the checkpoint
 */
export interface InterruptData {
  /**
   * Type of interrupt
   */
  type: InterruptType;

  /**
   * Unique ID for this interrupt
   */
  id: string;

  /**
   * When the interrupt was created
   */
  createdAt: number;

  /**
   * The data associated with this interrupt
   */
  data: any;

  /**
   * Optional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Human request interrupt data
 */
export interface HumanRequestInterrupt extends InterruptData {
  type: 'human_request';
  data: HumanRequest;
}

/**
 * Approval required interrupt data
 */
export interface ApprovalRequiredInterrupt extends InterruptData {
  type: 'approval_required';
  data: {
    action: string;
    description: string;
    context?: Record<string, any>;
  };
}

/**
 * Custom interrupt data
 */
export interface CustomInterrupt extends InterruptData {
  type: 'custom';
  data: any;
}

/**
 * Union type of all interrupt types
 */
export type AnyInterrupt = HumanRequestInterrupt | ApprovalRequiredInterrupt | CustomInterrupt;

/**
 * Resume command for continuing after an interrupt
 */
export interface ResumeCommand {
  /**
   * The response to the interrupt
   */
  resume: any;

  /**
   * Optional metadata about the response
   */
  metadata?: Record<string, any>;
}

/**
 * Thread status
 */
export type ThreadStatus = 'running' | 'interrupted' | 'completed' | 'error';

/**
 * Thread info with interrupt status
 */
export interface ThreadInfo {
  /**
   * Thread ID
   */
  threadId: string;

  /**
   * Current status
   */
  status: ThreadStatus;

  /**
   * Active interrupts (if any)
   */
  interrupts?: AnyInterrupt[];

  /**
   * Last updated timestamp
   */
  updatedAt: number;

  /**
   * Optional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Options for checking interrupt status
 */
export interface CheckInterruptOptions {
  /**
   * Thread ID to check
   */
  threadId: string;

  /**
   * Filter by interrupt type
   */
  type?: InterruptType;
}

/**
 * Options for resuming from an interrupt
 */
export interface ResumeOptions {
  /**
   * Thread ID to resume
   */
  threadId: string;

  /**
   * Interrupt ID to resume from
   */
  interruptId?: string;

  /**
   * The response/value to resume with
   */
  value: any;

  /**
   * Optional metadata
   */
  metadata?: Record<string, any>;
}

