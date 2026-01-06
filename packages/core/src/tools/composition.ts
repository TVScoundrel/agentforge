/**
 * Tool Composition - Compose tools into higher-level operations
 * @module tools/composition
 */

export interface ComposedTool {
  name: string;
  description: string;
  invoke: (input: any) => Promise<any>;
}

export interface ConditionalConfig {
  condition: (input: any) => boolean | Promise<boolean>;
  onTrue: ComposedTool;
  onFalse: ComposedTool;
}

export interface ComposeToolConfig {
  name: string;
  description?: string;
  steps: Array<ComposedTool | ComposedTool[] | ConditionalConfig>;
  transformResult?: (result: any) => any;
}

/**
 * Execute tools sequentially
 */
export function sequential(tools: ComposedTool[]): ComposedTool {
  return {
    name: `sequential(${tools.map((t) => t.name).join(' -> ')})`,
    description: `Execute tools sequentially: ${tools.map((t) => t.name).join(' -> ')}`,
    invoke: async (input: any) => {
      let result = input;
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
export function parallel(tools: ComposedTool[]): ComposedTool {
  return {
    name: `parallel(${tools.map((t) => t.name).join(', ')})`,
    description: `Execute tools in parallel: ${tools.map((t) => t.name).join(', ')}`,
    invoke: async (input: any) => {
      const results = await Promise.all(tools.map((tool) => tool.invoke(input)));
      return results;
    },
  };
}

/**
 * Execute tool conditionally
 */
export function conditional(config: ConditionalConfig): ComposedTool {
  return {
    name: `conditional(${config.onTrue.name} | ${config.onFalse.name})`,
    description: `Conditionally execute ${config.onTrue.name} or ${config.onFalse.name}`,
    invoke: async (input: any) => {
      const shouldExecuteTrue = await config.condition(input);
      const tool = shouldExecuteTrue ? config.onTrue : config.onFalse;
      return await tool.invoke(input);
    },
  };
}

/**
 * Compose tools into a complex workflow
 */
export function composeTool(config: ComposeToolConfig): ComposedTool {
  return {
    name: config.name,
    description: config.description || `Composed tool: ${config.name}`,
    invoke: async (input: any) => {
      let result = input;

      for (const step of config.steps) {
        if (Array.isArray(step)) {
          // Parallel execution
          result = await parallel(step).invoke(result);
        } else if ('condition' in step) {
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

      return result;
    },
  };
}

/**
 * Create a tool that retries on failure
 */
export function retry(
  tool: ComposedTool,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: 'linear' | 'exponential';
  } = {}
): ComposedTool {
  const { maxAttempts = 3, delay = 1000, backoff = 'exponential' } = options;

  return {
    name: `retry(${tool.name})`,
    description: `${tool.description} (with retry)`,
    invoke: async (input: any) => {
      let lastError: Error | undefined;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await tool.invoke(input);
        } catch (error) {
          lastError = error as Error;

          if (attempt < maxAttempts) {
            const waitTime =
              backoff === 'exponential' ? delay * Math.pow(2, attempt - 1) : delay * attempt;
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
export function timeout(tool: ComposedTool, ms: number): ComposedTool {
  return {
    name: `timeout(${tool.name})`,
    description: `${tool.description} (with ${ms}ms timeout)`,
    invoke: async (input: any) => {
      return Promise.race([
        tool.invoke(input),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Tool ${tool.name} timed out after ${ms}ms`)), ms)
        ),
      ]);
    },
  };
}

/**
 * Create a tool that caches results
 */
export function cache(tool: ComposedTool, ttl?: number): ComposedTool {
  const cacheMap = new Map<string, { result: any; timestamp: number }>();

  return {
    name: `cache(${tool.name})`,
    description: `${tool.description} (with caching)`,
    invoke: async (input: any) => {
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

