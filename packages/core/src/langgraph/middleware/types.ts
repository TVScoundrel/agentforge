/**
 * Middleware System - Type Definitions
 *
 * Core types and interfaces for the middleware system.
 * All middleware follows a consistent, composable pattern.
 *
 * @module langgraph/middleware/types
 */

/**
 * A LangGraph node function that processes state.
 *
 * Node functions can return:
 * - Full state (State)
 * - Partial state update (Partial<State>)
 * - Promise of either
 *
 * @template State - The state type for the node
 */
export type NodeFunction<State> = (
  state: State
) => State | Promise<State> | Partial<State> | Promise<Partial<State>>;

/**
 * A middleware function that wraps a node function.
 *
 * Middleware takes a node function and options, and returns a new node function
 * with enhanced behavior (logging, metrics, retry, etc.).
 *
 * @template State - The state type for the node
 * @template Options - Configuration options for the middleware
 *
 * @example
 * ```typescript
 * const loggingMiddleware: Middleware<MyState, LoggingOptions> = (node, options) => {
 *   return async (state) => {
 *     console.log('Before:', state);
 *     const result = await node(state);
 *     console.log('After:', result);
 *     return result;
 *   };
 * };
 * ```
 */
export type Middleware<State, Options = unknown> = (
  node: NodeFunction<State>,
  options: Options
) => NodeFunction<State>;

/**
 * A middleware factory that creates middleware with bound options.
 *
 * This is useful for creating reusable middleware configurations.
 *
 * @template State - The state type for the node
 * @template Options - Configuration options for the middleware
 *
 * @example
 * ```typescript
 * const createLogger: MiddlewareFactory<MyState, LoggingOptions> = (options) => {
 *   return (node) => {
 *     return async (state) => {
 *       // Logging logic using options
 *       return await node(state);
 *     };
 *   };
 * };
 * ```
 */
export type MiddlewareFactory<State, Options = unknown> = (
  options: Options
) => (node: NodeFunction<State>) => NodeFunction<State>;

/**
 * A middleware that doesn't require options.
 *
 * @template State - The state type for the node
 */
export type SimpleMiddleware<State> = (
  node: NodeFunction<State>
) => NodeFunction<State>;

/**
 * Configuration for middleware composition.
 */
export interface ComposeOptions {
  /**
   * Whether to execute middleware in reverse order.
   * @default false
   */
  reverse?: boolean;

  /**
   * Name for the composed middleware (for debugging).
   */
  name?: string;

  /**
   * Whether to catch and handle errors in middleware.
   * @default true
   */
  catchErrors?: boolean;
}

/**
 * Metadata about a middleware function.
 */
export interface MiddlewareMetadata {
  /**
   * Name of the middleware
   */
  name: string;

  /**
   * Description of what the middleware does
   */
  description?: string;

  /**
   * Version of the middleware
   */
  version?: string;

  /**
   * Tags for categorizing middleware
   */
  tags?: string[];
}

/**
 * A middleware with attached metadata.
 */
export interface MiddlewareWithMetadata<State, Options = unknown> {
  /**
   * The middleware function
   */
  middleware: Middleware<State, Options>;

  /**
   * Metadata about the middleware
   */
  metadata: MiddlewareMetadata;
}

/**
 * Context passed through middleware chain.
 *
 * This allows middleware to share information without modifying state.
 */
export interface MiddlewareContext {
  /**
   * Unique ID for this execution
   */
  executionId: string;

  /**
   * Timestamp when execution started
   */
  startTime: number;

  /**
   * Custom data that middleware can read/write
   */
  data: Record<string, unknown>;

  /**
   * Stack of middleware names that have been applied
   */
  middlewareStack: string[];
}

/**
 * Enhanced node function with middleware context.
 */
export type NodeFunctionWithContext<State> = (
  state: State,
  context: MiddlewareContext
) => State | Promise<State> | Partial<State> | Promise<Partial<State>>;

