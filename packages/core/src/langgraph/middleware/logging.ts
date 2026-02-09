/**
 * Logging Middleware
 *
 * Provides structured logging for LangGraph nodes with input/output tracking,
 * duration measurement, and error logging.
 *
 * @module langgraph/middleware/logging
 */

import type { NodeFunction, MiddlewareFactory } from './types.js';
import { createLogger, type Logger, type LogLevel } from '../observability/logger.js';

/**
 * Options for logging middleware
 */
export interface LoggingOptions {
  /**
   * Logger instance to use
   * If not provided, a new logger will be created with the given name
   */
  logger?: Logger;

  /**
   * Name for the logger (used if logger is not provided)
   */
  name?: string;

  /**
   * Log level
   * @default 'info'
   */
  level?: LogLevel;

  /**
   * Whether to log node inputs
   * @default true
   */
  logInput?: boolean;

  /**
   * Whether to log node outputs
   * @default true
   */
  logOutput?: boolean;

  /**
   * Whether to log execution duration
   * @default true
   */
  logDuration?: boolean;

  /**
   * Whether to log errors
   * @default true
   */
  logErrors?: boolean;

  /**
   * Custom function to extract loggable data from state
   * Use this to avoid logging sensitive information
   */
  extractData?: <State>(state: State) => Record<string, any>;

  /**
   * Callback when node execution starts
   */
  onStart?: <State>(state: State) => void;

  /**
   * Callback when node execution completes
   */
  onComplete?: <State>(state: State, result: State | Partial<State>, duration: number) => void;

  /**
   * Callback when node execution fails
   */
  onError?: (error: Error, duration: number) => void;
}

/**
 * Create a logging middleware that wraps a node with structured logging.
 *
 * @example
 * ```typescript
 * import { withLogging } from '@agentforge/core';
 *
 * const loggedNode = withLogging({
 *   name: 'my-node',
 *   level: 'info',
 *   logInput: true,
 *   logOutput: true,
 * })(myNode);
 * ```
 *
 * @param options - Logging configuration options
 * @returns A middleware function that adds logging to a node
 */
export const withLogging: MiddlewareFactory<any, LoggingOptions> = <State>(
  options: LoggingOptions
) => {
  const {
    logger: providedLogger,
    name = 'node',
    level = 'info' as any,
    logInput = true,
    logOutput = true,
    logDuration = true,
    logErrors = true,
    extractData,
    onStart,
    onComplete,
    onError,
  } = options;

  // Create or use provided logger
  const logger = providedLogger || createLogger(name, { level });

  return (node: NodeFunction<State>): NodeFunction<State> => {
    return async (state: State): Promise<State | Partial<State>> => {
      const startTime = Date.now();

      try {
        // Log input
        if (logInput) {
          const data = extractData ? extractData(state) : { state };
          logger.info('Node execution started', data);
        }

        // Call onStart callback
        if (onStart) {
          onStart(state);
        }

        // Execute the node
        const result = await Promise.resolve(node(state));

        const duration = Date.now() - startTime;

        // Log output
        if (logOutput) {
          const data = extractData ? extractData(result as State) : { result };
          if (logDuration) {
            logger.info(`Node execution completed (${duration}ms)`, data);
          } else {
            logger.info('Node execution completed', data);
          }
        }

        // Call onComplete callback
        if (onComplete) {
          onComplete(state, result, duration);
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        const err = error instanceof Error ? error : new Error(String(error));

        // Log error
        if (logErrors) {
          logger.error(`Node execution failed (${duration}ms)`, {
            error: err.message,
            stack: err.stack,
          });
        }

        // Call onError callback
        if (onError) {
          onError(err, duration);
        }

        throw error;
      }
    };
  };
};

