import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  ToolCategory,
  validateToolMetadata,
  type Tool,
} from '../../../src/tools/index.js';

describe('Tool interface', () => {
  it('should allow creating a properly typed tool', async () => {
    const readFileTool: Tool<{ path: string }, string> = {
      metadata: {
        name: 'read-file',
        description: 'Read the contents of a file from the file system',
        category: ToolCategory.FILE_SYSTEM,
      },
      schema: z.object({
        path: z.string(),
      }),
      invoke: async ({ path }) => `Contents of ${path}`,
    };

    const metadataResult = validateToolMetadata(readFileTool.metadata);
    expect(metadataResult.success).toBe(true);

    const inputResult = readFileTool.schema.safeParse({ path: './test.txt' });
    expect(inputResult.success).toBe(true);

    const output = await readFileTool.invoke({ path: './test.txt' });
    expect(output).toBe('Contents of ./test.txt');
  });

  it('should validate input with schema', () => {
    const tool: Tool<{ count: number }, string> = {
      metadata: {
        name: 'count-tool',
        description: 'A tool that counts to a number',
        category: ToolCategory.UTILITY,
      },
      schema: z.object({
        count: z.number().min(1).max(100),
      }),
      invoke: async ({ count }) => `Counted to ${count}`,
    };

    const validResult = tool.schema.safeParse({ count: 50 });
    expect(validResult.success).toBe(true);

    const invalidResult = tool.schema.safeParse({ count: 200 });
    expect(invalidResult.success).toBe(false);

    const wrongTypeResult = tool.schema.safeParse({ count: 'not a number' });
    expect(wrongTypeResult.success).toBe(false);
  });
});
