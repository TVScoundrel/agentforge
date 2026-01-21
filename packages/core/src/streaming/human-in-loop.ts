/**
 * SSE utilities for human-in-the-loop workflows
 * @module streaming/human-in-loop
 */

import type { SSEEvent } from './types.js';
import type { HumanRequest, AnyInterrupt } from '../langgraph/interrupts/types.js';

/**
 * Human-in-the-loop SSE event types
 */
export type HumanInLoopEventType = 
  | 'human_request'
  | 'human_response'
  | 'interrupt'
  | 'resume'
  | 'agent_waiting'
  | 'agent_resumed';

/**
 * Human request SSE event data
 */
export interface HumanRequestEventData {
  type: 'human_request';
  request: HumanRequest;
  threadId: string;
}

/**
 * Human response SSE event data
 */
export interface HumanResponseEventData {
  type: 'human_response';
  requestId: string;
  response: string;
  threadId: string;
}

/**
 * Interrupt SSE event data
 */
export interface InterruptEventData {
  type: 'interrupt';
  interrupt: AnyInterrupt;
  threadId: string;
}

/**
 * Resume SSE event data
 */
export interface ResumeEventData {
  type: 'resume';
  interruptId: string;
  value: any;
  threadId: string;
}

/**
 * Agent waiting SSE event data
 */
export interface AgentWaitingEventData {
  type: 'agent_waiting';
  reason: string;
  threadId: string;
}

/**
 * Agent resumed SSE event data
 */
export interface AgentResumedEventData {
  type: 'agent_resumed';
  threadId: string;
}

/**
 * Union type of all human-in-the-loop event data
 */
export type HumanInLoopEventData = 
  | HumanRequestEventData
  | HumanResponseEventData
  | InterruptEventData
  | ResumeEventData
  | AgentWaitingEventData
  | AgentResumedEventData;

/**
 * Format a human request as an SSE event
 * 
 * @param request - The human request
 * @param threadId - The thread ID
 * @returns An SSE event
 * 
 * @example
 * ```typescript
 * const event = formatHumanRequestEvent(humanRequest, 'thread-123');
 * // Send to client via SSE
 * res.write(formatSSEEvent(event));
 * ```
 */
export function formatHumanRequestEvent(request: HumanRequest, threadId: string): SSEEvent {
  const data: HumanRequestEventData = {
    type: 'human_request',
    request,
    threadId,
  };

  return {
    event: 'human_request',
    data: JSON.stringify(data),
    id: request.id,
  };
}

/**
 * Format a human response as an SSE event
 * 
 * @param requestId - The request ID
 * @param response - The human's response
 * @param threadId - The thread ID
 * @returns An SSE event
 */
export function formatHumanResponseEvent(
  requestId: string,
  response: string,
  threadId: string
): SSEEvent {
  const data: HumanResponseEventData = {
    type: 'human_response',
    requestId,
    response,
    threadId,
  };

  return {
    event: 'human_response',
    data: JSON.stringify(data),
    id: `response-${requestId}`,
  };
}

/**
 * Format an interrupt as an SSE event
 *
 * @param interrupt - The interrupt data
 * @param threadId - The thread ID
 * @returns An SSE event
 */
export function formatInterruptEvent(interrupt: AnyInterrupt, threadId: string): SSEEvent {
  const data: InterruptEventData = {
    type: 'interrupt',
    interrupt,
    threadId,
  };

  return {
    event: 'interrupt',
    data: JSON.stringify(data),
    id: interrupt.id,
  };
}

/**
 * Format a resume event as an SSE event
 *
 * @param interruptId - The interrupt ID being resumed
 * @param value - The resume value
 * @param threadId - The thread ID
 * @returns An SSE event
 */
export function formatResumeEvent(
  interruptId: string,
  value: any,
  threadId: string
): SSEEvent {
  const data: ResumeEventData = {
    type: 'resume',
    interruptId,
    value,
    threadId,
  };

  return {
    event: 'resume',
    data: JSON.stringify(data),
    id: `resume-${interruptId}`,
  };
}

/**
 * Format an agent waiting event as an SSE event
 *
 * @param reason - Why the agent is waiting
 * @param threadId - The thread ID
 * @returns An SSE event
 */
export function formatAgentWaitingEvent(reason: string, threadId: string): SSEEvent {
  const data: AgentWaitingEventData = {
    type: 'agent_waiting',
    reason,
    threadId,
  };

  return {
    event: 'agent_waiting',
    data: JSON.stringify(data),
  };
}

/**
 * Format an agent resumed event as an SSE event
 *
 * @param threadId - The thread ID
 * @returns An SSE event
 */
export function formatAgentResumedEvent(threadId: string): SSEEvent {
  const data: AgentResumedEventData = {
    type: 'agent_resumed',
    threadId,
  };

  return {
    event: 'agent_resumed',
    data: JSON.stringify(data),
  };
}

