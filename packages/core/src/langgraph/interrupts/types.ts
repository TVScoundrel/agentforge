/**
 * Types for LangGraph interrupt handling
 * @module langgraph/interrupts/types
 */

import type { JsonObject, JsonValue } from '../observability/payload.js';

/**
 * Priority level for human requests
 */
export type HumanRequestPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Status of a human request
 */
export type HumanRequestStatus = 'pending' | 'answered' | 'timeout' | 'cancelled';

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
  context?: JsonObject;

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

/**
 * Interrupt type - identifies what kind of interrupt occurred
 */
export type InterruptType = 'human_request' | 'approval_required' | 'custom';

/**
 * Shared interrupt metadata contract.
 */
export type InterruptMetadata = JsonObject;

/**
 * JSON-safe payload allowed in generic interrupt and resume flows.
 */
export type InterruptPayload = JsonValue;

/**
 * Interrupt data stored in the checkpoint
 */
export interface InterruptData<
  TType extends InterruptType = InterruptType,
  TData = unknown,
  TMetadata extends InterruptMetadata = InterruptMetadata,
> {
  /**
   * Type of interrupt
   */
  type: TType;

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
  data: TData;

  /**
   * Optional metadata
   */
  metadata?: TMetadata;
}

/**
 * Approval request payload.
 */
export interface ApprovalRequiredData {
  action: string;
  description: string;
  context?: JsonObject;
}

/**
 * Human request interrupt data
 */
export type HumanRequestInterrupt = InterruptData<'human_request', HumanRequest>;

/**
 * Approval required interrupt data
 */
export type ApprovalRequiredInterrupt = InterruptData<'approval_required', ApprovalRequiredData>;

/**
 * Custom interrupt data
 */
export type CustomInterrupt<
  TData extends InterruptPayload = InterruptPayload,
  TMetadata extends InterruptMetadata = InterruptMetadata,
> = InterruptData<'custom', TData, TMetadata>;

/**
 * Union type of all interrupt types
 */
export type AnyInterrupt = HumanRequestInterrupt | ApprovalRequiredInterrupt | CustomInterrupt;

/**
 * Resume command for continuing after an interrupt
 */
export interface ResumeCommand<
  TResume extends InterruptPayload = InterruptPayload,
  TMetadata extends InterruptMetadata = InterruptMetadata,
> {
  /**
   * The response to the interrupt
   */
  resume: TResume;

  /**
   * Optional metadata about the response
   */
  metadata?: TMetadata;
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
  metadata?: InterruptMetadata;
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
  value: InterruptPayload;

  /**
   * Optional metadata
   */
  metadata?: InterruptMetadata;
}
