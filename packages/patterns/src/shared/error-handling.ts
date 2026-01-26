/**
 * Shared error handling utilities for agent patterns
 * 
 * @module patterns/shared/error-handling
 */

/**
 * Check if an error is a GraphInterrupt
 * 
 * GraphInterrupt is used by LangGraph's interrupt() function for human-in-the-loop workflows.
 * These errors should always be re-thrown to allow the graph to handle them properly.
 * 
 * @param error - The error to check
 * @returns True if the error is a GraphInterrupt
 */
export function isGraphInterrupt(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'constructor' in error &&
    error.constructor.name === 'GraphInterrupt'
  );
}

/**
 * Handle errors in node functions with proper GraphInterrupt detection
 * 
 * This function:
 * 1. Re-throws GraphInterrupt errors (for human-in-the-loop)
 * 2. Extracts error messages from Error objects
 * 3. Optionally logs errors to console
 * 
 * @param error - The error to handle
 * @param context - Context string for logging (e.g., 'action', 'reasoning')
 * @param verbose - Whether to log errors to console
 * @returns Error message string
 * @throws Re-throws GraphInterrupt errors
 * 
 * @example
 * ```typescript
 * try {
 *   const result = await tool.execute(args);
 * } catch (error) {
 *   const errorMessage = handleNodeError(error, 'action', verbose);
 *   // Use errorMessage...
 * }
 * ```
 */
export function handleNodeError(
  error: unknown,
  context: string,
  verbose: boolean = false
): string {
  // Check if this is a GraphInterrupt - if so, let it bubble up
  if (isGraphInterrupt(error)) {
    throw error;
  }

  // Extract error message
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Log if verbose
  if (verbose) {
    console.error(`[${context}] Error:`, errorMessage);
    if (error instanceof Error && error.stack) {
      console.error(`[${context}] Stack:`, error.stack);
    }
  }

  return errorMessage;
}

/**
 * Wrap a node function with error handling
 * 
 * This higher-order function wraps a node function to automatically handle errors,
 * including proper GraphInterrupt detection and re-throwing.
 * 
 * @param nodeFn - The node function to wrap
 * @param context - Context string for error logging
 * @param verbose - Whether to log errors
 * @returns Wrapped node function
 * 
 * @example
 * ```typescript
 * const safeNode = withErrorHandling(
 *   async (state) => {
 *     // Node logic that might throw
 *     return { result: 'success' };
 *   },
 *   'myNode',
 *   true
 * );
 * ```
 */
export function withErrorHandling<TState extends Record<string, any>>(
  nodeFn: (state: TState) => Promise<Partial<TState>>,
  context: string,
  verbose: boolean = false
): (state: TState) => Promise<Partial<TState>> {
  return async (state: TState) => {
    try {
      return await nodeFn(state);
    } catch (error) {
      const errorMessage = handleNodeError(error, context, verbose);
      return {
        status: 'failed' as any,
        error: errorMessage,
      };
    }
  };
}

