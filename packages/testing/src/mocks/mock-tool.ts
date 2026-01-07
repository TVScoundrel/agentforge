import { z } from 'zod';
import { toolBuilder, ToolCategory } from '@agentforge/core';

/**
 * Configuration for mock tool
 */
export interface MockToolConfig<T extends z.ZodType = z.ZodType> {
  /**
   * Tool name
   */
  name?: string;

  /**
   * Tool description
   */
  description?: string;

  /**
   * Tool category
   */
  category?: ToolCategory;

  /**
   * Input schema
   */
  schema?: T;

  /**
   * Implementation function
   */
  implementation?: (input: z.infer<T>) => Promise<string> | string;

  /**
   * Whether to throw an error
   */
  shouldError?: boolean;

  /**
   * Error message to throw
   */
  errorMessage?: string;

  /**
   * Delay in milliseconds before responding
   */
  delay?: number;
}

/**
 * Create a mock tool for testing
 *
 * @example
 * ```typescript
 * const tool = createMockTool({
 *   name: 'test_tool',
 *   schema: z.object({ input: z.string().describe('Input') }),
 *   implementation: async ({ input }) => `Processed: ${input}`
 * });
 *
 * const result = await tool.execute({ input: 'test' });
 * console.log(result); // 'Processed: test'
 * ```
 */
export function createMockTool<T extends z.ZodType = any>(
  config: MockToolConfig<T> = {}
) {
  const {
    name = 'mock_tool',
    description = 'A mock tool for testing',
    category = ToolCategory.UTILITY,
    schema,
    implementation,
    shouldError = false,
    errorMessage = 'Mock tool error',
    delay = 0,
  } = config;

  const actualSchema = schema || z.object({ input: z.string().describe('Input parameter') });

  const defaultImplementation = async (input: any): Promise<string> => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    if (shouldError) {
      throw new Error(errorMessage);
    }

    return `Mock result: ${JSON.stringify(input)}`;
  };

  const actualImplementation = async (input: any): Promise<string> => {
    if (implementation) {
      const result = await Promise.resolve(implementation(input));
      return result;
    }
    return defaultImplementation(input);
  };

  return toolBuilder()
    .name(name)
    .description(description)
    .category(category)
    .schema(actualSchema)
    .implement(actualImplementation)
    .build();
}

/**
 * Create a mock tool that echoes its input
 */
export function createEchoTool(name = 'echo_tool') {
  return createMockTool({
    name,
    description: 'Echoes the input',
    schema: z.object({ message: z.string().describe('Message to echo') }),
    implementation: async ({ message }) => `Echo: ${message}`,
  });
}

/**
 * Create a mock tool that always errors
 */
export function createErrorTool(name = 'error_tool', errorMessage = 'Tool error') {
  return createMockTool({
    name,
    description: 'A tool that always errors',
    shouldError: true,
    errorMessage,
  });
}

/**
 * Create a mock tool with delay
 */
export function createDelayedTool(name = 'delayed_tool', delay = 100) {
  return createMockTool({
    name,
    description: 'A tool with artificial delay',
    delay,
    schema: z.object({ input: z.string().describe('Input parameter') }),
    implementation: async ({ input }) => `Delayed result: ${input}`,
  });
}

/**
 * Create a calculator mock tool
 */
export function createCalculatorTool() {
  return createMockTool({
    name: 'calculator',
    description: 'Performs basic arithmetic operations',
    schema: z.object({
      operation: z.enum(['add', 'subtract', 'multiply', 'divide']).describe('Operation to perform'),
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
    }),
    implementation: async ({ operation, a, b }) => {
      switch (operation) {
        case 'add':
          return `${a + b}`;
        case 'subtract':
          return `${a - b}`;
        case 'multiply':
          return `${a * b}`;
        case 'divide':
          if (b === 0) throw new Error('Division by zero');
          return `${a / b}`;
      }
    },
  });
}

