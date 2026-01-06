/**
 * Middleware Presets
 *
 * Pre-configured middleware combinations for common use cases.
 *
 * @module langgraph/middleware/presets
 */

import type { NodeFunction, SimpleMiddleware } from './types.js';
import { compose } from './compose.js';
import { withRetry as _withRetry, type RetryOptions } from '../patterns/retry.js';
import { withErrorHandler as _withErrorHandler, type ErrorHandlerOptions } from '../patterns/error-handler.js';
import { withTimeout as _withTimeout, type TimeoutOptions } from '../patterns/timeout.js';
import { withMetrics as _withMetrics, type MetricsNodeOptions } from '../observability/metrics.js';
import { withTracing as _withTracing, type TracingOptions } from '../observability/langsmith.js';
import { createLogger, LogLevel, type Logger } from '../observability/logger.js';
import { withLogging as _withLogging, type LoggingOptions } from './logging.js';

/**
 * Convert existing middleware to the new middleware pattern.
 * These wrappers make the existing middleware composable.
 */

function withRetry<State>(options: RetryOptions): SimpleMiddleware<State> {
  return (node) => _withRetry(node, options);
}

function withErrorHandler<State>(options: ErrorHandlerOptions<State>): SimpleMiddleware<State> {
  return (node) => _withErrorHandler(node, options);
}

function withTimeout<State>(options: TimeoutOptions<State>): SimpleMiddleware<State> {
  return (node) => _withTimeout(node, options);
}

function withMetrics<State>(options: MetricsNodeOptions): SimpleMiddleware<State> {
  return (node) => _withMetrics(node, options);
}

function withTracing<State>(options: TracingOptions): SimpleMiddleware<State> {
  return (node) => _withTracing(node, options);
}

function withLogging<State>(options: LoggingOptions): SimpleMiddleware<State> {
  return (node) => _withLogging(options)(node);
}

/**
 * Options for the production preset.
 */
export interface ProductionPresetOptions<State> {
  /**
   * Name of the node (for logging and metrics)
   */
  nodeName: string;

  /**
   * Logger instance
   */
  logger?: Logger;

  /**
   * Enable metrics tracking
   * @default true
   */
  enableMetrics?: boolean;

  /**
   * Enable tracing
   * @default true
   */
  enableTracing?: boolean;

  /**
   * Enable retry logic
   * @default true
   */
  enableRetry?: boolean;

  /**
   * Timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Custom retry options
   */
  retryOptions?: Partial<RetryOptions>;

  /**
   * Custom error handler options
   */
  errorOptions?: Partial<ErrorHandlerOptions<State>>;
}

/**
 * Production preset with comprehensive error handling, metrics, and tracing.
 *
 * Includes:
 * - Error handling with fallback
 * - Retry logic with exponential backoff
 * - Timeout protection
 * - Metrics tracking
 * - Distributed tracing
 *
 * @example
 * ```typescript
 * const productionNode = presets.production(myNode, {
 *   nodeName: 'my-node',
 *   logger: createLogger({ level: LogLevel.INFO }),
 * });
 * ```
 */
export function production<State>(
  node: NodeFunction<State>,
  options: ProductionPresetOptions<State>
): NodeFunction<State> {
  const {
    nodeName,
    logger,
    enableMetrics = true,
    enableTracing = true,
    enableRetry = true,
    timeout = 30000,
    retryOptions = {},
    errorOptions = {},
  } = options;

  const actualLogger = logger || createLogger(nodeName, { level: LogLevel.INFO });

  const middleware: SimpleMiddleware<State>[] = [];

  // Logging (outermost for visibility)
  middleware.push(
    withLogging({
      logger: actualLogger,
      name: nodeName,
      logInput: false, // Don't log input in production by default
      logOutput: false, // Don't log output in production by default
      logDuration: true,
      logErrors: true,
    })
  );

  // Error handling
  middleware.push(
    withErrorHandler({
      onError: (error, state) => {
        return state; // Return state on error
      },
      ...errorOptions,
    })
  );

  // Retry logic
  if (enableRetry) {
    middleware.push(
      withRetry({
        maxAttempts: 3,
        backoff: 'exponential',
        initialDelay: 1000,
        ...retryOptions,
      })
    );
  }

  // Timeout protection
  middleware.push(
    withTimeout({
      timeout,
      onTimeout: (state) => {
        return state;
      },
    })
  );

  // Metrics tracking
  if (enableMetrics) {
    middleware.push(
      withMetrics({
        name: nodeName,
        trackDuration: true,
        trackErrors: true,
        trackInvocations: true,
      } as MetricsNodeOptions)
    );
  }

  // Distributed tracing
  if (enableTracing) {
    middleware.push(
      withTracing({
        name: nodeName,
        metadata: { preset: 'production' },
      })
    );
  }

  return compose(...middleware)(node);
}

