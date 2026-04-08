import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { toolBuilder, ToolCategory } from '../../src/index.js';
import {
  getAllRegistryTools,
  getRegistryToolNames,
  getRegistryToolsByCategory,
  getRegistryToolsByTag,
  searchRegistryTools,
  type RegistryTool,
} from '../../src/tools/registry-collection.js';

function createTestTools(): ReadonlyMap<string, RegistryTool> {
  const readFileTool = toolBuilder()
    .name('read-file')
    .description('Read a file from the file system')
    .category(ToolCategory.FILE_SYSTEM)
    .tag('file')
    .tag('read')
    .schema(z.object({ path: z.string().describe('File path') }))
    .implement(async ({ path }) => path)
    .build() as RegistryTool;

  const searchFilesTool = toolBuilder()
    .name('search-files')
    .displayName('File Search')
    .description('Search for files in a directory')
    .category(ToolCategory.FILE_SYSTEM)
    .tag('file')
    .tag('search')
    .schema(z.object({ query: z.string().describe('Search query') }))
    .implement(async ({ query }) => query)
    .build() as RegistryTool;

  const httpTool = toolBuilder()
    .name('http-request')
    .displayName('HTTP Client')
    .description('Make an HTTP request')
    .category(ToolCategory.WEB)
    .tag('web')
    .tag('network')
    .schema(z.object({ url: z.string().describe('Target URL') }))
    .implement(async ({ url }) => url)
    .build() as RegistryTool;

  return new Map([
    [readFileTool.metadata.name, readFileTool],
    [searchFilesTool.metadata.name, searchFilesTool],
    [httpTool.metadata.name, httpTool],
  ]);
}

describe('registry-collection', () => {
  it('returns all tools and names in insertion order', () => {
    const tools = createTestTools();

    expect(getAllRegistryTools(tools).map((tool) => tool.metadata.name)).toEqual([
      'read-file',
      'search-files',
      'http-request',
    ]);
    expect(getRegistryToolNames(tools)).toEqual([
      'read-file',
      'search-files',
      'http-request',
    ]);
  });

  it('filters tools by category and tag', () => {
    const tools = createTestTools();

    expect(getRegistryToolsByCategory(tools, ToolCategory.FILE_SYSTEM)).toHaveLength(2);
    expect(getRegistryToolsByCategory(tools, ToolCategory.WEB)).toHaveLength(1);
    expect(getRegistryToolsByTag(tools, 'file').map((tool) => tool.metadata.name)).toEqual([
      'read-file',
      'search-files',
    ]);
    expect(getRegistryToolsByTag(tools, 'search').map((tool) => tool.metadata.name)).toEqual([
      'search-files',
    ]);
  });

  it('searches by name, display name, and description case-insensitively', () => {
    const tools = createTestTools();

    expect(searchRegistryTools(tools, 'file').map((tool) => tool.metadata.name)).toEqual([
      'read-file',
      'search-files',
    ]);
    expect(searchRegistryTools(tools, 'client').map((tool) => tool.metadata.name)).toEqual([
      'http-request',
    ]);
    expect(searchRegistryTools(tools, 'HTTP').map((tool) => tool.metadata.name)).toEqual([
      'http-request',
    ]);
  });
});
