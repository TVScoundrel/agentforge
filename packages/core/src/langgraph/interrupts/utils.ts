/**
 * Utilities for working with LangGraph interrupts
 * @module langgraph/interrupts/utils
 */

import type { 
  InterruptData, 
  HumanRequestInterrupt, 
  ApprovalRequiredInterrupt,
  CustomInterrupt,
  AnyInterrupt,
  ThreadInfo,
  ThreadStatus,
} from './types.js';
import type { HumanRequest } from '../../tools/builtin/ask-human/types.js';

/**
 * Create a human request interrupt
 * 
 * @param request - The human request data
 * @returns A human request interrupt object
 * 
 * @example
 * ```typescript
 * const interrupt = createHumanRequestInterrupt({
 *   id: 'req-123',
 *   question: 'Should I proceed?',
 *   priority: 'high',
 *   createdAt: Date.now(),
 *   timeout: 0,
 *   status: 'pending',
 * });
 * ```
 */
export function createHumanRequestInterrupt(request: HumanRequest): HumanRequestInterrupt {
  return {
    type: 'human_request',
    id: request.id,
    createdAt: request.createdAt,
    data: request,
  };
}

/**
 * Create an approval required interrupt
 * 
 * @param action - The action requiring approval
 * @param description - Description of the action
 * @param context - Optional context
 * @returns An approval required interrupt object
 * 
 * @example
 * ```typescript
 * const interrupt = createApprovalRequiredInterrupt(
 *   'delete-database',
 *   'Delete production database',
 *   { database: 'prod-db-1' }
 * );
 * ```
 */
export function createApprovalRequiredInterrupt(
  action: string,
  description: string,
  context?: Record<string, any>
): ApprovalRequiredInterrupt {
  return {
    type: 'approval_required',
    id: `approval-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
    data: {
      action,
      description,
      context,
    },
  };
}

/**
 * Create a custom interrupt
 * 
 * @param id - Unique ID for the interrupt
 * @param data - Custom data
 * @param metadata - Optional metadata
 * @returns A custom interrupt object
 * 
 * @example
 * ```typescript
 * const interrupt = createCustomInterrupt(
 *   'custom-123',
 *   { type: 'review', content: 'Please review this' }
 * );
 * ```
 */
export function createCustomInterrupt(
  id: string,
  data: any,
  metadata?: Record<string, any>
): CustomInterrupt {
  return {
    type: 'custom',
    id,
    createdAt: Date.now(),
    data,
    metadata,
  };
}

/**
 * Check if an interrupt is a human request
 * 
 * @param interrupt - The interrupt to check
 * @returns True if the interrupt is a human request
 */
export function isHumanRequestInterrupt(interrupt: AnyInterrupt): interrupt is HumanRequestInterrupt {
  return interrupt.type === 'human_request';
}

/**
 * Check if an interrupt is an approval request
 * 
 * @param interrupt - The interrupt to check
 * @returns True if the interrupt is an approval request
 */
export function isApprovalRequiredInterrupt(interrupt: AnyInterrupt): interrupt is ApprovalRequiredInterrupt {
  return interrupt.type === 'approval_required';
}

/**
 * Check if an interrupt is a custom interrupt
 * 
 * @param interrupt - The interrupt to check
 * @returns True if the interrupt is a custom interrupt
 */
export function isCustomInterrupt(interrupt: AnyInterrupt): interrupt is CustomInterrupt {
  return interrupt.type === 'custom';
}

/**
 * Get the status of a thread based on its state
 * 
 * @param hasInterrupts - Whether the thread has active interrupts
 * @param isComplete - Whether the thread has completed
 * @param hasError - Whether the thread has an error
 * @returns The thread status
 */
export function getThreadStatus(
  hasInterrupts: boolean,
  isComplete: boolean,
  hasError: boolean
): ThreadStatus {
  if (hasError) return 'error';
  if (isComplete) return 'completed';
  if (hasInterrupts) return 'interrupted';
  return 'running';
}

