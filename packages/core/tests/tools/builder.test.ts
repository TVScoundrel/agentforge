/**
 * Tests for Tool Builder API
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  toolBuilder,
  ToolBuilder,
  ToolCategory,
  MissingDescriptionError,
} from '../../src/tools/index.js';

describe('ToolBuilder', () => {
  describe('basic usage', () => {
    it('should create a simple tool', async () => {
      const tool = toolBuilder()
        .name('test-tool')
        .description('A test tool for testing')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          input: z.string().describe('Test input'),
        }))
        .implement(async ({ input }) => `Result: ${input}`)
        .build();

      expect(tool.metadata.name).toBe('test-tool');
      expect(tool.metadata.description).toBe('A test tool for testing');
      expect(tool.metadata.category).toBe(ToolCategory.UTILITY);

      const result = await tool.execute({ input: 'hello' });
      expect(result).toBe('Result: hello');
    });

    it('should create a tool with all optional fields', async () => {
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
        .schema(z.object({
          path: z.string().describe('File path'),
        }))
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
  });

  describe('fluent API', () => {
    it('should support method chaining', () => {
      const builder = toolBuilder()
        .name('chain-test')
        .description('Testing method chaining')
        .category(ToolCategory.UTILITY);

      expect(builder).toBeInstanceOf(ToolBuilder);
    });

    it('should support adding tags one at a time', () => {
      const tool = toolBuilder()
        .name('tag-test')
        .description('Testing tag addition')
        .category(ToolCategory.UTILITY)
        .tag('tag1')
        .tag('tag2')
        .tag('tag3')
        .schema(z.object({
          input: z.string().describe('Input'),
        }))
        .implement(async ({ input }) => input)
        .build();

      expect(tool.metadata.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should support adding limitations one at a time', () => {
      const tool = toolBuilder()
        .name('limit-test')
        .description('Testing limitation addition')
        .category(ToolCategory.UTILITY)
        .limitation('Limit 1')
        .limitation('Limit 2')
        .schema(z.object({
          input: z.string().describe('Input'),
        }))
        .implement(async ({ input }) => input)
        .build();

      expect(tool.metadata.limitations).toEqual(['Limit 1', 'Limit 2']);
    });

    it('should support adding examples', () => {
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
        .schema(z.object({
          value: z.string().describe('Value'),
        }))
        .implement(async ({ value }) => value)
        .build();

      expect(tool.metadata.examples).toHaveLength(2);
      expect(tool.metadata.examples?.[0].description).toBe('Example 1');
      expect(tool.metadata.examples?.[1].description).toBe('Example 2');
    });
  });

  describe('validation', () => {
    it('should throw if name is missing', () => {
      expect(() =>
        toolBuilder()
          .description('Missing name')
          .category(ToolCategory.UTILITY)
          .schema(z.object({ input: z.string().describe('Input') }))
          .implement(async ({ input }) => input)
          .build()
      ).toThrow('Tool name is required');
    });

    it('should throw if description is missing', () => {
      expect(() =>
        toolBuilder()
          .name('no-description')
          .category(ToolCategory.UTILITY)
          .schema(z.object({ input: z.string().describe('Input') }))
          .implement(async ({ input }) => input)
          .build()
      ).toThrow('Tool description is required');
    });

    it('should throw if category is missing', () => {
      expect(() =>
        toolBuilder()
          .name('no-category')
          .description('Missing category')
          .schema(z.object({ input: z.string().describe('Input') }))
          .implement(async ({ input }) => input)
          .build()
      ).toThrow('Tool category is required');
    });

    it('should throw if schema is missing', () => {
      expect(() =>
        toolBuilder()
          .name('no-schema')
          .description('Missing schema')
          .category(ToolCategory.UTILITY)
          .implement(async ({ input }: any) => input)
          .build()
      ).toThrow('Tool schema is required');
    });

    it('should throw if implementation is missing', () => {
      expect(() =>
        toolBuilder()
          .name('no-impl')
          .description('Missing implementation')
          .category(ToolCategory.UTILITY)
          .schema(z.object({ input: z.string().describe('Input') }))
          .build()
      ).toThrow('Tool implementation is required');
    });

    it('should validate metadata (invalid name format)', () => {
      expect(() =>
        toolBuilder()
          .name('InvalidName') // Should be kebab-case
          .description('Testing invalid name')
          .category(ToolCategory.UTILITY)
          .schema(z.object({ input: z.string().describe('Input') }))
          .implement(async ({ input }) => input)
          .build()
      ).toThrow('Invalid tool metadata');
    });

    it('should validate schema descriptions', () => {
      expect(() =>
        toolBuilder()
          .name('no-descriptions')
          .description('Testing missing descriptions')
          .category(ToolCategory.UTILITY)
          .schema(z.object({
            input: z.string(), // Missing .describe()!
          }))
          .implement(async ({ input }) => input)
          .build()
      ).toThrow(MissingDescriptionError);
    });
  });

  describe('type safety', () => {
    it('should infer types from schema', async () => {
      const tool = toolBuilder()
        .name('typed-tool')
        .description('Tool with type inference')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          name: z.string().describe('Name'),
          age: z.number().describe('Age'),
        }))
        .implement(async ({ name, age }) => {
          // TypeScript should know the types here
          const nameUpper: string = name.toUpperCase();
          const ageDouble: number = age * 2;
          return { nameUpper, ageDouble };
        })
        .build();

      const result = await tool.execute({ name: 'test', age: 25 });
      expect(result.nameUpper).toBe('TEST');
      expect(result.ageDouble).toBe(50);
    });

    it('should handle complex schemas', async () => {
      const tool = toolBuilder()
        .name('complex-tool')
        .description('Tool with complex schema')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          user: z.object({
            name: z.string().describe('User name'),
            email: z.string().describe('User email'),
          }).describe('User object'),
          tags: z.array(z.string().describe('Tag')).describe('Tags'),
          count: z.number().optional().describe('Count'),
        }))
        .implement(async ({ user, tags, count }) => ({
          user,
          tags,
          count: count ?? 0,
        }))
        .build();

      const result = await tool.execute({
        user: { name: 'John', email: 'john@example.com' },
        tags: ['tag1', 'tag2'],
      });

      expect(result.user.name).toBe('John');
      expect(result.tags).toEqual(['tag1', 'tag2']);
      expect(result.count).toBe(0);
    });
  });
});

