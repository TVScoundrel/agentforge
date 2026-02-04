/**
 * Tool Builder Example
 * 
 * This example demonstrates the fluent Tool Builder API,
 * which provides a more ergonomic way to create tools.
 * 
 * Run this example:
 * ```bash
 * npx tsx packages/core/examples/tool-builder.ts
 * ```
 */

import { z } from 'zod';
import { toolBuilder, ToolCategory } from '../src/tools/index.js';

/**
 * Example 1: Simple Tool with Builder
 * 
 * Compare this to manually creating the tool object!
 */
const calculatorTool = toolBuilder()
  .name('multiply-numbers')
  .description('Multiply two numbers together and return the result')
  .category(ToolCategory.UTILITY)
  .schema(z.object({
    a: z.number().describe('First number to multiply'),
    b: z.number().describe('Second number to multiply'),
  }))
  .implement(async ({ a, b }) => a * b)
  .build();

/**
 * Example 2: Tool with All Optional Fields
 * 
 * Shows how to use the full builder API with all features.
 */
const searchFilesTool = toolBuilder()
  // Required fields
  .name('search-files')
  .description('Search for files in a directory matching a pattern')
  .category(ToolCategory.FILE_SYSTEM)
  
  // Optional metadata
  .displayName('Search Files')
  .version('1.0.0')
  .author('AgentForge Team')
  
  // Tags for searchability
  .tag('file')
  .tag('search')
  .tag('filesystem')
  
  // Usage examples
  .example({
    description: 'Search for TypeScript files',
    input: {
      directory: './src',
      pattern: '*.ts',
      recursive: true,
    },
    explanation: 'Finds all .ts files in src directory and subdirectories',
  })
  .example({
    description: 'Search for test files',
    input: {
      directory: './tests',
      pattern: '*.test.ts',
      recursive: false,
    },
    explanation: 'Finds test files only in the tests directory (not subdirectories)',
  })
  
  // Usage notes and limitations
  .usageNotes('Patterns support wildcards (* and ?). Paths are relative to current working directory.')
  .limitation('Cannot search files larger than 10MB')
  .limitation('Requires read permissions on the directory')
  .limitation('Maximum 1000 results returned')
  
  // Schema with detailed descriptions
  .schema(z.object({
    directory: z
      .string()
      .describe('Directory path to search, relative to current working directory'),
    pattern: z
      .string()
      .describe('File name pattern to match. Supports wildcards: * (any characters) and ? (single character)'),
    recursive: z
      .boolean()
      .default(false)
      .describe('Whether to search subdirectories recursively. Defaults to false.'),
    maxResults: z
      .number()
      .min(1)
      .max(1000)
      .optional()
      .describe('Maximum number of results to return (1-1000). Defaults to 100.'),
  }))
  
  // Implementation
  .implement(async ({ directory, pattern, recursive, maxResults = 100 }) => {
    // Mock implementation
    return {
      directory,
      pattern,
      recursive,
      maxResults,
      results: [
        `${directory}/file1.ts`,
        `${directory}/file2.ts`,
      ],
    };
  })
  
  .build();

/**
 * Example 3: Building Tools Programmatically
 * 
 * Shows how to create tools dynamically based on configuration.
 */
function createHttpTool(method: 'GET' | 'POST' | 'PUT' | 'DELETE') {
  return toolBuilder()
    .name(`http-${method.toLowerCase()}`)
    .description(`Make an HTTP ${method} request`)
    .category(ToolCategory.WEB)
    .tag('http')
    .tag('api')
    .tag(method.toLowerCase())
    .schema(z.object({
      url: z.string().url().describe('URL to send the request to'),
      headers: z
        .record(z.string())
        .optional()
        .describe('HTTP headers to include in the request'),
      ...(method === 'POST' || method === 'PUT' ? {
        body: z.unknown().optional().describe('Request body (JSON)'),
      } : {}),
    }))
    .implement(async ({ url, headers, ...rest }) => {
      return {
        method,
        url,
        headers,
        ...rest,
        status: 200,
        data: { mock: 'response' },
      };
    })
    .build();
}

const httpGetTool = createHttpTool('GET');
const httpPostTool = createHttpTool('POST');

/**
 * Main function - demonstrates using the tools
 */
async function main() {
  console.log('=== Tool Builder Examples ===\n');

  // Example 1: Calculator
  console.log('1. Calculator Tool (Simple)');
  console.log('   Name:', calculatorTool.metadata.name);
  console.log('   Description:', calculatorTool.metadata.description);
  
  const calcResult = await calculatorTool.invoke({ a: 6, b: 7 });
  console.log(`   Result: 6 × 7 = ${calcResult}\n`);

  // Example 2: File Search
  console.log('2. Search Files Tool (Full Featured)');
  console.log('   Name:', searchFilesTool.metadata.name);
  console.log('   Display Name:', searchFilesTool.metadata.displayName);
  console.log('   Tags:', searchFilesTool.metadata.tags);
  console.log('   Examples:', searchFilesTool.metadata.examples?.length);
  console.log('   Limitations:', searchFilesTool.metadata.limitations?.length);
  
  const searchResult = await searchFilesTool.invoke({
    directory: './src',
    pattern: '*.ts',
    recursive: true,
  });
  console.log('   Results:', searchResult.results);
  console.log();

  // Example 3: Dynamic Tools
  console.log('3. Programmatically Created Tools');
  console.log('   HTTP GET:', httpGetTool.metadata.name);
  console.log('   HTTP POST:', httpPostTool.metadata.name);
  
  const getResult = await httpGetTool.invoke({
    url: 'https://api.example.com/data',
    headers: { 'Authorization': 'Bearer token' },
  });
  console.log('   GET Result:', getResult);

  console.log('\n✅ All examples completed!');
  console.log('\n💡 Key Benefits of Builder API:');
  console.log('   - Fluent, readable syntax');
  console.log('   - Automatic validation');
  console.log('   - Type inference from schema');
  console.log('   - Easy to add optional fields');
  console.log('   - Great for programmatic tool creation');
}

// Run the examples
main().catch(console.error);

