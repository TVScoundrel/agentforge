/**
 * Tests for Tool Type Definitions
 * 
 * These tests verify that our TypeScript types work correctly
 * and that Zod schemas validate as expected.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  ToolCategory,
  ToolCategorySchema,
  ToolExampleSchema,
  ToolNameSchema,
  ToolMetadataSchema,
  validateToolMetadata,
  validateToolName,
  type ToolExample,
  type ToolMetadata,
  type Tool,
} from '../../src/tools/index.js';

describe('ToolCategory', () => {
  it('should have all expected categories', () => {
    // Verify all categories exist
    expect(ToolCategory.FILE_SYSTEM).toBe('file-system');
    expect(ToolCategory.WEB).toBe('web');
    expect(ToolCategory.CODE).toBe('code');
    expect(ToolCategory.DATABASE).toBe('database');
    expect(ToolCategory.API).toBe('api');
    expect(ToolCategory.UTILITY).toBe('utility');
    expect(ToolCategory.CUSTOM).toBe('custom');
  });

  it('should validate valid categories', () => {
    // These should all pass
    expect(() => ToolCategorySchema.parse('file-system')).not.toThrow();
    expect(() => ToolCategorySchema.parse('web')).not.toThrow();
    expect(() => ToolCategorySchema.parse('code')).not.toThrow();
  });

  it('should reject invalid categories', () => {
    // These should all fail
    expect(() => ToolCategorySchema.parse('invalid')).toThrow();
    expect(() => ToolCategorySchema.parse('FILE_SYSTEM')).toThrow();
    expect(() => ToolCategorySchema.parse('')).toThrow();
    expect(() => ToolCategorySchema.parse(123)).toThrow();
  });
});

describe('ToolNameSchema', () => {
  it('should accept valid kebab-case names', () => {
    const validNames = [
      'read-file',
      'http-request',
      'query-database',
      'tool123',
      'my-tool-v2',
      'ab', // minimum length
    ];

    validNames.forEach((name) => {
      expect(() => ToolNameSchema.parse(name)).not.toThrow();
      expect(validateToolName(name)).toBe(true);
    });
  });

  it('should reject invalid names', () => {
    const invalidNames = [
      'ReadFile', // PascalCase
      'read_file', // snake_case
      'read file', // spaces
      '-read-file', // starts with hyphen
      'read-file-', // ends with hyphen
      'UPPERCASE', // uppercase
      'a', // too short
      'x'.repeat(51), // too long
      '', // empty
      '123-tool', // starts with number
    ];

    invalidNames.forEach((name) => {
      expect(() => ToolNameSchema.parse(name)).toThrow();
      expect(validateToolName(name)).toBe(false);
    });
  });
});

describe('ToolExampleSchema', () => {
  it('should accept valid examples', () => {
    const validExample: ToolExample = {
      description: 'Read a text file',
      input: { path: './README.md', encoding: 'utf-8' },
      output: '# My Project',
      explanation: 'This reads the file and returns its contents',
    };

    expect(() => ToolExampleSchema.parse(validExample)).not.toThrow();
  });

  it('should accept minimal examples', () => {
    const minimalExample: ToolExample = {
      description: 'Simple example',
      input: { foo: 'bar' },
    };

    expect(() => ToolExampleSchema.parse(minimalExample)).not.toThrow();
  });

  it('should reject invalid examples', () => {
    // Missing description
    expect(() =>
      ToolExampleSchema.parse({
        input: { foo: 'bar' },
      })
    ).toThrow();

    // Empty description
    expect(() =>
      ToolExampleSchema.parse({
        description: '',
        input: { foo: 'bar' },
      })
    ).toThrow();

    // Missing input
    expect(() =>
      ToolExampleSchema.parse({
        description: 'Test',
      })
    ).toThrow();

    // Input is not an object
    expect(() =>
      ToolExampleSchema.parse({
        description: 'Test',
        input: 'not an object',
      })
    ).toThrow();
  });
});

describe('ToolMetadataSchema', () => {
  it('should accept valid metadata with all fields', () => {
    const validMetadata: ToolMetadata = {
      name: 'read-file',
      displayName: 'Read File',
      description: 'Read the contents of a file from the file system',
      category: ToolCategory.FILE_SYSTEM,
      tags: ['file', 'read', 'io'],
      examples: [
        {
          description: 'Read a text file',
          input: { path: './README.md' },
        },
      ],
      usageNotes: 'Paths are relative to the current working directory',
      limitations: ['Cannot read files larger than 10MB'],
      version: '1.0.0',
      author: 'AgentForge Team',
      deprecated: false,
    };

    const result = validateToolMetadata(validMetadata);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validMetadata);
    }
  });

  it('should accept minimal valid metadata', () => {
    const minimalMetadata: ToolMetadata = {
      name: 'simple-tool',
      description: 'A simple tool for testing purposes',
      category: ToolCategory.UTILITY,
    };

    const result = validateToolMetadata(minimalMetadata);
    expect(result.success).toBe(true);
  });

  it('should reject metadata with invalid name', () => {
    const invalidMetadata = {
      name: 'Invalid Name', // spaces not allowed
      description: 'A tool with invalid name',
      category: ToolCategory.UTILITY,
    };

    const result = validateToolMetadata(invalidMetadata);
    expect(result.success).toBe(false);
  });

  it('should reject metadata with short description', () => {
    const invalidMetadata = {
      name: 'test-tool',
      description: 'Too short', // less than 10 characters
      category: ToolCategory.UTILITY,
    };

    const result = validateToolMetadata(invalidMetadata);
    expect(result.success).toBe(false);
  });

  it('should reject metadata with invalid version', () => {
    const invalidMetadata = {
      name: 'test-tool',
      description: 'A tool with invalid version',
      category: ToolCategory.UTILITY,
      version: 'v1.0', // should be 1.0.0
    };

    const result = validateToolMetadata(invalidMetadata);
    expect(result.success).toBe(false);
  });

  it('should accept valid semantic versions', () => {
    const validVersions = ['1.0.0', '2.1.3', '0.1.0', '10.20.30', '1.0.0-beta', '2.0.0-alpha.1'];

    validVersions.forEach((version) => {
      const metadata = {
        name: 'test-tool',
        description: 'A tool for testing versions',
        category: ToolCategory.UTILITY,
        version,
      };

      const result = validateToolMetadata(metadata);
      expect(result.success).toBe(true);
    });
  });
});

describe('Tool interface', () => {
  it('should allow creating a properly typed tool', async () => {
    // Define a simple tool with full type safety
    const readFileTool: Tool<{ path: string }, string> = {
      metadata: {
        name: 'read-file',
        description: 'Read the contents of a file from the file system',
        category: ToolCategory.FILE_SYSTEM,
      },
      schema: z.object({
        path: z.string(),
      }),
      execute: async ({ path }) => {
        // Mock implementation
        return `Contents of ${path}`;
      },
    };

    // Verify metadata is valid
    const metadataResult = validateToolMetadata(readFileTool.metadata);
    expect(metadataResult.success).toBe(true);

    // Verify schema works
    const inputResult = readFileTool.schema.safeParse({ path: './test.txt' });
    expect(inputResult.success).toBe(true);

    // Verify execution works
    const output = await readFileTool.execute({ path: './test.txt' });
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
      execute: async ({ count }) => `Counted to ${count}`,
    };

    // Valid input
    const validResult = tool.schema.safeParse({ count: 50 });
    expect(validResult.success).toBe(true);

    // Invalid input (too large)
    const invalidResult = tool.schema.safeParse({ count: 200 });
    expect(invalidResult.success).toBe(false);

    // Invalid input (wrong type)
    const wrongTypeResult = tool.schema.safeParse({ count: 'not a number' });
    expect(wrongTypeResult.success).toBe(false);
  });
});

