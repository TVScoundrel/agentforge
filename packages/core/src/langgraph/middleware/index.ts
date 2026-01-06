/**
 * Middleware System for LangGraph
 *
 * A composable middleware system for enhancing LangGraph nodes with
 * cross-cutting concerns like logging, metrics, retry, caching, etc.
 *
 * @module langgraph/middleware
 *
 * @example
 * ```typescript
 * import { compose, presets } from '@agentforge/core/langgraph/middleware';
 * import { withRetry, withMetrics } from '@agentforge/core/langgraph/middleware';
 *
 * // Using compose
 * const enhanced = compose(
 *   withLogging({ level: 'info' }),
 *   withMetrics({ name: 'my-node' }),
 *   withRetry({ maxAttempts: 3 })
 * )(myNode);
 *
 * // Using presets
 * const productionNode = presets.production(myNode, {
 *   nodeName: 'my-node',
 * });
 * ```
 */

// Core types
export type {
  NodeFunction,
  Middleware,
  MiddlewareFactory,
  SimpleMiddleware,
  ComposeOptions,
  MiddlewareMetadata,
  MiddlewareWithMetadata,
  MiddlewareContext,
  NodeFunctionWithContext,
} from './types.js';

// Composition utilities
export {
  compose,
  composeWithOptions,
  chain,
  MiddlewareChain,
  createMiddlewareContext,
} from './compose.js';

// Presets
export {
  presets,
  production,
  development,
  testing,
  type ProductionPresetOptions,
  type DevelopmentPresetOptions,
  type TestingPresetOptions,
} from './presets.js';

// Re-export existing middleware from patterns
export { withRetry, type RetryOptions } from '../patterns/retry.js';
export { withErrorHandler, type ErrorHandlerOptions } from '../patterns/error-handler.js';
export { withTimeout, type TimeoutOptions } from '../patterns/timeout.js';

// Re-export observability middleware
export { withMetrics, type MetricsNodeOptions } from '../observability/metrics.js';
export { withTracing, type TracingOptions } from '../observability/langsmith.js';
export { createLogger, LogLevel, type Logger } from '../observability/logger.js';

// Export new middleware
export { withCache, createSharedCache, type CachingOptions, type CacheKeyGenerator, type EvictionStrategy } from './caching.js';
export { withRateLimit, createSharedRateLimiter, type RateLimitOptions, type RateLimitStrategy } from './rate-limiting.js';
export { withValidation, type ValidationOptions, type ValidationMode, type ValidatorFunction, type ValidationErrorHandler } from './validation.js';
export { withConcurrency, createSharedConcurrencyController, type ConcurrencyOptions, type Priority } from './concurrency.js';
export { withLogging, type LoggingOptions } from './logging.js';

