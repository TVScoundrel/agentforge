import type { ExecutableTool, RetryPolicy } from './executor-types.js';

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
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
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
      `Tool "${tool.metadata?.name || 'unknown'}" only implements execute() which is deprecated. ` +
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

  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    try {
      return await executeFn.call(tool, input);
    } catch (error) {
      const currentError = toError(error);
      lastError = currentError;

      if (policy.retryableErrors && policy.retryableErrors.length > 0) {
        const isRetryable = policy.retryableErrors.some((message) =>
          currentError.message.includes(message)
        );
        if (!isRetryable) {
          throw currentError;
        }
      }

      if (attempt < policy.maxAttempts) {
        const delay = calculateBackoff(attempt, policy);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError ?? new Error('Tool execution failed after retries');
}
