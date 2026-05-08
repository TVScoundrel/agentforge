/**
 * Tool Mocking & Testing - Mock tools for testing
 * @module tools/testing
 */

type MockToolMatcher<TInput> = TInput | ((input: TInput) => boolean);

interface MockToolSuccessResponse<TInput, TOutput> {
  input: MockToolMatcher<TInput>;
  output: TOutput;
  error?: never;
}

interface MockToolErrorResponse<TInput> {
  input: MockToolMatcher<TInput>;
  output?: never;
  error: Error;
}

export type MockToolResponse<TInput = unknown, TOutput = unknown> =
  | MockToolSuccessResponse<TInput, TOutput>
  | MockToolErrorResponse<TInput>;

export interface MockToolConfig<
  TName extends string = string,
  TInput = unknown,
  TOutput = unknown,
> {
  name: TName;
  description?: string;
  responses?: MockToolResponse<TInput, TOutput>[];
  defaultResponse?: TOutput;
  latency?: { min: number; max: number } | number;
  errorRate?: number;
}

export interface ToolInvocation<TInput = unknown, TOutput = unknown> {
  input: TInput;
  output?: TOutput;
  error?: Error;
  timestamp: number;
  duration: number;
}

export interface SimulatedTool<TName extends string = string, TInput = unknown, TOutput = unknown> {
  name: TName;
  invoke(input: TInput): Promise<TOutput>;
}

type ToolName<TTools extends readonly SimulatedTool[]> = TTools[number]['name'] & string;
type ToolByName<TTools extends readonly SimulatedTool[], TName extends ToolName<TTools>> = Extract<
  TTools[number],
  { name: TName }
>;
type ToolInputFor<TTools extends readonly SimulatedTool[], TName extends ToolName<TTools>> =
  ToolByName<TTools, TName> extends SimulatedTool<string, infer TInput, unknown> ? TInput : never;
type ToolOutputFor<TTools extends readonly SimulatedTool[], TName extends ToolName<TTools>> =
  ToolByName<TTools, TName> extends SimulatedTool<string, unknown, infer TOutput> ? TOutput : never;

export interface ToolSimulatorConfig<TTools extends readonly SimulatedTool[] = readonly SimulatedTool[]> {
  tools: TTools;
  errorRate?: number;
  latency?: { mean: number; stddev: number };
  recordInvocations?: boolean;
}

export interface MockTool<TName extends string = string, TInput = unknown, TOutput = unknown>
  extends SimulatedTool<TName, TInput, TOutput> {
  description: string;
  getInvocations: () => ToolInvocation<TInput, TOutput>[];
  clearInvocations: () => void;
}

function matchesMockInput<TInput>(matcher: MockToolMatcher<TInput>, input: TInput): boolean {
  if (typeof matcher === 'function') {
    return (matcher as (input: TInput) => boolean)(input);
  }

  return JSON.stringify(matcher) === JSON.stringify(input);
}

/**
 * Create a mock tool for testing
 */
export function createMockTool<
  TName extends string,
  TInput = unknown,
  TOutput = unknown,
>(config: MockToolConfig<TName, TInput, TOutput>): MockTool<TName, TInput, TOutput> {
  const {
    name,
    description = `Mock tool: ${name}`,
    responses = [],
    defaultResponse,
    latency,
    errorRate = 0,
  } = config;

  const invocations: ToolInvocation<TInput, TOutput>[] = [];

  return {
    name,
    description,
    invoke: async (input: TInput) => {
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
      const matchingResponse = responses.find((response) => matchesMockInput(response.input, input));

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
export function createToolSimulator<const TTools extends readonly SimulatedTool[]>(
  config: ToolSimulatorConfig<TTools>
) {
  const { tools, errorRate = 0, latency, recordInvocations = true } = config;

  const toolMap = new Map(tools.map((t) => [t.name, t]));
  const invocations = new Map<string, ToolInvocation<unknown, unknown>[]>();

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
    execute: async <TName extends ToolName<TTools>>(
      toolName: TName,
      input: ToolInputFor<TTools, TName>
    ): Promise<ToolOutputFor<TTools, TName>> => {
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
        return result as ToolOutputFor<TTools, TName>;
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
    getInvocations: <TName extends ToolName<TTools>>(toolName: TName): ToolInvocation<
      ToolInputFor<TTools, TName>,
      ToolOutputFor<TTools, TName>
    >[] => {
      const toolInvocations = invocations.get(toolName) ?? [];
      return [...toolInvocations] as ToolInvocation<
        ToolInputFor<TTools, TName>,
        ToolOutputFor<TTools, TName>
      >[];
    },
    getAllInvocations: () => {
      const all: Partial<Record<ToolName<TTools>, ToolInvocation<unknown, unknown>[]>> = {};
      invocations.forEach((invs, name) => {
        all[name as ToolName<TTools>] = [...invs];
      });
      return all;
    },
    clearInvocations: (toolName?: ToolName<TTools>) => {
      if (toolName) {
        invocations.get(toolName)?.splice(0);
      } else {
        invocations.forEach((invs) => invs.splice(0));
      }
    },
  };
}
