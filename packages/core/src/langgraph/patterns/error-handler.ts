/**
 * Error handler pattern for LangGraph nodes
 *
 * Wraps a node function with error handling logic.
 */

/**
 * Options for error handling behavior
 */
export interface ErrorHandlerOptions<State> {
  /**
   * Callback function to handle errors
   * Should return a state update to apply when an error occurs
   */
  onError: (error: Error, state: State) => State | Partial<State> | Promise<State | Partial<State>>;

  /**
   * Optional callback for logging errors
   */
  logError?: (error: Error, state: State) => void;

  /**
   * Whether to rethrow the error after handling
   * @default false
   */
  rethrow?: boolean;
}

/**
 * Wraps a node function with error handling logic.
 *
 * @example
 * ```typescript
 * const safeNode = withErrorHandler(myNode, {
 *   onError: (error, state) => {
 *     return { ...state, error: error.message, failed: true };
 *   },
 *   logError: (error) => {
 *     console.error('Node failed:', error);
 *   },
 * });
 *
 * graph.addNode('safe', safeNode);
 * ```
 *
 * @param node - The node function to wrap
 * @param options - Error handling configuration options
 * @returns A wrapped node function with error handling
 */
export function withErrorHandler<State>(
  node: (state: State) => State | Promise<State> | Partial<State> | Promise<Partial<State>>,
  options: ErrorHandlerOptions<State>
): (state: State) => Promise<State | Partial<State>> {
  const { onError, logError, rethrow = false } = options;

  return async (state: State): Promise<State | Partial<State>> => {
    try {
      return await Promise.resolve(node(state));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Log error if callback provided
      if (logError) {
        logError(err, state);
      }

      // Handle the error
      const result = await Promise.resolve(onError(err, state));

      // Rethrow if configured to do so
      if (rethrow) {
        throw err;
      }

      return result;
    }
  };
}

