/**
 * Tests for tool creation helpers
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  createTool,
  createToolUnsafe,
  validateTool,
  ToolCategory,
  MissingDescriptionError,
} from '../../src/tools/index.js';

describe('createTool', () => {
  it('should create a valid tool with descriptions', async () => {
    const tool = createTool(
      {
        name: 'test-tool',
        description: 'A test tool',
        category: ToolCategory.UTILITY,
      },
      z.object({
        input: z.string().describe('Test input'),
      }),
      async ({ input }) => `Result: ${input}`
    );

    expect(tool.metadata.name).toBe('test-tool');
    expect(tool.metadata.description).toBe('A test tool');
    expect(tool.metadata.category).toBe(ToolCategory.UTILITY);

    const result = await tool.execute({ input: 'hello' });
    expect(result).toBe('Result: hello');
  });

  it('should throw for schema without descriptions', () => {
    expect(() =>
      createTool(
        {
          name: 'bad-tool',
          description: 'This is a bad tool for testing',
          category: ToolCategory.UTILITY,
        },
        z.object({
          input: z.string(), // No description!
        }),
        async ({ input }) => input
      )
    ).toThrow(MissingDescriptionError);
  });

  it('should throw for invalid metadata', () => {
    expect(() =>
      createTool(
        {
          name: 'InvalidName', // Should be kebab-case
          description: 'Test',
          category: ToolCategory.UTILITY,
        },
        z.object({
          input: z.string().describe('Input'),
        }),
        async ({ input }) => input
      )
    ).toThrow('Invalid tool metadata');
  });

  it('should validate nested schema descriptions', () => {
    expect(() =>
      createTool(
        {
          name: 'nested-tool',
          description: 'Nested tool',
          category: ToolCategory.UTILITY,
        },
        z.object({
          user: z
            .object({
              name: z.string().describe('User name'),
              age: z.number(), // Missing description!
            })
            .describe('User object'),
        }),
        async ({ user }) => user
      )
    ).toThrow(MissingDescriptionError);
  });

  it('should accept optional fields with descriptions', async () => {
    const tool = createTool(
      {
        name: 'optional-tool',
        description: 'Tool with optional fields',
        category: ToolCategory.UTILITY,
      },
      z.object({
        required: z.string().describe('Required field'),
        optional: z.string().optional().describe('Optional field'),
      }),
      async ({ required, optional }) => ({ required, optional })
    );

    const result = await tool.execute({ required: 'test' });
    expect(result.required).toBe('test');
    expect(result.optional).toBeUndefined();
  });

  it('should accept arrays with described elements', async () => {
    const tool = createTool(
      {
        name: 'array-tool',
        description: 'Tool with array',
        category: ToolCategory.UTILITY,
      },
      z.object({
        items: z
          .array(z.string().describe('Item name'))
          .describe('List of items'),
      }),
      async ({ items }) => items
    );

    const result = await tool.execute({ items: ['a', 'b', 'c'] });
    expect(result).toEqual(['a', 'b', 'c']);
  });
});

describe('createToolUnsafe', () => {
  it('should create tool without schema validation', async () => {
    const tool = createToolUnsafe(
      {
        name: 'unsafe-tool',
        description: 'Unsafe tool',
        category: ToolCategory.UTILITY,
      },
      z.object({
        input: z.string(), // No description - but allowed with unsafe!
      }),
      async ({ input }) => input
    );

    expect(tool.metadata.name).toBe('unsafe-tool');
    const result = await tool.execute({ input: 'test' });
    expect(result).toBe('test');
  });

  it('should still validate metadata', () => {
    expect(() =>
      createToolUnsafe(
        {
          name: 'InvalidName', // Should be kebab-case
          description: 'Test',
          category: ToolCategory.UTILITY,
        },
        z.object({
          input: z.string(),
        }),
        async ({ input }) => input
      )
    ).toThrow('Invalid tool metadata');
  });
});

describe('validateTool', () => {
  it('should pass for valid tool', () => {
    const tool = createTool(
      {
        name: 'valid-tool',
        description: 'Valid tool',
        category: ToolCategory.UTILITY,
      },
      z.object({
        input: z.string().describe('Input'),
      }),
      async ({ input }) => input
    );

    const result = validateTool(tool);
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should fail for tool with missing schema descriptions', () => {
    const tool = createToolUnsafe(
      {
        name: 'invalid-tool',
        description: 'Invalid tool',
        category: ToolCategory.UTILITY,
      },
      z.object({
        input: z.string(), // No description
      }),
      async ({ input }) => input
    );

    const result = validateTool(tool);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Schema');
  });

  it('should report multiple errors', () => {
    const tool = {
      metadata: {
        name: 'InvalidName', // Invalid
        description: 'Test',
        category: ToolCategory.UTILITY,
      },
      schema: z.object({
        input: z.string(), // No description
      }),
      execute: async ({ input }: { input: string }) => input,
    };

    const result = validateTool(tool);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

