import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ToolCategory, toolBuilder } from '../../src/tools/index.js';

describe('ToolBuilder metadata API', () => {
  it('supports adding tags one at a time', () => {
    const tool = toolBuilder()
      .name('tag-test')
      .description('Testing tag addition')
      .category(ToolCategory.UTILITY)
      .tag('tag1')
      .tag('tag2')
      .tag('tag3')
      .schema(
        z.object({
          input: z.string().describe('Input'),
        }),
      )
      .implement(async ({ input }) => input)
      .build();

    expect(tool.metadata.tags).toEqual(['tag1', 'tag2', 'tag3']);
  });

  it('supports adding limitations one at a time', () => {
    const tool = toolBuilder()
      .name('limit-test')
      .description('Testing limitation addition')
      .category(ToolCategory.UTILITY)
      .limitation('Limit 1')
      .limitation('Limit 2')
      .schema(
        z.object({
          input: z.string().describe('Input'),
        }),
      )
      .implement(async ({ input }) => input)
      .build();

    expect(tool.metadata.limitations).toEqual(['Limit 1', 'Limit 2']);
  });

  it('supports adding examples', () => {
    const tool = toolBuilder()
      .name('example-test')
      .description('Testing example addition')
      .category(ToolCategory.UTILITY)
      .example({
        description: 'Example 1',
        input: { value: 'test1' },
      })
      .example({
        description: 'Example 2',
        input: { value: 'test2' },
      })
      .schema(
        z.object({
          value: z.string().describe('Value'),
        }),
      )
      .implement(async ({ value }) => value)
      .build();

    expect(tool.metadata.examples).toHaveLength(2);
    expect(tool.metadata.examples?.[0].description).toBe('Example 1');
    expect(tool.metadata.examples?.[1].description).toBe('Example 2');
  });

  it('isolates metadata when branching into typed builders', async () => {
    const sharedExampleInput = {
      flag: true,
      nested: { value: 'original' },
    };

    const baseBuilder = toolBuilder()
      .name('isolated-builder')
      .description('Metadata isolation regression')
      .category(ToolCategory.UTILITY)
      .tag('base')
      .example({
        description: 'Base example',
        input: sharedExampleInput,
      });

    const schemaBuilder = baseBuilder.schema(
      z.object({
        flag: z.boolean().describe('Feature flag'),
      }),
    );
    const invokeBuilder = schemaBuilder.implement(async ({ flag }) => flag);
    const safeBuilder = schemaBuilder.implementSafe(async ({ flag }) => String(flag));

    baseBuilder.tag('base-only');
    schemaBuilder.tag('schema-only');
    invokeBuilder.example({
      description: 'Invoke example',
      input: { flag: false },
    });
    safeBuilder.limitation('safe-only');

    const invokeTool = invokeBuilder.build();
    const safeTool = safeBuilder.build();
    const lateSchemaTool = schemaBuilder.implement(async ({ flag }) => flag).build();

    expect(invokeTool.metadata.tags).toEqual(['base']);
    expect(invokeTool.metadata.examples).toHaveLength(2);
    expect(safeTool.metadata.tags).toEqual(['base']);
    expect(safeTool.metadata.examples).toHaveLength(1);
    expect(safeTool.metadata.limitations).toEqual(['safe-only']);
    expect(lateSchemaTool.metadata.tags).toEqual(['base', 'schema-only']);

    sharedExampleInput.nested.value = 'mutated';
    expect(invokeTool.metadata.examples?.[0].input).toEqual({
      flag: true,
      nested: { value: 'original' },
    });
    expect(safeTool.metadata.examples?.[0].input).toEqual({
      flag: true,
      nested: { value: 'original' },
    });

    await expect(safeTool.invoke({ flag: true })).resolves.toEqual({
      success: true,
      data: 'true',
    });
  });
});
