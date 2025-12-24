/**
 * Timeout pattern for LangGraph nodes
 *
 * Wraps a node function with timeout logic.
 */

/**
 * Options for timeout behavior
 */
export interface TimeoutOptions<State> {
  /**
   * Timeout duration in milliseconds
   */
  timeout: number;

  /**
   * Callback function to handle timeouts
   * Should return a state update to apply when a timeout occurs
   */
  onTimeout: (state: State) => State | Partial<State> | Promise<State | Partial<State>>;

  /**
   * Optional callback for logging timeouts
   */
  logTimeout?: (state: State) => void;

  /**
   * Whether to throw an error on timeout
   * @default false
   */
  throwOnTimeout?: boolean;
}

/**
 * Error thrown when a node times out
 */
export class TimeoutError extends Error {
  constructor(timeout: number) {
    super(`Node execution timed out after ${timeout}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps a node function with timeout logic.
 *
 * @example
 * ```typescript
 * const timedNode = withTimeout(myNode, {
 *   timeout: 5000,
 *   onTimeout: (state) => ({
 *     ...state,
 *     timedOut: true,
 *     error: 'Operation timed out',
 *   }),
 *   logTimeout: () => {
 *     console.warn('Node timed out');
 *   },
 * });
 *
 * graph.addNode('timed', timedNode);
 * ```
 *
 * @param node - The node function to wrap
 * @param options - Timeout configuration options
 * @returns A wrapped node function with timeout logic
 */
export function withTimeout<State>(
  node: (state: State) => State | Promise<State> | Partial<State> | Promise<Partial<State>>,
  options: TimeoutOptions<State>
): (state: State) => Promise<State | Partial<State>> {
  const { timeout, onTimeout, logTimeout, throwOnTimeout = false } = options;

  return async (state: State): Promise<State | Partial<State>> => {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(timeout));
      }, timeout);
    });

    try {
      // Race between node execution and timeout
      return await Promise.race([Promise.resolve(node(state)), timeoutPromise]);
    } catch (error) {
      if (error instanceof TimeoutError) {
        // Log timeout if callback provided
        if (logTimeout) {
          logTimeout(state);
        }

        // Throw if configured to do so
        if (throwOnTimeout) {
          throw error;
        }

        // Handle the timeout
        return await Promise.resolve(onTimeout(state));
      }

      // Re-throw non-timeout errors
      throw error;
    }
  };
}

