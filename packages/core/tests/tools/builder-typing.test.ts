import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ToolCategory, toolBuilder } from '../../src/tools/index.js';

describe('ToolBuilder typing behavior', () => {
  it('infers types from schema', async () => {
    const tool = toolBuilder()
      .name('typed-tool')
      .description('Tool with type inference')
      .category(ToolCategory.UTILITY)
      .schema(
        z.object({
          name: z.string().describe('Name'),
          age: z.number().describe('Age'),
        }),
      )
      .implement(async ({ name, age }) => {
        const nameUpper: string = name.toUpperCase();
        const ageDouble: number = age * 2;
        return { nameUpper, ageDouble };
      })
      .build();

    const result = await tool.invoke({ name: 'test', age: 25 });
    expect(result.nameUpper).toBe('TEST');
    expect(result.ageDouble).toBe(50);
  });

  it('handles complex schemas', async () => {
    const tool = toolBuilder()
      .name('complex-tool')
      .description('Tool with complex schema')
      .category(ToolCategory.UTILITY)
      .schema(
        z.object({
          user: z
            .object({
              name: z.string().describe('User name'),
              email: z.string().describe('User email'),
            })
            .describe('User object'),
          tags: z.array(z.string().describe('Tag')).describe('Tags'),
          count: z.number().optional().describe('Count'),
        }),
      )
      .implement(async ({ user, tags, count }) => ({
        user,
        tags,
        count: count ?? 0,
      }))
      .build();

    const result = await tool.invoke({
      user: { name: 'John', email: 'john@example.com' },
      tags: ['tag1', 'tag2'],
    });

    expect(result.user.name).toBe('John');
    expect(result.tags).toEqual(['tag1', 'tag2']);
    expect(result.count).toBe(0);
  });

  it('preserves typed chaining after schema then implement', async () => {
    const tool = toolBuilder()
      .name('schema-chain-tool')
      .description('Schema chain typing regression')
      .category(ToolCategory.UTILITY)
      .schema(
        z.object({
          enabled: z.boolean().describe('Enabled flag'),
          retries: z.number().describe('Retry count'),
        }),
      )
      .implement(async ({ enabled, retries }) => ({
        enabled,
        nextRetry: retries + 1,
      }))
      .build();

    await expect(tool.invoke({ enabled: true, retries: 2 })).resolves.toEqual({
      enabled: true,
      nextRetry: 3,
    });
  });

  it('preserves built tool behavior when implement runs before schema', async () => {
    const tool = toolBuilder()
      .name('invoke-first-chain-tool')
      .description('Invoke first chain regression')
      .category(ToolCategory.UTILITY)
      .implement(async (input: unknown) => ({ input }))
      .schema(
        z.object({
          path: z.string().describe('Path'),
        }),
      )
      .build();

    await expect(tool.invoke({ path: '/tmp/demo.txt' })).resolves.toEqual({
      input: { path: '/tmp/demo.txt' },
    });
  });

  it('preserves invoke this-binding compatibility', async () => {
    const tool = toolBuilder()
      .name('this-binding-tool')
      .description('This binding regression')
      .category(ToolCategory.UTILITY)
      .schema(
        z.object({
          value: z.string().describe('Value'),
        }),
      )
      .implement(async function (this: unknown, { value }) {
        return {
          sameTool: this,
          echoed: value,
        };
      })
      .build();

    const result = await tool.invoke({ value: 'demo' });
    expect(result.echoed).toBe('demo');
    expect(result.sameTool).toBe(tool);
  });
});
