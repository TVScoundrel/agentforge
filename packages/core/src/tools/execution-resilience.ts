export function normalizeThrownValue(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export async function executeWithRetries<T>(
  execute: () => Promise<T>,
  maxAttempts: number,
  retryDelay: (attempt: number, error: Error) => number,
  shouldRetry: (error: Error) => boolean
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await execute();
    } catch (thrownValue) {
      const error = normalizeThrownValue(thrownValue);

      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, retryDelay(attempt, error)));
    }
  }

  throw new Error('Retry execution requires at least one attempt');
}

export async function executeWithTimeout<T>(
  execute: () => Promise<T>,
  timeoutMs: number,
  timeoutError: () => Error,
  startOrder: 'execution-first' | 'timeout-first' = 'timeout-first'
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const startTimeout = () =>
    new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(timeoutError()), timeoutMs);
    });

  try {
    let executionPromise: Promise<T>;
    let timeoutPromise: Promise<never>;

    if (startOrder === 'execution-first') {
      executionPromise = execute();
      timeoutPromise = startTimeout();
    } else {
      timeoutPromise = startTimeout();
      executionPromise = execute();
    }

    return await Promise.race([executionPromise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}
