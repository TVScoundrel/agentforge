/**
 * Tool Registry Example
 * 
 * This example demonstrates how to use the ToolRegistry to manage
 * and organize tools in your agent system.
 * 
 * Run this example:
 * ```bash
 * npx tsx packages/core/examples/tool-registry.ts
 * ```
 */

import { z } from 'zod';
import {
  ToolRegistry,
  RegistryEvent,
  toolBuilder,
  ToolCategory,
} from '../src/index.js';

console.log('=== Tool Registry Example ===\n');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. Create a Registry
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const registry = new ToolRegistry();

console.log('1. Created Tool Registry\n');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. Set Up Event Listeners
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

registry.on(RegistryEvent.TOOL_REGISTERED, (tool) => {
  console.log(`  ✅ Registered: ${tool.metadata.name}`);
});

registry.on(RegistryEvent.TOOL_REMOVED, (tool) => {
  console.log(`  ❌ Removed: ${tool.metadata.name}`);
});

console.log('2. Set up event listeners\n');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. Create and Register Tools
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('3. Registering tools...\n');

const readFileTool = toolBuilder()
  .name('read-file')
  .description('Read a file from the file system')
  .category(ToolCategory.FILE_SYSTEM)
  .tag('file')
  .tag('read')
  .tag('io')
  .schema(z.object({
    path: z.string().describe('Path to the file'),
  }))
  .implement(async ({ path }) => {
    return `Contents of ${path}`;
  })
  .build();

const writeFileTool = toolBuilder()
  .name('write-file')
  .description('Write content to a file')
  .category(ToolCategory.FILE_SYSTEM)
  .tag('file')
  .tag('write')
  .tag('io')
  .schema(z.object({
    path: z.string().describe('Path to the file'),
    content: z.string().describe('Content to write'),
  }))
  .implement(async ({ path, content }) => {
    return `Wrote ${content.length} bytes to ${path}`;
  })
  .build();

const httpRequestTool = toolBuilder()
  .name('http-request')
  .description('Make an HTTP request to a URL')
  .category(ToolCategory.WEB)
  .tag('http')
  .tag('web')
  .tag('api')
  .schema(z.object({
    url: z.string().url().describe('The URL to request'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET').describe('HTTP method'),
  }))
  .implement(async ({ url, method }) => {
    return `${method} ${url} - 200 OK`;
  })
  .build();

const searchTool = toolBuilder()
  .name('search-files')
  .description('Search for files matching a pattern')
  .category(ToolCategory.FILE_SYSTEM)
  .tag('file')
  .tag('search')
  .schema(z.object({
    pattern: z.string().describe('Search pattern (glob)'),
    directory: z.string().default('.').describe('Directory to search in'),
  }))
  .implement(async ({ pattern, directory }) => {
    return `Found 5 files matching ${pattern} in ${directory}`;
  })
  .build();

// Register individual tools
registry.register(readFileTool);
registry.register(writeFileTool);

// Register multiple tools at once
registry.registerMany([httpRequestTool, searchTool]);

console.log();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. Query the Registry
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('4. Querying the registry...\n');

console.log(`Total tools: ${registry.size()}`);
console.log(`Tool names: ${registry.getNames().join(', ')}`);
console.log();

// Get by category
const fileTools = registry.getByCategory(ToolCategory.FILE_SYSTEM);
console.log(`File system tools (${fileTools.length}):`);
fileTools.forEach(tool => console.log(`  - ${tool.metadata.name}`));
console.log();

// Get by tag
const ioTools = registry.getByTag('io');
console.log(`Tools tagged 'io' (${ioTools.length}):`);
ioTools.forEach(tool => console.log(`  - ${tool.metadata.name}`));
console.log();

// Search
const searchResults = registry.search('file');
console.log(`Search results for 'file' (${searchResults.length}):`);
searchResults.forEach(tool => console.log(`  - ${tool.metadata.name}: ${tool.metadata.description}`));
console.log();

