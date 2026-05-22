import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ToolCategory, ToolRegistry, toolBuilder } from '../../src/index.js';

describe('ToolRegistry LangChain API', () => {
  it('converts a single tool to LangChain format', () => {
    const registry = new ToolRegistry();
    registry.register(
      toolBuilder()
        .name('langchain-test')
        .description('A tool for LangChain conversion testing')
        .category(ToolCategory.UTILITY)
        .schema(z.object({ input: z.string().describe('Input') }))
        .implement(async ({ input }) => input)
        .build()
    );

    const langchainTools = registry.toLangChainTools();

    expect(langchainTools).toHaveLength(1);
    expect(langchainTools[0].name).toBe('langchain-test');
    expect(langchainTools[0].description).toBe('A tool for LangChain conversion testing');
  });

  it('converts multiple tools to LangChain format', () => {
    const registry = new ToolRegistry();
    registry.registerMany([
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
    ]);

    const langchainTools = registry.toLangChainTools();

    expect(langchainTools).toHaveLength(2);
    expect(langchainTools[0].name).toBe('tool-1');
    expect(langchainTools[1].name).toBe('tool-2');
  });
});
