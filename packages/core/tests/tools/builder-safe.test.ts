import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ToolCategory, toolBuilder } from '../../src/tools/index.js';

describe('ToolBuilder implementSafe', () => {
  it('returns success result on successful execution', async () => {
    const tool = toolBuilder()
      .name('safe-tool')
      .description('Tool with safe implementation')
      .category(ToolCategory.UTILITY)
      .schema(
        z.object({
          value: z.string().describe('Input value'),
        }),
      )
      .implementSafe(async ({ value }) => `Processed: ${value}`)
      .build();

    const result = await tool.invoke({ value: 'test' });
    expect(result.success).toBe(true);
    expect(result.data).toBe('Processed: test');
    expect(result.error).toBeUndefined();
  });

  it('returns error result when implementation throws Error', async () => {
    const tool = toolBuilder()
      .name('failing-tool')
      .description('Tool that throws an error')
      .category(ToolCategory.UTILITY)
      .schema(
        z.object({
          shouldFail: z.boolean().describe('Whether to fail'),
        }),
      )
      .implementSafe(async ({ shouldFail }) => {
        if (shouldFail) {
          throw new Error('Something went wrong');
        }
        return 'Success';
      })
      .build();

    const result = await tool.invoke({ shouldFail: true });
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.error).toBe('Something went wrong');
  });

  it('handles non-Error exceptions', async () => {
    const tool = toolBuilder()
      .name('string-error-tool')
      .description('Tool that throws a string')
      .category(ToolCategory.UTILITY)
      .schema(
        z.object({
          input: z.string().describe('Input'),
        }),
      )
      .implementSafe(async ({ input: _input }) => {
        throw 'String error message';
      })
      .build();

    const result = await tool.invoke({ input: 'test' });
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.error).toBe('String error message');
  });

  it('handles complex return types', async () => {
    const tool = toolBuilder()
      .name('complex-safe-tool')
      .description('Tool with complex return type')
      .category(ToolCategory.UTILITY)
      .schema(
        z.object({
          name: z.string().describe('Name'),
          count: z.number().describe('Count'),
        }),
      )
      .implementSafe(async ({ name, count }) => ({
        result: name.toUpperCase(),
        doubled: count * 2,
        metadata: { processed: true },
      }))
      .build();

    const result = await tool.invoke({ name: 'test', count: 5 });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      result: 'TEST',
      doubled: 10,
      metadata: { processed: true },
    });
    expect(result.error).toBeUndefined();
  });

  it('properly types the result', async () => {
    const tool = toolBuilder()
      .name('typed-safe-tool')
      .description('Tool with typed safe result')
      .category(ToolCategory.UTILITY)
      .schema(
        z.object({
          value: z.number().describe('Value'),
        }),
      )
      .implementSafe(async ({ value }) => value * 2)
      .build();

    const result = await tool.invoke({ value: 10 });
    if (result.success) {
      expect(typeof result.data).toBe('number');
      expect(result.data).toBe(20);
    }
  });

  it('preserves chaining after implementSafe', async () => {
    const tool = toolBuilder()
      .name('safe-chain-tool')
      .description('Safe chain regression')
      .category(ToolCategory.UTILITY)
      .schema(
        z.object({
          count: z.number().describe('Count'),
        }),
      )
      .tag('safe')
      .implementSafe(async ({ count }) => count + 1)
      .example({
        description: 'Increment a value',
        input: { count: 1 },
        output: { success: true, data: 2 },
      })
      .build();

    expect(tool.metadata.tags).toEqual(['safe']);
    expect(tool.metadata.examples).toHaveLength(1);
    await expect(tool.invoke({ count: 4 })).resolves.toEqual({
      success: true,
      data: 5,
    });
  });

  it('preserves this-binding compatibility through implementSafe', async () => {
    const tool = toolBuilder()
      .name('safe-this-binding-tool')
      .description('Safe this binding regression')
      .category(ToolCategory.UTILITY)
      .schema(
        z.object({
          value: z.number().describe('Value'),
        }),
      )
      .implementSafe(async function (this: unknown, { value }) {
        return {
          sameTool: this,
          doubled: value * 2,
        };
      })
      .build();

    await expect(tool.invoke({ value: 3 })).resolves.toEqual({
      success: true,
      data: {
        sameTool: tool,
        doubled: 6,
      },
    });
  });
});
