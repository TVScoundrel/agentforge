import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ToolCategory, ToolRegistry, toolBuilder } from '../../src/index.js';

describe('ToolRegistry CRUD API', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('registers a tool', () => {
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

  it('throws when registering a duplicate tool', () => {
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

  it('gets a registered tool', () => {
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

  it('returns undefined for a non-existent tool', () => {
    expect(registry.get('non-existent')).toBeUndefined();
  });

  it('checks if a tool exists', () => {
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

  it('removes a tool', () => {
    const tool = toolBuilder()
      .name('remove-test')
      .description('A test tool for removal')
      .category(ToolCategory.UTILITY)
      .schema(z.object({ input: z.string().describe('Input') }))
      .implement(async ({ input }) => input)
      .build();

    registry.register(tool);

    expect(registry.remove('remove-test')).toBe(true);
    expect(registry.has('remove-test')).toBe(false);
    expect(registry.size()).toBe(0);
  });

  it('returns false when removing a non-existent tool', () => {
    expect(registry.remove('non-existent')).toBe(false);
  });

  it('updates an existing tool', () => {
    const original = toolBuilder()
      .name('update-test')
      .description('Original tool description')
      .category(ToolCategory.UTILITY)
      .schema(z.object({ input: z.string().describe('Input') }))
      .implement(async ({ input }) => input)
      .build();
    const updatedTool = toolBuilder()
      .name('update-test')
      .description('Updated tool description')
      .category(ToolCategory.UTILITY)
      .schema(z.object({ input: z.string().describe('Input') }))
      .implement(async ({ input }) => input.toUpperCase())
      .build();

    registry.register(original);

    expect(registry.update('update-test', updatedTool)).toBe(true);
    expect(registry.get('update-test')?.metadata.description).toBe('Updated tool description');
  });

  it('returns false when updating a non-existent tool', () => {
    const tool = toolBuilder()
      .name('non-existent')
      .description('A non-existent tool')
      .category(ToolCategory.UTILITY)
      .schema(z.object({ input: z.string().describe('Input') }))
      .implement(async ({ input }) => input)
      .build();

    expect(registry.update('non-existent', tool)).toBe(false);
  });

  it('prevents update name desync', () => {
    const original = toolBuilder()
      .name('original-name')
      .description('Original tool')
      .category(ToolCategory.UTILITY)
      .schema(z.object({ input: z.string().describe('Input') }))
      .implement(async ({ input }) => input)
      .build();
    const renamed = toolBuilder()
      .name('renamed-tool')
      .description('Renamed tool')
      .category(ToolCategory.UTILITY)
      .schema(z.object({ input: z.string().describe('Input') }))
      .implement(async ({ input }) => input.toUpperCase())
      .build();

    registry.register(original);

    expect(() => registry.update('original-name', renamed)).toThrow(
      /Cannot update tool: metadata\.name "renamed-tool" does not match registry key "original-name"/
    );
    expect(registry.get('original-name')?.metadata.name).toBe('original-name');
    expect(registry.has('renamed-tool')).toBe(false);
  });
});
