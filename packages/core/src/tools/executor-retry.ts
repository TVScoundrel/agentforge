import type { ExecutableTool, RetryPolicy } from './executor-types.js';
import {
  executeWithRetries,
  executeWithTimeout as executeWithSharedTimeout,
  normalizeThrownValue,
} from './execution-resilience.js';

type WarnLogger = {
  warn: (message: string) => void;
};

function calculateBackoff(attempt: number, policy: RetryPolicy): number {
  const initialDelay = policy.initialDelay || 1000;
  const maxDelay = policy.maxDelay || 30000;

  let delay: number;
  switch (policy.backoff) {
    case 'linear':
      delay = initialDelay * attempt;
      break;
    case 'exponential':
      delay = initialDelay * Math.pow(2, attempt - 1);
      break;
    case 'fixed':
    default:
      delay = initialDelay;
  }

  return Math.min(delay, maxDelay);
}

export function toError(error: unknown): Error {
  return normalizeThrownValue(error);
}

function resolveExecutionMethod(tool: ExecutableTool, logger: WarnLogger) {
  const executeFn = tool.invoke || tool.execute;

  if (!executeFn) {
    throw new Error(
      'Tool must implement invoke() method. ' +
        'Tools created with createTool() or toolBuilder automatically have this method. ' +
        'If you are manually constructing a tool, ensure it has an invoke() method.'
    );
  }

  if (!tool.invoke && tool.execute) {
    logger.warn(
      `Tool "${tool.metadata?.name ?? tool.name ?? 'unknown'}" only implements execute() which is deprecated. ` +
        'Please update to implement invoke() as the primary method. ' +
        'execute() will be removed in v1.0.0.'
    );
  }

  return executeFn;
}

export async function executeWithRetry(
  tool: ExecutableTool,
  input: unknown,
  policy: RetryPolicy | undefined,
  logger: WarnLogger
): Promise<unknown> {
  const executeFn = resolveExecutionMethod(tool, logger);

  if (!policy) {
    return await executeFn.call(tool, input);
  }

  if (!Number.isInteger(policy.maxAttempts) || policy.maxAttempts < 1) {
    throw new Error(
      `Invalid retry policy: maxAttempts must be an integer >= 1 (received ${String(policy.maxAttempts)})`
    );
  }

  return executeWithRetries(
    () => executeFn.call(tool, input),
    policy.maxAttempts,
    (attempt) => calculateBackoff(attempt, policy),
    (error) =>
      !policy.retryableErrors?.length ||
      policy.retryableErrors.some((message) => error.message.includes(message))
  );
}

export async function executeWithTimeout<T>(
  execute: () => Promise<T>,
  timeout: number
): Promise<T> {
  return executeWithSharedTimeout(
    execute,
    timeout,
    () => new Error('Tool execution timeout'),
    'execution-first'
  );
}
