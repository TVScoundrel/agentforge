/**
 * Tool Mocking & Testing - Mock tools for testing
 * @module tools/testing
 */

export interface MockToolResponse {
  input: any;
  output?: any;
  error?: Error;
}

export interface MockToolConfig {
  name: string;
  description?: string;
  responses?: MockToolResponse[];
  defaultResponse?: any;
  latency?: { min: number; max: number } | number;
  errorRate?: number;
}

export interface ToolInvocation {
  input: any;
  output?: any;
  error?: Error;
  timestamp: number;
  duration: number;
}

export interface ToolSimulatorConfig {
  tools: Array<{ name: string; invoke: (input: any) => Promise<any> }>;
  errorRate?: number;
  latency?: { mean: number; stddev: number };
  recordInvocations?: boolean;
}

/**
 * Create a mock tool for testing
 */
export function createMockTool(config: MockToolConfig) {
  const {
    name,
    description = `Mock tool: ${name}`,
    responses = [],
    defaultResponse,
    latency,
    errorRate = 0,
  } = config;

  const invocations: ToolInvocation[] = [];

  return {
    name,
    description,
    invoke: async (input: any) => {
      const startTime = Date.now();

      // Simulate latency
      if (latency) {
        const delay =
          typeof latency === 'number'
            ? latency
            : Math.random() * (latency.max - latency.min) + latency.min;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Simulate random errors
      if (errorRate > 0 && Math.random() < errorRate) {
        const error = new Error(`Random error from ${name}`);
        invocations.push({
          input,
          error,
          timestamp: startTime,
          duration: Date.now() - startTime,
        });
        throw error;
      }

      // Find matching response
      const matchingResponse = responses.find((r) => {
        if (typeof r.input === 'function') {
          return r.input(input);
        }
        return JSON.stringify(r.input) === JSON.stringify(input);
      });

      if (matchingResponse) {
        if (matchingResponse.error) {
          invocations.push({
            input,
            error: matchingResponse.error,
            timestamp: startTime,
            duration: Date.now() - startTime,
          });
          throw matchingResponse.error;
        }

        invocations.push({
          input,
          output: matchingResponse.output,
          timestamp: startTime,
          duration: Date.now() - startTime,
        });
        return matchingResponse.output;
      }

      // Use default response
      if (defaultResponse !== undefined) {
        invocations.push({
          input,
          output: defaultResponse,
          timestamp: startTime,
          duration: Date.now() - startTime,
        });
        return defaultResponse;
      }

      // No matching response
      const error = new Error(`No mock response configured for input: ${JSON.stringify(input)}`);
      invocations.push({
        input,
        error,
        timestamp: startTime,
        duration: Date.now() - startTime,
      });
      throw error;
    },
    getInvocations: () => [...invocations],
    clearInvocations: () => {
      invocations.length = 0;
    },
  };
}

/**
 * Create a tool simulator for testing
 */
export function createToolSimulator(config: ToolSimulatorConfig) {
  const { tools, errorRate = 0, latency, recordInvocations = true } = config;

  const toolMap = new Map(tools.map((t) => [t.name, t]));
  const invocations = new Map<string, ToolInvocation[]>();

  // Initialize invocation tracking
  if (recordInvocations) {
    tools.forEach((t) => invocations.set(t.name, []));
  }

  /**
   * Generate latency based on normal distribution
   */
  function generateLatency(): number {
    if (!latency) return 0;

    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    return Math.max(0, latency.mean + z * latency.stddev);
  }

  return {
    execute: async (toolName: string, input: any) => {
      const tool = toolMap.get(toolName);
      if (!tool) {
        throw new Error(`Tool ${toolName} not found in simulator`);
      }

      const startTime = Date.now();

      // Simulate latency
      if (latency) {
        const delay = generateLatency();
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Simulate random errors
      if (errorRate > 0 && Math.random() < errorRate) {
        const error = new Error(`Simulated error from ${toolName}`);
        if (recordInvocations) {
          invocations.get(toolName)!.push({
            input,
            error,
            timestamp: startTime,
            duration: Date.now() - startTime,
          });
        }
        throw error;
      }

      try {
        const result = await tool.invoke(input);
        if (recordInvocations) {
          invocations.get(toolName)!.push({
            input,
            output: result,
            timestamp: startTime,
            duration: Date.now() - startTime,
          });
        }
        return result;
      } catch (error) {
        if (recordInvocations) {
          invocations.get(toolName)!.push({
            input,
            error: error as Error,
            timestamp: startTime,
            duration: Date.now() - startTime,
          });
        }
        throw error;
      }
    },
    getInvocations: (toolName: string) => {
      return invocations.get(toolName) ? [...invocations.get(toolName)!] : [];
    },
    getAllInvocations: () => {
      const all: Record<string, ToolInvocation[]> = {};
      invocations.forEach((invs, name) => {
        all[name] = [...invs];
      });
      return all;
    },
    clearInvocations: (toolName?: string) => {
      if (toolName) {
        invocations.get(toolName)?.splice(0);
      } else {
        invocations.forEach((invs) => invs.splice(0));
      }
    },
  };
}

