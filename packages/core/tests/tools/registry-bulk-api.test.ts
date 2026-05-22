import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ToolCategory, ToolRegistry, toolBuilder } from '../../src/index.js';

describe('ToolRegistry bulk mutation API', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('registers multiple tools at once', () => {
    registry.registerMany([
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
    ]);

    expect(registry.size()).toBe(3);
    expect(registry.has('tool-1')).toBe(true);
    expect(registry.has('tool-2')).toBe(true);
    expect(registry.has('tool-3')).toBe(true);
  });

  it('rejects conflicting names during bulk registration', () => {
    registry.register(
      toolBuilder()
        .name('existing')
        .description('An existing tool')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ x: z.number().describe('Input') }))
        .implement(async ({ x }) => x)
        .build()
    );

    expect(() =>
      registry.registerMany([
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
      ])
    ).toThrow('Cannot register tools: the following names already exist: existing');

    expect(registry.has('new-tool')).toBe(false);
  });

  it('rejects duplicate names in the input list', () => {
    expect(() =>
      registry.registerMany([
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
      ])
    ).toThrow('Cannot register tools: duplicate names in input list: duplicate-name');

    expect(registry.has('duplicate-name')).toBe(false);
    expect(registry.has('unique-name')).toBe(false);
    expect(registry.size()).toBe(0);
  });

  it('clears all tools', () => {
    registry.registerMany([
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
    ]);

    registry.clear();

    expect(registry.size()).toBe(0);
    expect(registry.getAll()).toHaveLength(0);
  });
});
