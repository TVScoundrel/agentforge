/**
 * Enhanced Error Handling Utilities
 *
 * Provides enhanced error classes and error reporting for better debugging.
 */

/**
 * Error context information
 */
export interface ErrorContext {
  /**
   * Error code for categorization
   */
  code?: string;

  /**
   * Node name where the error occurred
   */
  node?: string;

  /**
   * Current state when the error occurred
   */
  state?: any;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;

  /**
   * Original error that caused this error
   */
  cause?: Error;
}

/**
 * Enhanced error class for agent errors
 */
export class AgentError extends Error {
  public readonly code?: string;
  public readonly node?: string;
  public readonly state?: any;
  public readonly metadata?: Record<string, any>;
  public readonly cause?: Error;
  public readonly timestamp: number;

  constructor(message: string, context: ErrorContext = {}) {
    super(message);
    this.name = 'AgentError';
    this.code = context.code;
    this.node = context.node;
    this.state = context.state;
    this.metadata = context.metadata;
    this.cause = context.cause;
    this.timestamp = Date.now();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AgentError);
    }
  }

  /**
   * Convert error to JSON for logging/reporting
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      node: this.node,
      state: this.state,
      metadata: this.metadata,
      timestamp: this.timestamp,
      stack: this.stack,
      cause: this.cause
        ? {
            name: this.cause.name,
            message: this.cause.message,
            stack: this.cause.stack,
          }
        : undefined,
    };
  }

  /**
   * Get a human-readable string representation
   */
  toString(): string {
    const parts = [`${this.name}: ${this.message}`];

    if (this.code) {
      parts.push(`Code: ${this.code}`);
    }

    if (this.node) {
      parts.push(`Node: ${this.node}`);
    }

    if (this.cause) {
      parts.push(`Caused by: ${this.cause.message}`);
    }

    return parts.join('\n');
  }
}

/**
 * Error reporter configuration
 */
export interface ErrorReporterOptions {
  /**
   * Callback function to handle errors
   */
  onError: (error: AgentError) => void | Promise<void>;

  /**
   * Whether to include stack traces
   * @default true
   */
  includeStackTrace?: boolean;

  /**
   * Whether to include state in error context
   * @default false (for security/privacy)
   */
  includeState?: boolean;

  /**
   * Whether to rethrow errors after reporting
   * @default true
   */
  rethrow?: boolean;
}

/**
 * Error reporter for tracking and reporting errors
 */
export interface ErrorReporter {
  /**
   * Wrap a node function with error reporting
   */
  wrap<State>(
    node: (state: State) => State | Promise<State> | Partial<State> | Promise<Partial<State>>,
    nodeName?: string
  ): (state: State) => Promise<State | Partial<State>>;

  /**
   * Report an error manually
   */
  report(error: Error, context?: ErrorContext): Promise<void>;
}

/**
 * Error reporter implementation
 */
class ErrorReporterImpl implements ErrorReporter {
  private options: Required<ErrorReporterOptions>;

  constructor(options: ErrorReporterOptions) {
    this.options = {
      onError: options.onError,
      includeStackTrace: options.includeStackTrace ?? true,
      includeState: options.includeState ?? false,
      rethrow: options.rethrow ?? true,
    };
  }

  wrap<State>(
    node: (state: State) => State | Promise<State> | Partial<State> | Promise<Partial<State>>,
    nodeName?: string
  ): (state: State) => Promise<State | Partial<State>> {
    return async (state: State): Promise<State | Partial<State>> => {
      try {
        return await Promise.resolve(node(state));
      } catch (error) {
        const agentError = this.toAgentError(error as Error, {
          node: nodeName,
          state: this.options.includeState ? state : undefined,
        });

        await this.report(agentError);

        if (this.options.rethrow) {
          throw agentError;
        }

        // Return state unchanged if not rethrowing
        return state;
      }
    };
  }

  async report(error: Error, context?: ErrorContext): Promise<void> {
    const agentError = this.toAgentError(error, context);

    try {
      await Promise.resolve(this.options.onError(agentError));
    } catch (reportError) {
      // Don't let error reporting errors crash the application
      console.error('Error reporting failed:', reportError);
    }
  }

  private toAgentError(error: Error, context?: ErrorContext): AgentError {
    if (error instanceof AgentError) {
      return error;
    }

    return new AgentError(error.message, {
      ...context,
      cause: error,
    });
  }
}

/**
 * Create an error reporter.
 *
 * @example
 * ```typescript
 * import { createErrorReporter } from '@agentforge/core';
 *
 * const reporter = createErrorReporter({
 *   onError: (error) => {
 *     console.error('Agent error:', error.toJSON());
 *     // Send to error tracking service
 *   },
 *   includeStackTrace: true,
 *   includeState: false,
 * });
 *
 * const safeNode = reporter.wrap(myNode, 'my-node');
 * ```
 *
 * @param options - Error reporter configuration
 * @returns An error reporter instance
 */
export function createErrorReporter(options: ErrorReporterOptions): ErrorReporter {
  return new ErrorReporterImpl(options);
}

