import { z } from 'zod';
import { toolBuilder, ToolCategory, type Tool } from '@agentforge/core';

const defaultMockToolSchema = z.object({
  input: z.string().describe('Input parameter'),
});

type DefaultMockToolSchema = typeof defaultMockToolSchema;
type MockToolSchema = z.ZodTypeAny;
type MockToolInput<TSchema extends MockToolSchema> = z.infer<TSchema>;
type MockToolInstance<TSchema extends MockToolSchema> = Tool<MockToolInput<TSchema>, string>;
type MockToolConfigWithoutSchema = Omit<MockToolConfig<DefaultMockToolSchema>, 'schema'> & {
  schema?: undefined;
};
type SchemaBackedMockToolConfig<TSchema extends MockToolSchema> = MockToolConfig<TSchema> & {
  schema: TSchema;
};

/**
 * Configuration for mock tool
 */
export interface MockToolConfig<TSchema extends MockToolSchema = DefaultMockToolSchema> {
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
  schema?: TSchema;

  /**
   * Implementation function
   */
  implementation?: (input: MockToolInput<TSchema>) => Promise<string> | string;

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
 *   name: 'test-tool',
 *   schema: z.object({ input: z.string().describe('Input') }),
 *   implementation: async ({ input }) => `Processed: ${input}`
 * });
 *
 * const result = await tool.invoke({ input: 'test' });
 * console.log(result); // 'Processed: test'
 * ```
 */
function buildMockTool<TSchema extends MockToolSchema>(config: {
  name: string;
  description: string;
  category: ToolCategory;
  schema: TSchema;
  implementation?: (input: MockToolInput<TSchema>) => Promise<string> | string;
  shouldError: boolean;
  errorMessage: string;
  delay: number;
}): MockToolInstance<TSchema> {
  const { name, description, category, schema, implementation, shouldError, errorMessage, delay } =
    config;

  const defaultImplementation = async (input: MockToolInput<TSchema>): Promise<string> => {
    return `Mock result: ${JSON.stringify(input)}`;
  };

  const actualImplementation = async (input: MockToolInput<TSchema>): Promise<string> => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    if (shouldError) {
      throw new Error(errorMessage);
    }

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
    .schema(schema)
    .implement(actualImplementation)
    .build() as MockToolInstance<TSchema>;
}

export function createMockTool(): MockToolInstance<DefaultMockToolSchema>;
export function createMockTool(config: MockToolConfigWithoutSchema): MockToolInstance<DefaultMockToolSchema>;
export function createMockTool<TSchema extends MockToolSchema>(
  config: SchemaBackedMockToolConfig<TSchema>
): MockToolInstance<TSchema>;
export function createMockTool(
  config: MockToolConfigWithoutSchema | SchemaBackedMockToolConfig<MockToolSchema> = {}
): MockToolInstance<DefaultMockToolSchema> | MockToolInstance<MockToolSchema> {
  const name = config.name ?? 'mock-tool';
  const description = config.description ?? 'A mock tool for testing';
  const category = config.category ?? ToolCategory.UTILITY;
  const shouldError = config.shouldError ?? false;
  const errorMessage = config.errorMessage ?? 'Mock tool error';
  const delay = config.delay ?? 0;

  if ('schema' in config && config.schema) {
    return buildMockTool({
      name,
      description,
      category,
      schema: config.schema,
      implementation: config.implementation,
      shouldError,
      errorMessage,
      delay,
    });
  }

  return buildMockTool({
    name,
    description,
    category,
    schema: defaultMockToolSchema,
    implementation: config.implementation,
    shouldError,
    errorMessage,
    delay,
  });
}

/**
 * Create a mock tool that echoes its input
 */
export function createEchoTool(name = 'echo-tool') {
  return createMockTool({
    name: name.replace(/_/g, '-'),
    description: 'Echoes the input',
    schema: z.object({ message: z.string().describe('Message to echo') }),
    implementation: async ({ message }) => `Echo: ${message}`,
  });
}

/**
 * Create a mock tool that always errors
 */
export function createErrorTool(name = 'error-tool', errorMessage = 'Tool error') {
  return createMockTool({
    name: name.replace(/_/g, '-'),
    description: 'A tool that always errors',
    shouldError: true,
    errorMessage,
  });
}

/**
 * Create a mock tool with delay
 */
export function createDelayedTool(name = 'delayed-tool', delay = 100) {
  return createMockTool({
    name: name.replace(/_/g, '-'),
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
