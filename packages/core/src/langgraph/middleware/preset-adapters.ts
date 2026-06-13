import type { MetricsNodeOptions } from '../observability/metrics.js';
import { withMetrics as _withMetrics } from '../observability/metrics.js';
import type { TracingOptions } from '../observability/langsmith.js';
import { withTracing as _withTracing } from '../observability/langsmith.js';
import type { ErrorHandlerOptions } from './error-handler.js';
import { withErrorHandler as _withErrorHandler } from './error-handler.js';
import type { LoggingOptions } from './logging.js';
import { withLogging as _withLogging } from './logging.js';
import type { RetryOptions } from './retry.js';
import { withRetry as _withRetry } from './retry.js';
import type { SimpleMiddleware } from './types.js';
import type { TimeoutOptions } from './timeout.js';
import { withTimeout as _withTimeout } from './timeout.js';

export function withRetry<State>(options: RetryOptions): SimpleMiddleware<State> {
  return (node) => _withRetry(node, options);
}

export function withErrorHandler<State>(options: ErrorHandlerOptions<State>): SimpleMiddleware<State> {
  return (node) => _withErrorHandler(node, options);
}

export function withTimeout<State>(options: TimeoutOptions<State>): SimpleMiddleware<State> {
  return (node) => _withTimeout(node, options);
}

export function withMetrics<State>(options: MetricsNodeOptions): SimpleMiddleware<State> {
  return (node) => _withMetrics(node, options);
}

export function withTracing<State>(options: TracingOptions): SimpleMiddleware<State> {
  return (node) => _withTracing(node, options);
}

export function withLogging<State>(options: LoggingOptions): SimpleMiddleware<State> {
  return (node) => _withLogging(options)(node);
}
