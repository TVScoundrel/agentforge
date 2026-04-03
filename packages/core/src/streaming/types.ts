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
 * Binary WebSocket payload
 */
export type WebSocketBinaryData =
  | ArrayBuffer
  | ArrayBufferView
  | ReadonlyArray<ArrayBufferView>;

/**
 * Raw WebSocket message payload
 */
export type WebSocketRawMessage = string | WebSocketBinaryData;

/**
 * WebSocket close reason payload
 */
export type WebSocketCloseReason = string | WebSocketBinaryData;

/**
 * Minimal WebSocket-like connection contract used by streaming helpers
 */
export type WebSocketEvent = 'pong' | 'message' | 'error' | 'close';

/**
 * Typed WebSocket event handler
 */
export type WebSocketEventHandler<
  TEvent extends WebSocketEvent,
  TMessage,
  TCloseReason,
> = TEvent extends 'pong'
  ? () => void
  : TEvent extends 'message'
    ? (data: TMessage) => void | Promise<void>
    : TEvent extends 'error'
      ? (error: Error) => void
      : (code?: number, reason?: TCloseReason) => void;

export interface WebSocketConnection<
  TMessage = WebSocketRawMessage,
  TCloseReason = WebSocketCloseReason,
> {
  /** Socket ready state */
  readyState: number;
  /** Register event handler */
  on<TEvent extends WebSocketEvent>(
    event: TEvent,
    handler: WebSocketEventHandler<TEvent, TMessage, TCloseReason>
  ): void;
  /** Send string data */
  send(data: string): void;
  /** Close gracefully when supported by the implementation */
  close?(): void;
  /** Send ping when heartbeat support is available */
  ping?(): void;
  /** Force terminate socket when supported by the implementation */
  terminate?(): void;
}

type WebSocketConnectionTypeParts<TSocket extends WebSocketConnection> =
  TSocket extends WebSocketConnection<infer TMessage, infer TCloseReason>
    ? { message: TMessage; closeReason: TCloseReason }
    : { message: WebSocketRawMessage; closeReason: WebSocketCloseReason };

/**
 * Extract message payload type from a WebSocket-like connection
 */
export type WebSocketMessageFor<TSocket extends WebSocketConnection> =
  WebSocketConnectionTypeParts<TSocket>['message'];

/**
 * Extract close reason type from a WebSocket-like connection
 */
export type WebSocketCloseReasonFor<TSocket extends WebSocketConnection> =
  WebSocketConnectionTypeParts<TSocket>['closeReason'];

/**
 * Minimal WebSocket-like send target used by send/broadcast helpers
 */
export interface WebSocketSendTarget {
  /** Socket ready state */
  readyState: number;
  /** Send string data */
  send(data: string): void;
}

/**
 * WebSocket message
 */
export interface WebSocketMessage<TData = unknown> {
  /** Message type */
  type: string;
  /** Message data */
  data?: TData;
  /** Error information */
  error?: string;
}

/**
 * WebSocket handler options
 */
export interface WebSocketHandlerOptions<
  TSocket extends WebSocketConnection = WebSocketConnection,
  TRequest = unknown,
> {
  /** Connection handler */
  onConnect?: (ws: TSocket, req?: TRequest) => void;
  /** Message handler */
  onMessage?: (ws: TSocket, message: unknown) => void | Promise<void>;
  /** Error handler */
  onError?: (ws: TSocket, error: Error) => void;
  /** Close handler */
  onClose?: (ws: TSocket, code?: number, reason?: WebSocketCloseReasonFor<TSocket>) => void;
  /** Heartbeat interval (ms) */
  heartbeat?: number;
}
