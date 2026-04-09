import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { generateRegistryPrompt } from '../../src/tools/registry-prompt.js';
import { ToolCategory, toolBuilder } from '../../src/index.js';

describe('registry-prompt helpers', () => {
  const readFileTool = toolBuilder()
    .name('read-file')
    .description('Read a file from disk')
    .category(ToolCategory.FILE_SYSTEM)
    .usageNotes('Paths are relative to the cwd')
    .example({
      description: 'Read a markdown file',
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
    .schema(z.object({
      url: z.string().describe('Target URL'),
    }))
    .implement(async ({ url }) => url)
    .build();

  it('groups prompt output by category when requested', () => {
    const prompt = generateRegistryPrompt([readFileTool, httpTool], {
      groupByCategory: true,
    });

    expect(prompt).toContain('FILE SYSTEM TOOLS:');
    expect(prompt).toContain('WEB TOOLS:');
    expect(prompt).toContain('read-file');
    expect(prompt).toContain('http-request');
  });

  it('renders minimal prompt output from supplementary content only', () => {
    const prompt = generateRegistryPrompt([readFileTool, httpTool], {
      minimal: true,
      includeExamples: true,
      includeNotes: true,
    });

    expect(prompt).toContain('## read-file');
    expect(prompt).toContain('Example: Read a markdown file');
    expect(prompt).toContain('Notes: Paths are relative to the cwd');
    expect(prompt).not.toContain('Read a file from disk');
    expect(prompt).not.toContain('## http-request');
  });
});
