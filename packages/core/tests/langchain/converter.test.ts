/**
 * Tests for LangChain Integration
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  toolBuilder,
  ToolCategory,
  toLangChainTool,
  toLangChainTools,
  getToolJsonSchema,
  getToolDescription,
} from '../../src/index.js';

describe('LangChain Integration', () => {
  describe('toLangChainTool', () => {
    it('should convert a simple tool to LangChain format', async () => {
      const tool = toolBuilder()
        .name('add-numbers')
        .description('Add two numbers together')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          a: z.number().describe('First number'),
          b: z.number().describe('Second number'),
        }))
        .implement(async ({ a, b }) => a + b)
        .build();

      const langchainTool = toLangChainTool(tool);

      expect(langchainTool.name).toBe('add-numbers');
      expect(langchainTool.description).toBe('Add two numbers together');
      
      // Test execution
      const result = await langchainTool.invoke({ a: 5, b: 3 });
      expect(result).toBe('8'); // LangChain tools return strings
    });

    it('should convert object results to JSON strings', async () => {
      const tool = toolBuilder()
        .name('get-user')
        .description('Get user information')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          id: z.string().describe('User ID'),
        }))
        .implement(async ({ id }) => ({
          id,
          name: 'John Doe',
          email: 'john@example.com',
        }))
        .build();

      const langchainTool = toLangChainTool(tool);
      const result = await langchainTool.invoke({ id: '123' });
      
      expect(typeof result).toBe('string');
      const parsed = JSON.parse(result);
      expect(parsed.id).toBe('123');
      expect(parsed.name).toBe('John Doe');
    });

    it('should handle string results directly', async () => {
      const tool = toolBuilder()
        .name('greet')
        .description('Greet a user')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          name: z.string().describe('User name'),
        }))
        .implement(async ({ name }) => `Hello, ${name}!`)
        .build();

      const langchainTool = toLangChainTool(tool);
      const result = await langchainTool.invoke({ name: 'Alice' });
      
      expect(result).toBe('Hello, Alice!');
    });

    it('should convert primitive results to strings', async () => {
      const tool = toolBuilder()
        .name('is-even')
        .description('Check if a number is even')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          n: z.number().describe('Number to check'),
        }))
        .implement(async ({ n }) => n % 2 === 0)
        .build();

      const langchainTool = toLangChainTool(tool);
      const result = await langchainTool.invoke({ n: 4 });
      
      expect(result).toBe('true');
    });

    it('should preserve tool schema', () => {
      const schema = z.object({
        path: z.string().describe('File path'),
        encoding: z.string().default('utf-8').describe('File encoding'),
      });

      const tool = toolBuilder()
        .name('read-file')
        .description('Read a file')
        .category(ToolCategory.FILE_SYSTEM)
        .schema(schema)
        .implement(async ({ path }) => `Contents of ${path}`)
        .build();

      const langchainTool = toLangChainTool(tool);
      
      // The schema should be the same Zod schema
      expect(langchainTool.schema).toBe(schema);
    });
  });

  describe('toLangChainTools', () => {
    it('should convert multiple tools', () => {
      const tools = [
        toolBuilder()
          .name('tool-1')
          .description('First tool')
          .category(ToolCategory.UTILITY)
          .schema(z.object({ x: z.number().describe('Input') }))
          .implement(async ({ x }) => x * 2)
          .build(),
        toolBuilder()
          .name('tool-2')
          .description('Second tool')
          .category(ToolCategory.UTILITY)
          .schema(z.object({ y: z.string().describe('Input') }))
          .implement(async ({ y }) => y.toUpperCase())
          .build(),
      ];

      const langchainTools = toLangChainTools(tools);

      expect(langchainTools).toHaveLength(2);
      expect(langchainTools[0].name).toBe('tool-1');
      expect(langchainTools[1].name).toBe('tool-2');
    });

    it('should handle empty array', () => {
      const langchainTools = toLangChainTools([]);
      expect(langchainTools).toHaveLength(0);
    });
  });

  describe('getToolJsonSchema', () => {
    it('should generate JSON Schema from Zod schema', () => {
      const tool = toolBuilder()
        .name('test-tool')
        .description('Test tool for JSON schema generation')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          name: z.string().describe('User name'),
          age: z.number().describe('User age'),
          email: z.string().email().optional().describe('User email'),
        }))
        .implement(async (input) => input)
        .build();

      const jsonSchema = getToolJsonSchema(tool);

      expect(jsonSchema.type).toBe('object');
      expect(jsonSchema.properties).toBeDefined();
      expect(jsonSchema.properties.name).toBeDefined();
      expect(jsonSchema.properties.age).toBeDefined();
      expect(jsonSchema.properties.email).toBeDefined();
      expect(jsonSchema.required).toContain('name');
      expect(jsonSchema.required).toContain('age');
      expect(jsonSchema.required).not.toContain('email'); // Optional field
    });

    it('should handle nested objects', () => {
      const tool = toolBuilder()
        .name('nested-tool')
        .description('Tool with nested schema for testing')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          user: z.object({
            name: z.string().describe('Name'),
            email: z.string().describe('Email'),
          }).describe('User object'),
        }))
        .implement(async (input) => input)
        .build();

      const jsonSchema = getToolJsonSchema(tool);

      // The JSON schema structure depends on zod-to-json-schema implementation
      expect(jsonSchema).toBeDefined();
      expect(jsonSchema.type).toBe('object');
    });
  });

  describe('getToolDescription', () => {
    it('should generate basic description', () => {
      const tool = toolBuilder()
        .name('simple-tool')
        .description('A simple tool for testing')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ x: z.number().describe('Input') }))
        .implement(async ({ x }) => x)
        .build();

      const description = getToolDescription(tool);

      expect(description).toContain('simple-tool');
      expect(description).toContain('A simple tool for testing');
      expect(description).toContain('Category: utility');
    });

    it('should include all metadata fields', () => {
      const tool = toolBuilder()
        .name('full-tool')
        .description('A tool with all metadata')
        .category(ToolCategory.FILE_SYSTEM)
        .displayName('Full Tool')
        .tag('tag1')
        .tag('tag2')
        .usageNotes('Use this tool carefully')
        .limitation('Cannot process files larger than 10MB')
        .limitation('Requires read permissions')
        .example({
          description: 'Example 1',
          input: { path: './test.txt' },
          explanation: 'Reads a test file',
        })
        .schema(z.object({ path: z.string().describe('File path') }))
        .implement(async ({ path }) => path)
        .build();

      const description = getToolDescription(tool);

      expect(description).toContain('full-tool');
      expect(description).toContain('Display Name: Full Tool');
      expect(description).toContain('Tags: tag1, tag2');
      expect(description).toContain('Usage Notes: Use this tool carefully');
      expect(description).toContain('Limitations:');
      expect(description).toContain('Cannot process files larger than 10MB');
      expect(description).toContain('Requires read permissions');
      expect(description).toContain('Examples:');
      expect(description).toContain('Example 1');
      expect(description).toContain('Reads a test file');
    });

    it('should handle minimal metadata', () => {
      const tool = toolBuilder()
        .name('minimal-tool')
        .description('Minimal tool')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ x: z.number().describe('Input') }))
        .implement(async ({ x }) => x)
        .build();

      const description = getToolDescription(tool);

      expect(description).toContain('minimal-tool');
      expect(description).toContain('Minimal tool');
      expect(description).toContain('Category: utility');
      expect(description).not.toContain('Display Name:');
      expect(description).not.toContain('Tags:');
      expect(description).not.toContain('Usage Notes:');
      expect(description).not.toContain('Limitations:');
      expect(description).not.toContain('Examples:');
    });
  });
});

