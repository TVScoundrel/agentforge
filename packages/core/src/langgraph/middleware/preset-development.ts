import { createLogger, LogLevel } from '../observability/logger.js';
import { withLogging } from './preset-adapters.js';
import type { DevelopmentPresetOptions } from './preset-types.js';
import type { NodeFunction } from './types.js';

/**
 * Development preset with verbose logging and debugging.
 */
export function development<State>(
  node: NodeFunction<State>,
  options: DevelopmentPresetOptions
): NodeFunction<State> {
  const { nodeName, verbose = true, logger } = options;
  const actualLogger = logger || createLogger(nodeName, { level: LogLevel.DEBUG });

  return withLogging<State>({
    logger: actualLogger,
    name: nodeName,
    logInput: verbose,
    logOutput: verbose,
    logDuration: true,
    logErrors: true,
  })(node);
}
