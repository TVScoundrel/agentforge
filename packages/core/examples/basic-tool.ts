/**
 * Basic Tool Example
 * 
 * This example shows how to create a simple tool using the
 * Tool interface and metadata system we just built.
 * 
 * Run this example:
 * ```bash
 * npx tsx packages/core/examples/basic-tool.ts
 * ```
 */

import { z } from 'zod';
import {
  createTool,
  ToolCategory,
} from '../src/tools/index.js';

/**
 * Example 1: Simple Calculator Tool
 *
 * This tool adds two numbers together.
 * It demonstrates the minimum required fields.
 *
 * Using createTool() automatically validates:
 * - Metadata (name format, required fields, etc.)
 * - Schema descriptions (ALL fields must have .describe())
 */
const calculatorTool = createTool(
  // Metadata: Describes the tool
  {
    name: 'add-numbers',
    description: 'Add two numbers together and return the result',
    category: ToolCategory.UTILITY,
  },

  // Schema: Validates input using Zod
  // IMPORTANT: createTool() ENFORCES .describe() on ALL fields!
  z.object({
    a: z.number().describe('First number to add'),
    b: z.number().describe('Second number to add'),
  }),

  // Execute: The actual implementation
  async ({ a, b }) => {
    return a + b;
  }
);

/**
 * Example 2: File Reader Tool (with rich metadata)
 *
 * This tool demonstrates using all the optional metadata fields
 * to provide rich context for LLMs and developers.
 */
const readFileTool = createTool(
  // Rich metadata with examples, notes, and limitations
  {
    name: 'read-file',
    displayName: 'Read File',
    description: 'Read the contents of a file from the file system',
    category: ToolCategory.FILE_SYSTEM,
    tags: ['file', 'read', 'io', 'filesystem'],

    // Examples help LLMs understand usage
    examples: [
      {
        description: 'Read a text file with default encoding',
        input: { path: './README.md' },
        output: '# My Project\n\nWelcome to...',
        explanation: 'Reads the file using UTF-8 encoding by default',
      },
      {
        description: 'Read a file with specific encoding',
        input: { path: './data.txt', encoding: 'ascii' },
        explanation: 'You can specify the encoding if needed',
      },
    ],

    // Usage notes provide important context
    usageNotes: 'Paths are relative to the current working directory. Use absolute paths for files outside the project.',

    // Limitations help set expectations
    limitations: [
      'Cannot read files larger than 10MB',
      'Requires read permissions on the file',
      'Binary files may not display correctly',
    ],

    // Version and author for tracking
    version: '1.0.0',
    author: 'AgentForge Team',
  },

  // Schema with optional encoding parameter
  // BEST PRACTICE: Add detailed descriptions to help LLMs understand:
  // - What the parameter is for
  // - What format/values are expected
  // - Any constraints or defaults
  z.object({
    path: z
      .string()
      .describe('Path to the file to read, relative to the current working directory'),
    encoding: z
      .enum(['utf-8', 'ascii', 'base64'])
      .default('utf-8')
      .describe('Character encoding to use when reading the file. Defaults to utf-8 for text files.'),
  }),

  // Mock implementation (in real code, this would use fs.readFile)
  async ({ path, encoding = 'utf-8' }) => {
    // This is a mock - real implementation would read the file
    return `[Mock] Contents of ${path} (encoding: ${encoding})`;
  }
);

/**
 * Example 3: What happens if you forget .describe()?
 *
 * Uncomment this to see the validation error!
 */
// const badTool = createTool(
//   {
//     name: 'bad-tool',
//     description: 'This will fail',
//     category: ToolCategory.UTILITY,
//   },
//   z.object({
//     input: z.string(), // ❌ Missing .describe()!
//   }),
//   async ({ input }) => input
// );
// Error: Schema field "input" (ZodString) is missing a description.

/**
 * Main function - demonstrates using the tools
 */
async function main() {
  console.log('=== AgentForge Tool Examples ===\n');

  // Example 1: Using the calculator tool
  console.log('1. Calculator Tool');
  console.log('   Metadata:', calculatorTool.metadata);
  
  // Validate input
  const calcInput = { a: 5, b: 3 };
  const calcValidation = calculatorTool.schema.safeParse(calcInput);
  
  if (calcValidation.success) {
    const result = await calculatorTool.invoke(calcValidation.data);
    console.log(`   Result: ${calcInput.a} + ${calcInput.b} = ${result}\n`);
  }

  // Example 2: Using the file reader tool
  console.log('2. File Reader Tool');
  console.log('   Name:', readFileTool.metadata.name);
  console.log('   Category:', readFileTool.metadata.category);
  console.log('   Tags:', readFileTool.metadata.tags);
  console.log('   Examples:', readFileTool.metadata.examples?.length);
  
  // Validate and execute
  const fileInput = { path: './README.md' };
  const fileValidation = readFileTool.schema.safeParse(fileInput);
  
  if (fileValidation.success) {
    const result = await readFileTool.invoke(fileValidation.data);
    console.log(`   Result: ${result}\n`);
  }

  // Example 3: Invalid input handling
  console.log('3. Input Validation');
  const invalidInput = { path: 123 }; // Wrong type!
  const invalidValidation = readFileTool.schema.safeParse(invalidInput);
  
  if (!invalidValidation.success) {
    console.log('   ❌ Validation failed (as expected):');
    invalidValidation.error.errors.forEach((err) => {
      console.log(`      - ${err.path.join('.')}: ${err.message}`);
    });
  }

  console.log('\n✅ All examples completed!');
}

// Run the examples
main().catch(console.error);

