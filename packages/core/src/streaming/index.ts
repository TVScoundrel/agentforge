/**
 * Streaming utilities for LangGraph applications
 *
 * This module provides utilities for working with streams in LangGraph applications:
 * - Stream transformers (chunk, batch, throttle)
 * - Stream aggregators (collect, reduce, merge, filter, map, take)
 * - Progress tracking
 * - Server-Sent Events (SSE) support
 * - WebSocket support
 *
 * @module streaming
 *
 * @example
 * ```typescript
 * import { chunk, collect, createProgressTracker } from '@agentforge/core';
 *
 * // Transform stream into chunks
 * const chunked = chunk(stream, { size: 10 });
 *
 * // Collect all items
 * const items = await collect(stream);
 *
 * // Track progress
 * const tracker = createProgressTracker({
 *   total: 100,
 *   onProgress: (p) => console.log(`${p.percentage}% complete`),
 * });
 * ```
 */

// Types
export type {
  ChunkOptions,
  BatchOptions,
  ThrottleOptions,
  ReducerFunction,
  Progress,
  ProgressTracker,
  ProgressTrackerOptions,
  SSEEvent,
  SSEFormatter,
  SSEFormatterOptions,
  WebSocketMessage,
  WebSocketHandlerOptions,
} from './types.js';

// Transformers
export { chunk, batch, throttle } from './transformers.js';

// Aggregators
export { collect, reduce, merge, filter, map, take } from './aggregators.js';

// Progress tracking
export { createProgressTracker } from './progress.js';

// SSE support
export { createSSEFormatter, createHeartbeat, parseSSEEvent } from './sse.js';

// Human-in-the-loop SSE utilities
export {
  formatHumanRequestEvent,
  formatHumanResponseEvent,
  formatInterruptEvent,
  formatResumeEvent,
  formatAgentWaitingEvent,
  formatAgentResumedEvent,
  type HumanInLoopEventType,
  type HumanRequestEventData,
  type HumanResponseEventData,
  type InterruptEventData,
  type ResumeEventData,
  type AgentWaitingEventData,
  type AgentResumedEventData,
  type HumanInLoopEventData,
} from './human-in-loop.js';

// WebSocket support
export { createWebSocketHandler, sendMessage, broadcast, createMessage } from './websocket.js';

