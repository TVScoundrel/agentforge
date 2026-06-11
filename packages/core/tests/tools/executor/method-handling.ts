import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createToolExecutor } from '../../../src/tools/executor.js';
import { toolBuilder, ToolCategory } from '../../../src/tools/index.js';

describe('Tool Executor method handling', () => {
  it('should execute tool with only execute method', async () => {
    const tool = toolBuilder()
      .name('execute-only-tool')
      .description('Tool with only execute method')
      .category(ToolCategory.UTILITY)
      .schema(
        z.object({
          input: z.string().describe('Test input'),
        })
      )
      .implement(async ({ input }) => `Result: ${input}`)
      .build();

    const executor = createToolExecutor();
    const result = await executor.execute(tool, { input: 'hello' });

    expect(result).toBe('Result: hello');
  });

  it('should execute tool with only invoke method', async () => {
    const tool = {
      name: 'invoke-only-tool',
      invoke: async (input: string) => `LangChain result: ${input}`,
    };

    const executor = createToolExecutor();
    const result = await executor.execute(tool, 'test');

    expect(result).toBe('LangChain result: test');
  });

  it('should prefer invoke over execute when both are present', async () => {
    const tool = {
      name: 'both-methods-tool',
      execute: async (input: string) => `Execute: ${input}`,
      invoke: async (input: string) => `Invoke: ${input}`,
    };

    const executor = createToolExecutor();
    const result = await executor.execute(tool, 'test');

    expect(result).toBe('Invoke: test');
  });

  it('should throw error for tool with neither execute nor invoke', async () => {
    const tool = {
      name: 'invalid-tool',
    };

    const executor = createToolExecutor();

    await expect(executor.execute(tool, 'test')).rejects.toThrow(
      'Tool must implement invoke() method'
    );
  });

  it('should preserve this context when calling execute', async () => {
    const tool = {
      name: 'context-tool',
      value: 'test-value',
      execute: async function (this: { value: string }, input: string) {
        return `${this.value}: ${input}`;
      },
    };

    const executor = createToolExecutor();
    const result = await executor.execute(tool, 'hello');

    expect(result).toBe('test-value: hello');
  });

  it('should preserve this context when calling invoke', async () => {
    const tool = {
      name: 'context-tool',
      value: 'test-value',
      invoke: async function (this: { value: string }, input: string) {
        return `${this.value}: ${input}`;
      },
    };

    const executor = createToolExecutor();
    const result = await executor.execute(tool, 'hello');

    expect(result).toBe('test-value: hello');
  });
});
