import { z } from 'zod';
import {
  createCalculatorTool,
  createDelayedTool,
  createEchoTool,
  createMockTool,
} from './mock-tool.js';

const defaultTool = createMockTool();
void defaultTool.invoke({ input: 'hello' });

// @ts-expect-error default mock tool input should require a string input field
void defaultTool.invoke({ input: 42 });

const inferredDefaultTool = createMockTool({
  implementation: async ({ input }) => input.toUpperCase(),
});
void inferredDefaultTool.invoke({ input: 'typed' });

const schemaDrivenTool = createMockTool({
  schema: z.object({
    count: z.number().describe('Count'),
    label: z.string().describe('Label'),
  }),
  implementation: async ({ count, label }) => `${label}:${count * 2}`,
});

void schemaDrivenTool.invoke({ count: 2, label: 'demo' });

const delayedTool = createDelayedTool();
void delayedTool.invoke({ input: 'slow' });

const echoTool = createEchoTool();
void echoTool.invoke({ message: 'hello' });

const calculatorTool = createCalculatorTool();
void calculatorTool.invoke({ operation: 'add', a: 1, b: 2 });

createMockTool({
  schema: z.object({
    count: z.number().describe('Count'),
  }),
  implementation: async (
    // @ts-expect-error schema-driven implementations should not expose arbitrary properties
    { missing }
  ) => `${missing}`,
});