/**
 * Options for the development preset.
 */
export interface DevelopmentPresetOptions {
  /**
   * Name of the node
   */
  nodeName: string;

  /**
   * Enable verbose logging
   * @default true
   */
  verbose?: boolean;

  /**
   * Logger instance
   */
  logger?: Logger;
}

/**
 * Development preset with verbose logging and debugging.
 *
 * Includes:
 * - Verbose logging
 * - Error details
 * - No retry (fail fast)
 * - Extended timeout
 *
 * @example
 * ```typescript
 * const devNode = presets.development(myNode, {
 *   nodeName: 'my-node',
 *   verbose: true,
 * });
 * ```
 */
export function development<State>(
  node: NodeFunction<State>,
  options: DevelopmentPresetOptions
): NodeFunction<State> {
  const {
    nodeName,
    verbose = true,
    logger,
  } = options;

  const actualLogger = logger || createLogger(nodeName, { level: LogLevel.DEBUG });

  // Use withLogging middleware for development
  return withLogging<State>({
    logger: actualLogger,
    name: nodeName,
    logInput: verbose,
    logOutput: verbose,
    logDuration: true,
    logErrors: true,
  })(node);
}

/**
 * Options for the testing preset.
 */
export interface TestingPresetOptions<State> {
  /**
   * Name of the node
   */
  nodeName: string;

  /**
   * Mock responses for testing
   */
  mockResponse?: Partial<State>;

  /**
   * Simulate errors for testing
   */
  simulateError?: Error;

  /**
   * Delay in milliseconds for testing async behavior
   */
  delay?: number;

  /**
   * Track invocations for assertions
   */
  trackInvocations?: boolean;
}

/**
 * Testing preset for unit and integration tests.
 *
 * Includes:
 * - Mock responses
 * - Error simulation
 * - Invocation tracking
 * - Configurable delays
 *
 * @example
 * ```typescript
 * const testNode = presets.testing(myNode, {
 *   nodeName: 'my-node',
 *   mockResponse: { result: 'mocked' },
 *   trackInvocations: true,
 * });
 * ```
 */
export function testing<State>(
  node: NodeFunction<State>,
  options: TestingPresetOptions<State>
): NodeFunction<State> & { invocations: State[] } {
  const {
    nodeName,
    mockResponse,
    simulateError,
    delay = 0,
    trackInvocations = false,
  } = options;

  const invocations: State[] = [];

  const wrappedNode = async (state: State) => {
    // Track invocations
    if (trackInvocations) {
      invocations.push(state);
    }

    // Simulate delay
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Simulate error
    if (simulateError) {
      throw simulateError;
    }

    // Return mock response
    if (mockResponse) {
      return { ...state, ...mockResponse };
    }

    // Call original node
    return await Promise.resolve(node(state));
  };

  // Attach invocations array for assertions
  (wrappedNode as typeof wrappedNode & { invocations: State[] }).invocations = invocations;

  return wrappedNode as NodeFunction<State> & { invocations: State[] };
}

/**
 * Preset collection for easy access.
 */
export const presets = {
  production,
  development,
  testing,
};

