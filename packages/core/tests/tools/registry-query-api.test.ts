import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ToolCategory, ToolRegistry, toolBuilder } from '../../src/index.js';

describe('ToolRegistry query API', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();

    registry.register(
      toolBuilder()
        .name('read-file')
        .description('Read a file from the file system')
        .category(ToolCategory.FILE_SYSTEM)
        .tag('file')
        .tag('read')
        .schema(z.object({ path: z.string().describe('File path') }))
        .implement(async ({ path }) => path)
        .build()
    );
    registry.register(
      toolBuilder()
        .name('http-request')
        .description('Make an HTTP request')
        .category(ToolCategory.WEB)
        .tag('http')
        .tag('web')
        .schema(z.object({ url: z.string().describe('URL') }))
        .implement(async ({ url }) => url)
        .build()
    );
    registry.register(
      toolBuilder()
        .name('search-files')
        .description('Search for files in a directory')
        .category(ToolCategory.FILE_SYSTEM)
        .tag('file')
        .tag('search')
        .schema(z.object({ query: z.string().describe('Search query') }))
        .implement(async ({ query }) => query)
        .build()
    );
  });

  it('gets all tools', () => {
    expect(registry.getAll()).toHaveLength(3);
  });

  it('gets tools by category', () => {
    const fileTools = registry.getByCategory(ToolCategory.FILE_SYSTEM);
    const webTools = registry.getByCategory(ToolCategory.WEB);

    expect(fileTools).toHaveLength(2);
    expect(fileTools.every((tool) => tool.metadata.category === ToolCategory.FILE_SYSTEM)).toBe(true);
    expect(webTools).toHaveLength(1);
    expect(webTools[0].metadata.name).toBe('http-request');
  });

  it('gets tools by tag', () => {
    expect(registry.getByTag('file')).toHaveLength(2);
    expect(registry.getByTag('search')[0].metadata.name).toBe('search-files');
  });

  it('searches tools by name', () => {
    const results = registry.search('file');

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((tool) => tool.metadata.name.includes('file'))).toBe(true);
  });

  it('searches tools by description', () => {
    const results = registry.search('HTTP');

    expect(results).toHaveLength(1);
    expect(results[0].metadata.name).toBe('http-request');
  });

  it('performs case-insensitive search', () => {
    expect(registry.search('FILE').length).toBe(registry.search('file').length);
  });

  it('gets all tool names', () => {
    const names = registry.getNames();

    expect(names).toHaveLength(3);
    expect(names).toContain('read-file');
    expect(names).toContain('http-request');
    expect(names).toContain('search-files');
  });
});
