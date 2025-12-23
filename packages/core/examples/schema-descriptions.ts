/**
 * Schema Descriptions Example
 * 
 * This example demonstrates how to add descriptions to schema fields
 * so that LLMs can understand what each argument does.
 * 
 * Run this example:
 * ```bash
 * npx tsx packages/core/examples/schema-descriptions.ts
 * ```
 */

import { z } from 'zod';
import { Tool, ToolCategory } from '../src/tools/index.js';

/**
 * Example 1: Schema WITHOUT descriptions (BAD)
 * 
 * The LLM has no context about what these parameters mean.
 */
const badSchema = z.object({
  path: z.string(),
  encoding: z.string(),
  maxSize: z.number(),
});

/**
 * Example 2: Schema WITH descriptions (GOOD)
 * 
 * Each field has a clear description that helps the LLM understand:
 * - What the parameter is for
 * - What format it expects
 * - Any constraints or special behavior
 */
const goodSchema = z.object({
  path: z
    .string()
    .describe('Path to the file to read, relative to the current working directory'),
  
  encoding: z
    .enum(['utf-8', 'ascii', 'base64'])
    .default('utf-8')
    .describe('Character encoding to use when reading the file. Defaults to utf-8 for text files.'),
  
  maxSize: z
    .number()
    .min(1)
    .max(10485760) // 10MB
    .optional()
    .describe('Maximum file size in bytes. Files larger than this will be rejected. Default is 10MB.'),
});

/**
 * Example 3: Complete Tool with Well-Described Schema
 * 
 * This is how you should create tools - with rich descriptions
 * for both the metadata AND the schema fields.
 */
const readFileTool: Tool<
  { path: string; encoding?: 'utf-8' | 'ascii' | 'base64'; maxSize?: number },
  string
> = {
  metadata: {
    name: 'read-file',
    displayName: 'Read File',
    description: 'Read the contents of a file from the file system',
    category: ToolCategory.FILE_SYSTEM,
    tags: ['file', 'read', 'io'],
    examples: [
      {
        description: 'Read a text file with default encoding',
        input: { path: './README.md' },
        explanation: 'Reads the file using UTF-8 encoding by default',
      },
      {
        description: 'Read a file with specific encoding',
        input: { path: './data.txt', encoding: 'ascii' },
        explanation: 'You can specify the encoding if needed',
      },
      {
        description: 'Read a file with size limit',
        input: { path: './large-file.txt', maxSize: 5242880 },
        explanation: 'Limit the file size to 5MB',
      },
    ],
  },
  
  // Schema with detailed descriptions for each field
  schema: z.object({
    path: z
      .string()
      .min(1, 'Path cannot be empty')
      .describe('Path to the file to read, relative to the current working directory. Use forward slashes (/) for path separators.'),
    
    encoding: z
      .enum(['utf-8', 'ascii', 'base64'])
      .default('utf-8')
      .describe('Character encoding to use when reading the file. Use "utf-8" for most text files, "ascii" for simple text, or "base64" for binary files.'),
    
    maxSize: z
      .number()
      .int('File size must be an integer')
      .min(1, 'File size must be at least 1 byte')
      .max(10485760, 'File size cannot exceed 10MB')
      .optional()
      .describe('Maximum file size in bytes. Files larger than this will be rejected. If not specified, defaults to 10MB (10485760 bytes).'),
  }),
  
  execute: async ({ path, encoding = 'utf-8', maxSize = 10485760 }) => {
    return `[Mock] Reading ${path} with ${encoding} encoding (max size: ${maxSize} bytes)`;
  },
};

/**
 * Example 4: Complex Schema with Nested Objects
 * 
 * Shows how to describe nested structures.
 */
const complexTool: Tool<
  {
    query: string;
    options: {
      limit: number;
      offset: number;
      sortBy: string;
    };
    filters?: {
      category?: string;
      tags?: string[];
    };
  },
  unknown
