import { compose } from './compose.js';
import { withErrorHandler, withLogging, withMetrics, withRetry, withTimeout, withTracing } from './preset-adapters.js';
import type { ProductionPresetOptions } from './preset-types.js';
import type { NodeFunction, SimpleMiddleware } from './types.js';
import { createLogger, LogLevel } from '../observability/logger.js';
import type { MetricsNodeOptions } from '../observability/metrics.js';

/**
 * Production preset with comprehensive error handling, metrics, and tracing.
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
  const middleware: SimpleMiddleware<State>[] = [
    withLogging({
      logger: actualLogger,
      name: nodeName,
      logInput: false,
      logOutput: false,
      logDuration: true,
      logErrors: true,
    }),
    withErrorHandler({
      onError: (_error, state) => state,
      ...errorOptions,
    }),
  ];

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

  middleware.push(
    withTimeout({
      timeout,
      onTimeout: (state) => state,
    })
  );

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
