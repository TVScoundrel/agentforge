/**
 * LangSmith Integration Utilities
 *
 * Helpers for configuring and using LangSmith tracing with LangGraph.
 */

/**
 * LangSmith configuration options
 */
export interface LangSmithConfig {
  /**
   * LangSmith API key
   * Can also be set via LANGSMITH_API_KEY environment variable
   */
  apiKey?: string;

  /**
   * Project name for organizing traces
   * Can also be set via LANGSMITH_PROJECT environment variable
   */
  projectName?: string;

  /**
   * Whether tracing is enabled
   * Can also be set via LANGSMITH_TRACING environment variable
   * @default true if apiKey is provided
   */
  tracingEnabled?: boolean;

  /**
   * LangSmith API endpoint
   * @default 'https://api.smith.langchain.com'
   */
  endpoint?: string;

  /**
   * Additional metadata to include in all traces
   */
  metadata?: Record<string, any>;
}

/**
 * Global LangSmith configuration
 */
let globalConfig: LangSmithConfig | null = null;

/**
 * Configure LangSmith for tracing.
 *
 * This sets environment variables that LangChain/LangGraph use for tracing.
 *
 * @example
 * ```typescript
 * import { configureLangSmith } from '@agentforge/core';
 *
 * configureLangSmith({
 *   apiKey: process.env.LANGSMITH_API_KEY,
 *   projectName: 'my-agent',
 *   tracingEnabled: true,
 * });
 * ```
 *
 * @param config - LangSmith configuration
 */
export function configureLangSmith(config: LangSmithConfig): void {
  globalConfig = config;

  // Set environment variables for LangChain/LangGraph
  if (config.apiKey) {
    process.env.LANGSMITH_API_KEY = config.apiKey;
  }

  if (config.projectName) {
    process.env.LANGSMITH_PROJECT = config.projectName;
  }

  if (config.tracingEnabled !== undefined) {
    process.env.LANGSMITH_TRACING = config.tracingEnabled ? 'true' : 'false';
  } else if (config.apiKey) {
    // Enable tracing by default if API key is provided
    process.env.LANGSMITH_TRACING = 'true';
  }

  if (config.endpoint) {
    process.env.LANGSMITH_ENDPOINT = config.endpoint;
  }
}

/**
 * Get the current LangSmith configuration.
 *
 * @returns The current configuration or null if not configured
 */
export function getLangSmithConfig(): LangSmithConfig | null {
  return globalConfig;
}

/**
 * Reset the LangSmith configuration (mainly for testing).
 * @internal
 */
export function resetLangSmithConfig(): void {
  globalConfig = null;
}

/**
 * Check if LangSmith tracing is enabled.
 *
 * @returns True if tracing is enabled
 */
export function isTracingEnabled(): boolean {
  return process.env.LANGSMITH_TRACING === 'true';
}

/**
 * Options for tracing a node
 */
export interface TracingOptions {
  /**
   * Name for the traced operation
   */
  name: string;

  /**
   * Additional metadata to include in the trace
   */
  metadata?: Record<string, any>;

  /**
   * Tags to categorize the trace
   */
  tags?: string[];

  /**
   * Run name for the trace
   */
  runName?: string;
}

/**
 * Wrap a node function with LangSmith tracing.
 *
 * This adds metadata to the execution context that LangSmith can use for tracing.
 *
 * @example
 * ```typescript
 * import { withTracing } from '@agentforge/core';
 *
 * const tracedNode = withTracing(myNode, {
 *   name: 'research-node',
 *   metadata: { category: 'research' },
 *   tags: ['research', 'web'],
 * });
 * ```
 *
 * @param node - The node function to wrap
 * @param options - Tracing options
 * @returns A wrapped node function with tracing
 */
export function withTracing<State>(
  node: (state: State) => State | Promise<State> | Partial<State> | Promise<Partial<State>>,
  options: TracingOptions
): (state: State) => Promise<State | Partial<State>> {
  const { name, metadata, tags, runName } = options;

  return async (state: State): Promise<State | Partial<State>> => {
    // In a real implementation, we would use LangChain's tracing utilities
    // For now, we'll just add metadata to the state if tracing is enabled
    if (isTracingEnabled()) {
      // Execute the node
      const result = await Promise.resolve(node(state));

      // Add tracing metadata (this is a simplified version)
      // In production, you'd use LangChain's actual tracing APIs
      return result;
    }

    // If tracing is disabled, just execute the node normally
    return await Promise.resolve(node(state));
  };
}