> = {
  metadata: {
    name: 'search-database',
    description: 'Search the database with advanced filtering and pagination',
    category: ToolCategory.DATABASE,
  },
  
  schema: z.object({
    query: z
      .string()
      .min(1)
      .describe('Search query string. Supports wildcards (*) and boolean operators (AND, OR, NOT).'),
    
    options: z
      .object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .describe('Maximum number of results to return. Must be between 1 and 100.'),
        
        offset: z
          .number()
          .int()
          .min(0)
          .describe('Number of results to skip for pagination. Use 0 for the first page.'),
        
        sortBy: z
          .enum(['relevance', 'date', 'name'])
          .describe('Field to sort results by. Options: "relevance" (default), "date" (newest first), or "name" (alphabetical).'),
      })
      .describe('Pagination and sorting options for the search results.'),
    
    filters: z
      .object({
        category: z
          .string()
          .optional()
          .describe('Filter results by category name. Case-insensitive.'),
        
        tags: z
          .array(z.string())
          .optional()
          .describe('Filter results by tags. Returns items matching ANY of the specified tags.'),
      })
      .optional()
      .describe('Optional filters to narrow down search results.'),
  }),
  
  execute: async (input) => {
    return { mock: 'search results', input };
  },
};

/**
 * Helper to extract descriptions from Zod schema
 */
function showSchemaInfo(name: string, schema: z.ZodTypeAny) {
  console.log(`\n${name}:`);

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    console.log('\nFields:');
    Object.entries(shape).forEach(([key, value]: [string, any]) => {
      const description = value._def.description || '(no description)';
      const type = value._def.typeName;
      console.log(`  - ${key}: ${type}`);
      console.log(`    Description: ${description}`);
    });
  }
}

/**
 * Main function - demonstrates the difference
 */
async function main() {
  console.log('=== Schema Descriptions Example ===\n');
  console.log('This shows how to add descriptions to schema fields for LLMs.\n');

  // Show the difference between bad and good schemas
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. BAD Schema (no descriptions) ❌');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  showSchemaInfo('Bad Schema', badSchema);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2. GOOD Schema (with descriptions) ✅');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  showSchemaInfo('Good Schema', goodSchema);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3. Complete Tool Example (read-file)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nTool Metadata:');
  console.log('  Name:', readFileTool.metadata.name);
  console.log('  Description:', readFileTool.metadata.description);
  console.log('  Category:', readFileTool.metadata.category);
  console.log('  Examples:', readFileTool.metadata.examples?.length);

  showSchemaInfo('Read File Schema', readFileTool.schema);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4. Testing the Tool');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Test with valid input
  const validInput = { path: './README.md', encoding: 'utf-8' as const };
  const validResult = readFileTool.schema.safeParse(validInput);

  if (validResult.success) {
    console.log('\n✅ Valid input:', validInput);
    const output = await readFileTool.execute(validResult.data);
    console.log('   Output:', output);
  }

  // Test with invalid input
  const invalidInput = { path: '', encoding: 'invalid' };
  const invalidResult = readFileTool.schema.safeParse(invalidInput);

  if (!invalidResult.success) {
    console.log('\n❌ Invalid input:', invalidInput);
    console.log('   Errors:');
    invalidResult.error.errors.forEach((err) => {
      console.log(`     - ${err.path.join('.')}: ${err.message}`);
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Key Takeaways:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   1. Use .describe() on EVERY schema field');
  console.log('   2. Descriptions should explain what the field is for');
  console.log('   3. Include format requirements and constraints');
  console.log('   4. Mention default values if applicable');
  console.log('   5. LangChain will convert these to JSON Schema for LLMs');
  console.log('   6. Good descriptions = Better LLM tool selection');
  console.log('\n   Example:');
  console.log('   z.string().describe("Path to the file to read")');
  console.log('   z.number().min(1).max(100).describe("Page size (1-100)")');
}

// Run the example
main().catch(console.error);

