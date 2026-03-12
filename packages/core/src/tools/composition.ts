/**
 * Tool Composition - Compose tools into higher-level operations
 * @module tools/composition
 */

type RetryBackoffStrategy = 'linear' | 'exponential';

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: RetryBackoffStrategy;
}

interface CacheEntry<TOutput> {
  result: TOutput;
  timestamp: number;
}

export interface ComposedTool<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  invoke(input: TInput): Promise<TOutput>;
}

export interface ConditionalConfig<TInput = unknown, TTrueOutput = unknown, TFalseOutput = unknown> {
  condition(input: TInput): boolean | Promise<boolean>;
  onTrue: ComposedTool<TInput, TTrueOutput>;
  onFalse: ComposedTool<TInput, TFalseOutput>;
}

export type ComposedStep =
  | ComposedTool<unknown, unknown>
  | ComposedTool<unknown, unknown>[]
  | ConditionalConfig<unknown, unknown, unknown>;

export interface ComposeToolConfig<TOutput = unknown> {
  name: string;
  description?: string;
  steps: ComposedStep[];
  transformResult?: (result: unknown) => TOutput;
}

function isConditionalStep(step: ComposedStep): step is ConditionalConfig<unknown, unknown, unknown> {
  return !Array.isArray(step) && 'condition' in step;
}

function calculateRetryDelay(
  attempt: number,
  delay: number,
  backoff: RetryBackoffStrategy
): number {
  return backoff === 'exponential' ? delay * Math.pow(2, attempt - 1) : delay * attempt;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Execute tools sequentially
 */
export function sequential<TInput = unknown>(
  tools: ComposedTool<unknown, unknown>[]
): ComposedTool<TInput, unknown> {
  return {
    name: `sequential(${tools.map((t) => t.name).join(' -> ')})`,
    description: `Execute tools sequentially: ${tools.map((t) => t.name).join(' -> ')}`,
    invoke: async (input: TInput) => {
      let result: unknown = input;
      for (const tool of tools) {
        result = await tool.invoke(result);
      }
      return result;
    },
  };
}

/**
 * Execute tools in parallel
 */
export function parallel<TInput = unknown>(
  tools: ComposedTool<TInput, unknown>[]
): ComposedTool<TInput, unknown[]> {
  return {
    name: `parallel(${tools.map((t) => t.name).join(', ')})`,
    description: `Execute tools in parallel: ${tools.map((t) => t.name).join(', ')}`,
    invoke: async (input: TInput) => {
      const results = await Promise.all(tools.map((tool) => tool.invoke(input)));
      return results;
    },
  };
}

/**
 * Execute tool conditionally
 */
export function conditional<TInput = unknown, TTrueOutput = unknown, TFalseOutput = unknown>(
  config: ConditionalConfig<TInput, TTrueOutput, TFalseOutput>
): ComposedTool<TInput, TTrueOutput | TFalseOutput> {
  return {
    name: `conditional(${config.onTrue.name} | ${config.onFalse.name})`,
    description: `Conditionally execute ${config.onTrue.name} or ${config.onFalse.name}`,
    invoke: async (input: TInput) => {
      const shouldExecuteTrue = await config.condition(input);
      const tool = shouldExecuteTrue ? config.onTrue : config.onFalse;
      return await tool.invoke(input);
    },
  };
}

/**
 * Compose tools into a complex workflow
 */
export function composeTool<TInput = unknown, TOutput = unknown>(
  config: ComposeToolConfig<TOutput>
): ComposedTool<TInput, TOutput> {
  return {
    name: config.name,
    description: config.description || `Composed tool: ${config.name}`,
    invoke: async (input: TInput) => {
      let result: unknown = input;

      for (const step of config.steps) {
        if (Array.isArray(step)) {
          // Parallel execution
          result = await parallel(step).invoke(result);
        } else if (isConditionalStep(step)) {
          // Conditional execution
          result = await conditional(step).invoke(result);
        } else {
          // Sequential execution
          result = await step.invoke(result);
        }
      }

      // Transform final result if configured
      if (config.transformResult) {
        result = config.transformResult(result);
      }

      return result as TOutput;
    },
  };
}

/**
 * Create a tool that retries on failure
 */
export function retry<TInput = unknown, TOutput = unknown>(
  tool: ComposedTool<TInput, TOutput>,
  options: RetryOptions = {}
): ComposedTool<TInput, TOutput> {
  const { maxAttempts = 3, delay = 1000, backoff = 'exponential' } = options;

  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error('Invalid retry options: maxAttempts must be an integer >= 1');
  }

  return {
    name: `retry(${tool.name})`,
    description: `${tool.description} (with retry)`,
    invoke: async (input: TInput) => {
      let lastError: Error = new Error(`Tool ${tool.name} failed without an explicit error`);

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await tool.invoke(input);
        } catch (error) {
          lastError = toError(error);

          if (attempt < maxAttempts) {
            const waitTime = calculateRetryDelay(attempt, delay, backoff);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          }
        }
      }

      throw lastError;
    },
  };
}

/**
 * Create a tool that times out
 */
export function timeout<TInput = unknown, TOutput = unknown>(
  tool: ComposedTool<TInput, TOutput>,
  ms: number
): ComposedTool<TInput, TOutput> {
  return {
    name: `timeout(${tool.name})`,
    description: `${tool.description} (with ${ms}ms timeout)`,
    invoke: async (input: TInput): Promise<TOutput> => {
      let timer: ReturnType<typeof setTimeout> | undefined;

      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Tool ${tool.name} timed out after ${ms}ms`));
        }, ms);
      });

      try {
        return await Promise.race([tool.invoke(input), timeoutPromise]);
      } finally {
        if (timer !== undefined) {
          clearTimeout(timer);
        }
      }
    },
  };
}

/**
 * Create a tool that caches results
 */
export function cache<TInput = unknown, TOutput = unknown>(
  tool: ComposedTool<TInput, TOutput>,
  ttl?: number
): ComposedTool<TInput, TOutput> {
  const cacheMap = new Map<string, CacheEntry<TOutput>>();

  return {
    name: `cache(${tool.name})`,
    description: `${tool.description} (with caching)`,
    invoke: async (input: TInput) => {
      const key = JSON.stringify(input);
      const cached = cacheMap.get(key);

      if (cached) {
        if (!ttl || Date.now() - cached.timestamp < ttl) {
          return cached.result;
        }
        cacheMap.delete(key);
      }

      const result = await tool.invoke(input);
      cacheMap.set(key, { result, timestamp: Date.now() });
      return result;
    },
  };
}
