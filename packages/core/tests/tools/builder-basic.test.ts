import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ToolBuilder, ToolCategory, toolBuilder } from '../../src/tools/index.js';

describe('ToolBuilder basic API', () => {
  it('creates a simple tool', async () => {
    const tool = toolBuilder()
      .name('test-tool')
      .description('A test tool for testing')
      .category(ToolCategory.UTILITY)
      .schema(
        z.object({
          input: z.string().describe('Test input'),
        }),
      )
      .implement(async ({ input }) => `Result: ${input}`)
      .build();

    expect(tool.metadata.name).toBe('test-tool');
    expect(tool.metadata.description).toBe('A test tool for testing');
    expect(tool.metadata.category).toBe(ToolCategory.UTILITY);
    await expect(tool.invoke({ input: 'hello' })).resolves.toBe('Result: hello');
  });

  it('creates a tool with optional metadata fields', async () => {
    const tool = toolBuilder()
      .name('full-tool')
      .description('A tool with all fields')
      .category(ToolCategory.FILE_SYSTEM)
      .displayName('Full Tool')
      .tags(['tag1', 'tag2'])
      .example({
        description: 'Example usage',
        input: { path: './test.txt' },
      })
      .usageNotes('Some usage notes')
      .limitations(['Limitation 1', 'Limitation 2'])
      .version('1.0.0')
      .author('Test Author')
      .schema(
        z.object({
          path: z.string().describe('File path'),
        }),
      )
      .implement(async ({ path }) => `Reading ${path}`)
      .build();

    expect(tool.metadata.displayName).toBe('Full Tool');
    expect(tool.metadata.tags).toEqual(['tag1', 'tag2']);
    expect(tool.metadata.examples).toHaveLength(1);
    expect(tool.metadata.usageNotes).toBe('Some usage notes');
    expect(tool.metadata.limitations).toEqual(['Limitation 1', 'Limitation 2']);
    expect(tool.metadata.version).toBe('1.0.0');
    expect(tool.metadata.author).toBe('Test Author');
  });

  it('supports method chaining', () => {
    const builder = toolBuilder()
      .name('chain-test')
      .description('Testing method chaining')
      .category(ToolCategory.UTILITY);

    expect(builder).toBeInstanceOf(ToolBuilder);
  });
});
