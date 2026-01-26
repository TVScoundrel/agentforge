import { z } from 'zod';
import { toolBuilder, ToolCategory, type Tool } from '@agentforge/core';

/**
 * Sample calculator tool
 */
export const calculatorTool = toolBuilder()
  .name('calculator')
  .description('Performs basic arithmetic operations')
  .category(ToolCategory.UTILITY)
  .schema(
    z.object({
      operation: z.enum(['add', 'subtract', 'multiply', 'divide']).describe('Operation to perform'),
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
    })
  )
  .implement(async ({ operation, a, b }) => {
    switch (operation) {
      case 'add':
        return `${a + b}`;
      case 'subtract':
        return `${a - b}`;
      case 'multiply':
        return `${a * b}`;
      case 'divide':
        if (b === 0) throw new Error('Division by zero');
        return `${a / b}`;
    }
  })
  .build();

/**
 * Sample search tool
 */
export const searchTool = toolBuilder()
  .name('search')
  .description('Searches for information')
  .category(ToolCategory.WEB)
  .schema(
    z.object({
      query: z.string().describe('Search query'),
      limit: z.number().optional().describe('Maximum number of results'),
    })
  )
  .implement(async ({ query, limit = 5 }) => {
    return `Search results for "${query}" (showing ${limit} results):\n1. Result 1\n2. Result 2\n3. Result 3`;
  })
  .build();

/**
 * Sample time tool
 */
export const timeTool = toolBuilder()
  .name('get-time')
  .description('Gets the current time')
  .category(ToolCategory.UTILITY)
  .schema(z.object({ _dummy: z.string().optional().describe('Dummy field') }))
  .implement(async () => {
    return new Date().toISOString();
  })
  .build();

/**
 * Sample weather tool
 */
export const weatherTool = toolBuilder()
  .name('get-weather')
  .description('Gets weather information for a location')
  .category(ToolCategory.WEB)
  .schema(
    z.object({
      location: z.string().describe('City or location name'),
      units: z.enum(['celsius', 'fahrenheit']).optional().describe('Temperature units'),
    })
  )
  .implement(async ({ location, units = 'celsius' }) => {
    return `Weather in ${location}: Sunny, 22°${units === 'celsius' ? 'C' : 'F'}`;
  })
  .build();

/**
 * Sample file reader tool
 */
export const fileReaderTool = toolBuilder()
  .name('read-file')
  .description('Reads content from a file')
  .category(ToolCategory.FILE_SYSTEM)
  .schema(
    z.object({
      path: z.string().describe('File path'),
    })
  )
  .implement(async ({ path }) => {
    return `Content of ${path}:\nSample file content here...`;
  })
  .build();

/**
 * Sample database query tool
 */
export const databaseQueryTool = toolBuilder()
  .name('query-database')
  .description('Queries a database')
  .category(ToolCategory.DATABASE)
  .schema(
    z.object({
      query: z.string().describe('SQL query'),
    })
  )
  .implement(async ({ query }) => {
    return `Query results for: ${query}\n[{"id": 1, "name": "Sample"}]`;
  })
  .build();

/**
 * All sample tools
 */
export const sampleTools = [
  calculatorTool,
  searchTool,
  timeTool,
  weatherTool,
  fileReaderTool,
  databaseQueryTool,
];

/**
 * Get tools by category
 */
export function getToolsByCategory(category: ToolCategory) {
  return sampleTools.filter((tool) => tool.metadata.category === category);
}

/**
 * Get tool by name
 */
export function getToolByName(name: string) {
  return sampleTools.find((tool) => tool.metadata.name === name);
}

