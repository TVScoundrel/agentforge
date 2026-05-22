import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ToolCategory, ToolRegistry, toolBuilder } from '../../src/index.js';

describe('ToolRegistry prompt API', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
    registry.register(
      toolBuilder()
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
        .schema(
          z.object({
            path: z.string().describe('File path'),
          })
        )
        .implement(async ({ path }) => path)
        .build()
    );
    registry.register(
      toolBuilder()
        .name('http-request')
        .description('Make an HTTP request')
        .category(ToolCategory.WEB)
        .tag('http')
        .schema(
          z.object({
            url: z.string().describe('URL'),
            method: z.enum(['GET', 'POST']).describe('HTTP method'),
          })
        )
        .implement(async ({ url }) => url)
        .build()
    );
  });

  it('generates a basic prompt', () => {
    const prompt = registry.generatePrompt();

    expect(prompt).toContain('Available Tools:');
    expect(prompt).toContain('read-file: Read a file from the file system');
    expect(prompt).toContain('http-request: Make an HTTP request');
  });

  it('groups tools by category', () => {
    const prompt = registry.generatePrompt({ groupByCategory: true });

    expect(prompt).toContain('FILE SYSTEM TOOLS:');
    expect(prompt).toContain('WEB TOOLS:');
    expect(prompt).toContain('read-file');
    expect(prompt).toContain('http-request');
  });

  it('includes examples when requested', () => {
    const prompt = registry.generatePrompt({ includeExamples: true });

    expect(prompt).toContain('Example: Read a text file');
    expect(prompt).toContain('Input: {"path":"./README.md"}');
  });

  it('includes usage notes when requested', () => {
    expect(registry.generatePrompt({ includeNotes: true })).toContain(
      'Notes: Paths are relative to the current working directory'
    );
  });

  it('includes limitations when requested', () => {
    const prompt = registry.generatePrompt({ includeLimitations: true });

    expect(prompt).toContain('Limitations:');
    expect(prompt).toContain('Cannot read binary files');
  });

  it('filters by categories', () => {
    const prompt = registry.generatePrompt({ categories: [ToolCategory.FILE_SYSTEM] });

    expect(prompt).toContain('read-file');
    expect(prompt).not.toContain('http-request');
  });

  it('limits examples per tool', () => {
    registry.register(
      toolBuilder()
        .name('multi-example')
        .description('A tool with many examples')
        .category(ToolCategory.UTILITY)
        .example({ description: 'Example 1', input: { x: 1 } })
        .example({ description: 'Example 2', input: { x: 2 } })
        .example({ description: 'Example 3', input: { x: 3 } })
        .schema(z.object({ x: z.number().describe('Input') }))
        .implement(async ({ x }) => x)
        .build()
    );

    const prompt = registry.generatePrompt({
      includeExamples: true,
      maxExamplesPerTool: 2,
    });

    expect((prompt.match(/Example:/g) || []).length).toBe(3);
  });

  it('returns a message when no tools are available', () => {
    expect(new ToolRegistry().generatePrompt()).toBe('No tools available.');
  });

  it('includes parameter information', () => {
    const prompt = registry.generatePrompt();

    expect(prompt).toContain('Parameters:');
    expect(prompt).toContain('path');
    expect(prompt).toContain('url');
    expect(prompt).toContain('method');
  });

  it('includes relations when requested', () => {
    registry.register(
      toolBuilder()
        .name('edit-file')
        .description('Edit a file using string replacement')
        .category(ToolCategory.FILE_SYSTEM)
        .requires(['read-file'])
        .suggests(['run-tests'])
        .follows(['search-codebase'])
        .schema(
          z.object({
            path: z.string().describe('File path'),
          })
        )
        .implement(async ({ path }) => `Editing ${path}`)
        .build()
    );

    const prompt = registry.generatePrompt({ includeRelations: true });

    expect(prompt).toContain('Requires: read-file');
    expect(prompt).toContain('Suggests: run-tests');
    expect(prompt).toContain('Follows: search-codebase');
  });

  it('does not include relations when not requested', () => {
    registry.register(
      toolBuilder()
        .name('edit-file-2')
        .description('Edit a file using string replacement')
        .category(ToolCategory.FILE_SYSTEM)
        .requires(['read-file'])
        .schema(
          z.object({
            path: z.string().describe('File path'),
          })
        )
        .implement(async ({ path }) => `Editing ${path}`)
        .build()
    );

    expect(registry.generatePrompt({ includeRelations: false })).not.toContain('Requires:');
  });

  it('generates a minimal prompt', () => {
    registry.register(
      toolBuilder()
        .name('tool-with-extras')
        .description('A tool with examples and notes')
        .category(ToolCategory.UTILITY)
        .requires(['other-tool'])
        .example({
          description: 'Example usage',
          input: { x: 1 },
        })
        .usageNotes('Some important notes')
        .schema(
          z.object({
            x: z.number().describe('Input'),
          })
        )
        .implement(async ({ x }) => x)
        .build()
    );

    const prompt = registry.generatePrompt({
      minimal: true,
      includeRelations: true,
      includeExamples: true,
      includeNotes: true,
    });

    expect(prompt).toContain('## tool-with-extras');
    expect(prompt).not.toContain('A tool with examples and notes');
    expect(prompt).not.toContain('Parameters:');
    expect(prompt).toContain('Requires: other-tool');
    expect(prompt).toContain('Example: Example usage');
    expect(prompt).toContain('Notes: Some important notes');
  });

  it('excludes tools with no supplementary content in minimal mode', () => {
    const emptyRegistry = new ToolRegistry();
    emptyRegistry.register(
      toolBuilder()
        .name('basic-tool')
        .description('A basic tool with no extras')
        .category(ToolCategory.UTILITY)
        .schema(
          z.object({
            x: z.number().describe('Input'),
          })
        )
        .implement(async ({ x }) => x)
        .build()
    );

    const prompt = emptyRegistry.generatePrompt({
      minimal: true,
      includeRelations: true,
      includeExamples: true,
    });

    expect(prompt).not.toContain('basic-tool');
  });
});
