/**
 * Retry pattern for LangGraph nodes
 *
 * Wraps a node function with retry logic.
 */

/**
 * Backoff strategy for retries
 */
export type BackoffStrategy = 'constant' | 'linear' | 'exponential';

/**
 * Options for retry behavior
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxAttempts?: number;

  /**
   * Backoff strategy between retries
   * @default 'exponential'
   */
  backoff?: BackoffStrategy;

  /**
   * Initial delay in milliseconds
   * @default 1000
   */
  initialDelay?: number;

  /**
   * Maximum delay in milliseconds
   * @default 30000
   */
  maxDelay?: number;

  /**
   * Optional callback when a retry occurs
   */
  onRetry?: (error: Error, attempt: number) => void;

  /**
   * Optional predicate to determine if error should be retried
   * @default () => true (retry all errors)
   */
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Calculate delay for a given attempt using the specified backoff strategy
 */
function calculateDelay(
  attempt: number,
  strategy: BackoffStrategy,
  initialDelay: number,
  maxDelay: number
): number {
  let delay: number;

  switch (strategy) {
    case 'constant':
      delay = initialDelay;
      break;
    case 'linear':
      delay = initialDelay * attempt;
      break;
    case 'exponential':
      delay = initialDelay * Math.pow(2, attempt - 1);
      break;
  }

  return Math.min(delay, maxDelay);
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps a node function with retry logic.
 *
 * @example
 * ```typescript
 * const robustNode = withRetry(myNode, {
 *   maxAttempts: 3,
 *   backoff: 'exponential',
 *   initialDelay: 1000,
 *   onRetry: (error, attempt) => {
 *     console.log(`Retry attempt ${attempt}: ${error.message}`);
 *   },
 * });
 *
 * graph.addNode('robust', robustNode);
 * ```
 *
 * @param node - The node function to wrap
 * @param options - Retry configuration options
 * @returns A wrapped node function with retry logic
 */
export function withRetry<State>(
  node: (state: State) => State | Promise<State> | Partial<State> | Promise<Partial<State>>,
  options: RetryOptions = {}
): (state: State) => Promise<State | Partial<State>> {
  const {
    maxAttempts = 3,
    backoff = 'exponential',
    initialDelay = 1000,
    maxDelay = 30000,
    onRetry,
    shouldRetry = () => true,
  } = options;

  return async (state: State): Promise<State | Partial<State>> => {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await Promise.resolve(node(state));
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if we should retry this error
        if (!shouldRetry(lastError)) {
          throw lastError;
        }

        // If this was the last attempt, throw the error
        if (attempt === maxAttempts) {
          throw lastError;
        }

        // Call onRetry callback if provided
        if (onRetry) {
          onRetry(lastError, attempt);
        }

        // Calculate and wait for backoff delay
        const delay = calculateDelay(attempt, backoff, initialDelay, maxDelay);
        await sleep(delay);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Retry failed');
  };
}

