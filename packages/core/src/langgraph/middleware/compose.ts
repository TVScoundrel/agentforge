/**
 * Middleware Composition Utilities
 *
 * Functions for composing multiple middleware into a single middleware chain.
 *
 * @module langgraph/middleware/compose
 */

import type {
  NodeFunction,
  SimpleMiddleware,
  ComposeOptions,
  MiddlewareContext,
} from './types.js';

/**
 * Compose multiple middleware functions into a single middleware.
 *
 * Middleware are applied from left to right (first middleware wraps the node,
 * second middleware wraps the first, etc.).
 *
 * @example
 * ```typescript
 * const enhanced = compose(
 *   withLogging({ level: 'info' }),
 *   withMetrics({ name: 'my-node' }),
 *   withRetry({ maxAttempts: 3 })
 * )(myNode);
 * ```
 *
 * @param middleware - Middleware functions to compose
 * @returns A function that takes a node and returns the enhanced node
 */
export function compose<State>(
  ...middleware: SimpleMiddleware<State>[]
): SimpleMiddleware<State> {
  return (node: NodeFunction<State>): NodeFunction<State> => {
    // Apply middleware from right to left (so they execute left to right)
    return middleware.reduceRight(
      (wrappedNode, mw) => mw(wrappedNode),
      node
    );
  };
}

/**
 * Compose middleware with options.
 *
 * @example
 * ```typescript
 * const enhanced = composeWithOptions(
 *   { reverse: true, name: 'my-chain' },
 *   withLogging({ level: 'info' }),
 *   withMetrics({ name: 'my-node' })
 * )(myNode);
 * ```
 *
 * @param options - Composition options
 * @param middleware - Middleware functions to compose
 * @returns A function that takes a node and returns the enhanced node
 */
export function composeWithOptions<State>(
  options: ComposeOptions,
  ...middleware: SimpleMiddleware<State>[]
): SimpleMiddleware<State> {
  const { reverse = false, name, catchErrors = true } = options;

  return (node: NodeFunction<State>): NodeFunction<State> => {
    // Apply middleware in the specified order
    const orderedMiddleware = reverse ? [...middleware].reverse() : middleware;

    let wrappedNode = orderedMiddleware.reduceRight(
      (wrappedNode, mw) => mw(wrappedNode),
      node
    );

    // Optionally wrap with error handling
    if (catchErrors) {
      const originalNode = wrappedNode;
      wrappedNode = async (state: State) => {
        try {
          return await Promise.resolve(originalNode(state));
        } catch (error) {
          // Re-throw with additional context
          const enhancedError = error instanceof Error ? error : new Error(String(error));
          if (name) {
            enhancedError.message = `[${name}] ${enhancedError.message}`;
          }
          throw enhancedError;
        }
      };
    }

    return wrappedNode;
  };
}

/**
 * Create a middleware chain builder for fluent API.
 *
 * @example
 * ```typescript
 * const enhanced = chain<MyState>()
 *   .use(withLogging({ level: 'info' }))
 *   .use(withMetrics({ name: 'my-node' }))
 *   .use(withRetry({ maxAttempts: 3 }))
 *   .build(myNode);
 * ```
 */
export class MiddlewareChain<State> {
  private middleware: SimpleMiddleware<State>[] = [];
  private options: ComposeOptions = {};

  /**
   * Add middleware to the chain.
   */
  use(middleware: SimpleMiddleware<State>): this {
    this.middleware.push(middleware);
    return this;
  }

  /**
   * Set composition options.
   */
  withOptions(options: ComposeOptions): this {
    this.options = { ...this.options, ...options };
    return this;
  }

  /**
   * Build the middleware chain and apply it to a node.
   */
  build(node: NodeFunction<State>): NodeFunction<State> {
    if (this.middleware.length === 0) {
      return node;
    }

    return composeWithOptions(this.options, ...this.middleware)(node);
  }

  /**
   * Get the number of middleware in the chain.
   */
  get length(): number {
    return this.middleware.length;
  }
}

/**
 * Create a new middleware chain builder.
 *
 * @example
 * ```typescript
 * const enhanced = chain<MyState>()
 *   .use(withLogging({ level: 'info' }))
 *   .build(myNode);
 * ```
 */
export function chain<State>(): MiddlewareChain<State> {
  return new MiddlewareChain<State>();
}

/**
 * Create a middleware context for tracking execution.
 */
export function createMiddlewareContext(): MiddlewareContext {
  return {
    executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    startTime: Date.now(),
    data: {},
    middlewareStack: [],
  };
}

