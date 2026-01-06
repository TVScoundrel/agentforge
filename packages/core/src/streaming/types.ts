/**
 * Streaming utilities for LangGraph applications
 * @module streaming
 */

/**
 * Options for chunk transformer
 */
export interface ChunkOptions {
  /** Number of items per chunk */
  size: number;
}

/**
 * Options for batch transformer
 */
export interface BatchOptions {
  /** Maximum number of items per batch */
  maxSize: number;
  /** Maximum time to wait before emitting a batch (ms) */
  maxWait: number;
}

/**
 * Options for throttle transformer
 */
export interface ThrottleOptions {
  /** Maximum number of items to emit */
  rate: number;
  /** Time period for rate limit (ms) */
  per: number;
}

/**
 * Reducer function for stream aggregation
 */
export type ReducerFunction<T, R> = (accumulator: R, current: T) => R;

/**
 * Progress information
 */
export interface Progress {
  /** Current progress value */
  current: number;
  /** Total expected value */
  total: number;
  /** Percentage complete (0-100) */
  percentage: number;
  /** Estimated time to completion (seconds) */
  eta: number;
  /** Start time */
  startTime: number;
  /** Elapsed time (ms) */
  elapsed: number;
}

/**
 * Progress tracker options
 */
export interface ProgressTrackerOptions {
  /** Total expected items/steps */
  total: number;
  /** Callback for progress updates */
  onProgress?: (progress: Progress) => void;
  /** Callback for completion */
  onComplete?: (progress: Progress) => void;
  /** Callback for cancellation */
  onCancel?: () => void;
}

/**
 * Progress tracker interface
 */
export interface ProgressTracker {
  /** Start tracking */
  start(): void;
  /** Update progress */
  update(current: number): void;
  /** Mark as complete */
  complete(): void;
  /** Cancel tracking */
  cancel(): void;
  /** Get current progress */
  getProgress(): Progress;
  /** Check if cancelled */
  isCancelled(): boolean;
}

/**
 * SSE event
 */
export interface SSEEvent {
  /** Event type */
  event?: string;
  /** Event data */
  data: string;
  /** Event ID */
  id?: string;
  /** Retry interval (ms) */
  retry?: number;
}

/**
 * SSE formatter options
 */
export interface SSEFormatterOptions<T = any> {
  /** Event type mappers */
  eventTypes?: Record<string, (data: T) => SSEEvent>;
  /** Heartbeat interval (ms) */
  heartbeat?: number;
  /** Default retry interval (ms) */
  retry?: number;
}

/**
 * SSE formatter interface
 */
export interface SSEFormatter<T = any> {
  /** Format stream as SSE events */
  format(stream: AsyncIterable<T>): AsyncIterable<string>;
}

/**
 * WebSocket message
 */
export interface WebSocketMessage {
  /** Message type */
  type: string;
  /** Message data */
  data?: any;
  /** Error information */
  error?: string;
}

/**
 * WebSocket handler options
 */
export interface WebSocketHandlerOptions {
  /** Connection handler */
  onConnect?: (ws: any, req?: any) => void;
  /** Message handler */
  onMessage?: (ws: any, message: any) => Promise<void>;
  /** Error handler */
  onError?: (ws: any, error: Error) => void;
  /** Close handler */
  onClose?: (ws: any, code?: number, reason?: string) => void;
  /** Heartbeat interval (ms) */
  heartbeat?: number;
}

