/**
 * Tests for Tool Registry
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import {
  ToolRegistry,
  RegistryEvent,
  toolBuilder,
  ToolCategory,
} from '../../src/index.js';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  describe('CRUD Operations', () => {
    it('should register a tool', () => {
      const tool = toolBuilder()
        .name('test-tool')
        .description('A test tool for testing')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      registry.register(tool);

      expect(registry.has('test-tool')).toBe(true);
      expect(registry.size()).toBe(1);
    });

    it('should throw error when registering duplicate tool', () => {
      const tool = toolBuilder()
        .name('duplicate')
        .description('A duplicate tool for testing')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      registry.register(tool);

      expect(() => registry.register(tool)).toThrow(
        'Tool with name "duplicate" is already registered'
      );
    });

    it('should get a registered tool', () => {
      const tool = toolBuilder()
        .name('get-test')
        .description('A test tool for getting')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      registry.register(tool);

      const retrieved = registry.get('get-test');
      expect(retrieved).toBeDefined();
      expect(retrieved?.metadata.name).toBe('get-test');
    });

    it('should return undefined for non-existent tool', () => {
      const tool = registry.get('non-existent');
      expect(tool).toBeUndefined();
    });

    it('should check if tool exists', () => {
      const tool = toolBuilder()
        .name('exists-test')
        .description('A test tool for existence check')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      expect(registry.has('exists-test')).toBe(false);
      registry.register(tool);
      expect(registry.has('exists-test')).toBe(true);
    });

    it('should remove a tool', () => {
      const tool = toolBuilder()
        .name('remove-test')
        .description('A test tool for removal')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      registry.register(tool);
      expect(registry.has('remove-test')).toBe(true);

      const removed = registry.remove('remove-test');
      expect(removed).toBe(true);
      expect(registry.has('remove-test')).toBe(false);
      expect(registry.size()).toBe(0);
    });

    it('should return false when removing non-existent tool', () => {
      const removed = registry.remove('non-existent');
      expect(removed).toBe(false);
    });

    it('should update an existing tool', () => {
      const tool1 = toolBuilder()
        .name('update-test')
        .description('Original tool description')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      const tool2 = toolBuilder()
        .name('update-test')
        .description('Updated tool description')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input.toUpperCase())
        .build();

      registry.register(tool1);
      const updated = registry.update('update-test', tool2);

      expect(updated).toBe(true);
      const retrieved = registry.get('update-test');
      expect(retrieved?.metadata.description).toBe('Updated tool description');
    });

    it('should return false when updating non-existent tool', () => {
      const tool = toolBuilder()
        .name('non-existent')
        .description('A non-existent tool')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      const updated = registry.update('non-existent', tool);
      expect(updated).toBe(false);
    });

    it('should prevent desync when tool is renamed via update', () => {
      // Register a tool with original name
      const tool1 = toolBuilder()
        .name('original-name')
        .description('Original tool')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      registry.register(tool1);

      // Try to update with a tool that has a different name
      const tool2 = toolBuilder()
        .name('renamed-tool')
        .description('Renamed tool')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input.toUpperCase())
        .build();

      // Should throw an error to prevent desync
      expect(() => {
        registry.update('original-name', tool2);
      }).toThrow(/Cannot update tool: metadata\.name "renamed-tool" does not match registry key "original-name"/);

      // Verify the original tool is still in place and unchanged
      const retrieved = registry.get('original-name');
      expect(retrieved).toBeDefined();
      expect(retrieved?.metadata.name).toBe('original-name');
      expect(retrieved?.metadata.description).toBe('Original tool');

      // Verify the new name doesn't exist
      expect(registry.has('renamed-tool')).toBe(false);
    });
  });

  describe('Query Operations', () => {
    beforeEach(() => {
      // Register some test tools
      const fileTool = toolBuilder()
        .name('read-file')
        .description('Read a file from the file system')
        .category(ToolCategory.FILE_SYSTEM)
        .tag('file')
        .tag('read')
        .schema(z.object({ path: z.string().describe('File path') }))
        .implement(async ({ path }) => path)
        .build();

      const webTool = toolBuilder()
        .name('http-request')
        .description('Make an HTTP request')
        .category(ToolCategory.WEB)
        .tag('http')
        .tag('web')
        .schema(z.object({ url: z.string().describe('URL') }))
        .implement(async ({ url }) => url)
        .build();

      const searchTool = toolBuilder()
        .name('search-files')
        .description('Search for files in a directory')
        .category(ToolCategory.FILE_SYSTEM)
        .tag('file')
        .tag('search')
        .schema(z.object({ query: z.string().describe('Search query') }))
        .implement(async ({ query }) => query)
        .build();

      registry.register(fileTool);
      registry.register(webTool);
      registry.register(searchTool);
    });

    it('should get all tools', () => {
      const allTools = registry.getAll();
      expect(allTools).toHaveLength(3);
    });

    it('should get tools by category', () => {
      const fileTools = registry.getByCategory(ToolCategory.FILE_SYSTEM);
      expect(fileTools).toHaveLength(2);
      expect(fileTools.every(t => t.metadata.category === ToolCategory.FILE_SYSTEM)).toBe(true);

      const webTools = registry.getByCategory(ToolCategory.WEB);
      expect(webTools).toHaveLength(1);
      expect(webTools[0].metadata.name).toBe('http-request');
    });

    it('should get tools by tag', () => {
      const fileTagged = registry.getByTag('file');
      expect(fileTagged).toHaveLength(2);

      const searchTagged = registry.getByTag('search');
      expect(searchTagged).toHaveLength(1);
      expect(searchTagged[0].metadata.name).toBe('search-files');
    });

    it('should search tools by name', () => {
      const results = registry.search('file');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.metadata.name.includes('file'))).toBe(true);
    });

    it('should search tools by description', () => {
      const results = registry.search('HTTP');
      expect(results).toHaveLength(1);
      expect(results[0].metadata.name).toBe('http-request');
    });

    it('should perform case-insensitive search', () => {
      const results1 = registry.search('FILE');
      const results2 = registry.search('file');
      expect(results1.length).toBe(results2.length);
    });

    it('should get all tool names', () => {
      const names = registry.getNames();
      expect(names).toHaveLength(3);
      expect(names).toContain('read-file');
      expect(names).toContain('http-request');
      expect(names).toContain('search-files');
    });
  });

  describe('Bulk Operations', () => {
    it('should register multiple tools at once', () => {
      const tools = [
        toolBuilder()
          .name('tool-1')
          .description('First tool for bulk registration')
          .category(ToolCategory.UTILITY)
          .schema(z.object({ x: z.number().describe('Input') }))
          .implement(async ({ x }) => x)
          .build(),
        toolBuilder()
          .name('tool-2')
          .description('Second tool for bulk registration')
          .category(ToolCategory.UTILITY)
          .schema(z.object({ y: z.string().describe('Input') }))
          .implement(async ({ y }) => y)
          .build(),
        toolBuilder()
          .name('tool-3')
          .description('Third tool for bulk registration')
          .category(ToolCategory.UTILITY)
          .schema(z.object({ z: z.boolean().describe('Input') }))
          .implement(async ({ z }) => z)
          .build(),
      ];

      registry.registerMany(tools);

      expect(registry.size()).toBe(3);
      expect(registry.has('tool-1')).toBe(true);
      expect(registry.has('tool-2')).toBe(true);
      expect(registry.has('tool-3')).toBe(true);
    });

    it('should throw error if any tool conflicts during bulk registration', () => {
      const tool1 = toolBuilder()
        .name('existing')
        .description('An existing tool')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ x: z.number().describe('Input') }))
        .implement(async ({ x }) => x)
        .build();

      registry.register(tool1);

      const tools = [
        toolBuilder()
          .name('new-tool')
          .description('A new tool')
          .category(ToolCategory.UTILITY)
          .schema(z.object({ x: z.number().describe('Input') }))
          .implement(async ({ x }) => x)
          .build(),
        toolBuilder()
          .name('existing')
          .description('Duplicate tool')
          .category(ToolCategory.UTILITY)
          .schema(z.object({ x: z.number().describe('Input') }))
          .implement(async ({ x }) => x)
          .build(),
      ];

      expect(() => registry.registerMany(tools)).toThrow(
        'Cannot register tools: the following names already exist: existing'
      );

      // Should not have registered any of the tools
      expect(registry.has('new-tool')).toBe(false);
    });

    it('should throw error if input list contains duplicate names', () => {
      const tools = [
        toolBuilder()
          .name('duplicate-name')
          .description('First tool with duplicate name')
          .category(ToolCategory.UTILITY)
          .schema(z.object({ x: z.number().describe('Input') }))
          .implement(async ({ x }) => x)
          .build(),
        toolBuilder()
          .name('unique-name')
          .description('A unique tool')
          .category(ToolCategory.UTILITY)
          .schema(z.object({ y: z.string().describe('Input') }))
          .implement(async ({ y }) => y)
          .build(),
        toolBuilder()
          .name('duplicate-name')
          .description('Second tool with duplicate name')
          .category(ToolCategory.UTILITY)
          .schema(z.object({ z: z.boolean().describe('Input') }))
          .implement(async ({ z }) => z)
          .build(),
      ];

      expect(() => registry.registerMany(tools)).toThrow(
        'Cannot register tools: duplicate names in input list: duplicate-name'
      );

      // Should not have registered any of the tools
      expect(registry.has('duplicate-name')).toBe(false);
      expect(registry.has('unique-name')).toBe(false);
      expect(registry.size()).toBe(0);
    });

    it('should clear all tools', () => {
      const tools = [
        toolBuilder()
          .name('tool-1')
          .description('First tool to be cleared')
          .category(ToolCategory.UTILITY)
          .schema(z.object({ x: z.number().describe('Input') }))
          .implement(async ({ x }) => x)
          .build(),
        toolBuilder()
          .name('tool-2')
          .description('Second tool to be cleared')
          .category(ToolCategory.UTILITY)
          .schema(z.object({ y: z.string().describe('Input') }))
          .implement(async ({ y }) => y)
          .build(),
      ];

      registry.registerMany(tools);
      expect(registry.size()).toBe(2);

      registry.clear();
      expect(registry.size()).toBe(0);
      expect(registry.getAll()).toHaveLength(0);
    });
  });

  describe('Event System', () => {
    it('should emit event when tool is registered', () => {
      const handler = vi.fn();
      registry.on(RegistryEvent.TOOL_REGISTERED, handler);

      const tool = toolBuilder()
        .name('event-test')
        .description('A tool for event testing')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      registry.register(tool);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(tool);
    });

    it('should emit event when tool is removed', () => {
      const handler = vi.fn();

      const tool = toolBuilder()
        .name('remove-event-test')
        .description('A tool for removal event testing')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      registry.register(tool);
      registry.on(RegistryEvent.TOOL_REMOVED, handler);
      registry.remove('remove-event-test');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(tool);
    });

    it('should emit event when tool is updated', () => {
      const handler = vi.fn();

      const tool1 = toolBuilder()
        .name('update-event-test')
        .description('Original tool')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      const tool2 = toolBuilder()
        .name('update-event-test')
        .description('Updated tool')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input.toUpperCase())
        .build();

      registry.register(tool1);
      registry.on(RegistryEvent.TOOL_UPDATED, handler);
      registry.update('update-event-test', tool2);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({
        name: 'update-event-test',
        tool: tool2,
      });
    });

    it('should emit event when registry is cleared', () => {
      const handler = vi.fn();
      registry.on(RegistryEvent.REGISTRY_CLEARED, handler);

      const tool = toolBuilder()
        .name('clear-event-test')
        .description('A tool for clear event testing')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      registry.register(tool);
      registry.clear();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support multiple handlers for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      registry.on(RegistryEvent.TOOL_REGISTERED, handler1);
      registry.on(RegistryEvent.TOOL_REGISTERED, handler2);

      const tool = toolBuilder()
        .name('multi-handler-test')
        .description('A tool for multiple handler testing')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      registry.register(tool);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should remove event handler', () => {
      const handler = vi.fn();

      registry.on(RegistryEvent.TOOL_REGISTERED, handler);
      registry.off(RegistryEvent.TOOL_REGISTERED, handler);

      const tool = toolBuilder()
        .name('off-test')
        .description('A tool for handler removal testing')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      registry.register(tool);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should not throw if handler throws error', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const goodHandler = vi.fn();

      registry.on(RegistryEvent.TOOL_REGISTERED, errorHandler);
      registry.on(RegistryEvent.TOOL_REGISTERED, goodHandler);

      const tool = toolBuilder()
        .name('error-handler-test')
        .description('A tool for error handler testing')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      // Should not throw
      expect(() => registry.register(tool)).not.toThrow();

      // Both handlers should have been called
      expect(errorHandler).toHaveBeenCalled();
      expect(goodHandler).toHaveBeenCalled();
    });
  });

  describe('LangChain Integration', () => {
    it('should convert tools to LangChain format', () => {
      const tool = toolBuilder()
        .name('langchain-test')
        .description('A tool for LangChain conversion testing')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build();

      registry.register(tool);

      const langchainTools = registry.toLangChainTools();

      expect(langchainTools).toHaveLength(1);
      expect(langchainTools[0].name).toBe('langchain-test');
      expect(langchainTools[0].description).toBe('A tool for LangChain conversion testing');
    });

    it('should convert multiple tools to LangChain format', () => {
      const tools = [
        toolBuilder()
          .name('tool-1')
          .description('First tool')
          .category(ToolCategory.UTILITY)
          .schema(z.object({ x: z.number().describe('Input') }))
          .implement(async ({ x }) => x)
          .build(),
        toolBuilder()
          .name('tool-2')
          .description('Second tool')
          .category(ToolCategory.UTILITY)
          .schema(z.object({ y: z.string().describe('Input') }))
          .implement(async ({ y }) => y)
          .build(),
      ];

      registry.registerMany(tools);

      const langchainTools = registry.toLangChainTools();

      expect(langchainTools).toHaveLength(2);
      expect(langchainTools[0].name).toBe('tool-1');
      expect(langchainTools[1].name).toBe('tool-2');
    });
  });

  describe('Prompt Generation', () => {
    beforeEach(() => {
      const readFileTool = toolBuilder()
        .name('read-file')
        .description('Read a file from the file system')
        .category(ToolCategory.FILE_SYSTEM)
        .tag('file')
        .usageNotes('Paths are relative to the current working directory')
        .limitation('Cannot read binary files')
        .example({
          description: 'Read a text file',
          input: { path: './README.md' },
        })
        .schema(z.object({
          path: z.string().describe('File path'),
        }))
        .implement(async ({ path }) => path)
        .build();

      const httpTool = toolBuilder()
        .name('http-request')
        .description('Make an HTTP request')
        .category(ToolCategory.WEB)
        .tag('http')
        .schema(z.object({
          url: z.string().describe('URL'),
          method: z.enum(['GET', 'POST']).describe('HTTP method'),
        }))
        .implement(async ({ url }) => url)
        .build();

      registry.register(readFileTool);
      registry.register(httpTool);
    });

    it('should generate basic prompt', () => {
      const prompt = registry.generatePrompt();

      expect(prompt).toContain('Available Tools:');
      expect(prompt).toContain('read-file: Read a file from the file system');
      expect(prompt).toContain('http-request: Make an HTTP request');
    });

    it('should group tools by category', () => {
      const prompt = registry.generatePrompt({ groupByCategory: true });

      expect(prompt).toContain('FILE SYSTEM TOOLS:');
      expect(prompt).toContain('WEB TOOLS:');
      expect(prompt).toContain('read-file');
      expect(prompt).toContain('http-request');
    });

    it('should include examples when requested', () => {
      const prompt = registry.generatePrompt({ includeExamples: true });

      expect(prompt).toContain('Example: Read a text file');
      expect(prompt).toContain('Input: {"path":"./README.md"}');
    });

    it('should include usage notes when requested', () => {
      const prompt = registry.generatePrompt({ includeNotes: true });

      expect(prompt).toContain('Notes: Paths are relative to the current working directory');
    });

    it('should include limitations when requested', () => {
      const prompt = registry.generatePrompt({ includeLimitations: true });

      expect(prompt).toContain('Limitations:');
      expect(prompt).toContain('Cannot read binary files');
    });

    it('should filter by categories', () => {
      const prompt = registry.generatePrompt({
        categories: [ToolCategory.FILE_SYSTEM],
      });

      expect(prompt).toContain('read-file');
      expect(prompt).not.toContain('http-request');
    });

    it('should limit examples per tool', () => {
      const toolWithManyExamples = toolBuilder()
        .name('multi-example')
        .description('A tool with many examples')
        .category(ToolCategory.UTILITY)
        .example({ description: 'Example 1', input: { x: 1 } })
        .example({ description: 'Example 2', input: { x: 2 } })
        .example({ description: 'Example 3', input: { x: 3 } })
        .schema(z.object({ x: z.number().describe('Input') }))
        .implement(async ({ x }) => x)
        .build();

      registry.register(toolWithManyExamples);

      const prompt = registry.generatePrompt({
        includeExamples: true,
        maxExamplesPerTool: 2,
      });

      const exampleCount = (prompt.match(/Example:/g) || []).length;
      // Should have 2 examples from multi-example tool + 1 from read-file = 3 total
      expect(exampleCount).toBe(3);
    });

    it('should return message when no tools available', () => {
      const emptyRegistry = new ToolRegistry();
      const prompt = emptyRegistry.generatePrompt();

      expect(prompt).toBe('No tools available.');
    });

    it('should include parameter information', () => {
      const prompt = registry.generatePrompt();

      expect(prompt).toContain('Parameters:');
      expect(prompt).toContain('path');
      expect(prompt).toContain('url');
      expect(prompt).toContain('method');
    });

    it('should include relations when requested', () => {
      const editFileTool = toolBuilder()
        .name('edit-file')
        .description('Edit a file using string replacement')
        .category(ToolCategory.FILE_SYSTEM)
        .requires(['read-file'])
        .suggests(['run-tests'])
        .follows(['search-codebase'])
        .schema(z.object({
          path: z.string().describe('File path'),
        }))
        .implement(async ({ path }) => `Editing ${path}`)
        .build();

      registry.register(editFileTool);

      const prompt = registry.generatePrompt({ includeRelations: true });

      expect(prompt).toContain('Requires: read-file');
      expect(prompt).toContain('Suggests: run-tests');
      expect(prompt).toContain('Follows: search-codebase');
    });

    it('should not include relations when not requested', () => {
      const editFileTool = toolBuilder()
        .name('edit-file-2')
        .description('Edit a file using string replacement')
        .category(ToolCategory.FILE_SYSTEM)
        .requires(['read-file'])
        .schema(z.object({
          path: z.string().describe('File path'),
        }))
        .implement(async ({ path }) => `Editing ${path}`)
        .build();

      registry.register(editFileTool);

      const prompt = registry.generatePrompt({ includeRelations: false });

      expect(prompt).not.toContain('Requires:');
    });

    it('should generate minimal prompt', () => {
      const toolWithExtras = toolBuilder()
        .name('tool-with-extras')
        .description('A tool with examples and notes')
        .category(ToolCategory.UTILITY)
        .requires(['other-tool'])
        .example({
          description: 'Example usage',
          input: { x: 1 },
        })
        .usageNotes('Some important notes')
        .schema(z.object({
          x: z.number().describe('Input'),
        }))
        .implement(async ({ x }) => x)
        .build();

      registry.register(toolWithExtras);

      const prompt = registry.generatePrompt({
        minimal: true,
        includeRelations: true,
        includeExamples: true,
        includeNotes: true,
      });

      // Should use ## header format
      expect(prompt).toContain('## tool-with-extras');

      // Should NOT include basic description/parameters (those come from API)
      expect(prompt).not.toContain('A tool with examples and notes');
      expect(prompt).not.toContain('Parameters:');

      // Should include supplementary context
      expect(prompt).toContain('Requires: other-tool');
      expect(prompt).toContain('Example: Example usage');
      expect(prompt).toContain('Notes: Some important notes');
    });

    it('should exclude tools with no supplementary content in minimal mode', () => {
      const basicTool = toolBuilder()
        .name('basic-tool')
        .description('A basic tool with no extras')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          x: z.number().describe('Input'),
        }))
        .implement(async ({ x }) => x)
        .build();

      const emptyRegistry = new ToolRegistry();
      emptyRegistry.register(basicTool);

      const prompt = emptyRegistry.generatePrompt({
        minimal: true,
        includeRelations: true,
        includeExamples: true,
      });

      // Should not include the tool since it has no supplementary content
      expect(prompt).not.toContain('basic-tool');
    });
  });
});
