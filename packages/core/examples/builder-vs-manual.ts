/**
 * Builder vs Manual Comparison
 * 
 * This example shows the difference between creating tools
 * manually vs using the builder API.
 * 
 * Run this example:
 * ```bash
 * npx tsx packages/core/examples/builder-vs-manual.ts
 * ```
 */

import { z } from 'zod';
import {
  createTool,
  toolBuilder,
  ToolCategory,
  type Tool,
} from '../src/tools/index.js';

console.log('=== Builder vs Manual Tool Creation ===\n');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Method 1: Manual Creation with createTool()
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('1. Manual Creation (using createTool):\n');
console.log('```typescript');
console.log(`const manualTool = createTool(
  {
    name: 'format-text',
    description: 'Format text with various transformations',
    category: ToolCategory.UTILITY,
    tags: ['text', 'format', 'transform'],
    examples: [
      {
        description: 'Convert to uppercase',
        input: { text: 'hello', format: 'uppercase' },
        output: 'HELLO',
      },
    ],
    usageNotes: 'Supports uppercase, lowercase, and title case',
    limitations: ['Maximum text length: 10000 characters'],
    version: '1.0.0',
  },
  z.object({
    text: z.string().describe('Text to format'),
    format: z
      .enum(['uppercase', 'lowercase', 'titlecase'])
      .describe('Format to apply'),
  }),
  async ({ text, format }) => {
    // Implementation
  }
);`);
console.log('```\n');

const manualTool = createTool(
  {
    name: 'format-text',
    description: 'Format text with various transformations',
    category: ToolCategory.UTILITY,
    tags: ['text', 'format', 'transform'],
    examples: [
      {
        description: 'Convert to uppercase',
        input: { text: 'hello', format: 'uppercase' as const },
        output: 'HELLO',
      },
    ],
    usageNotes: 'Supports uppercase, lowercase, and title case',
    limitations: ['Maximum text length: 10000 characters'],
    version: '1.0.0',
  },
  z.object({
    text: z.string().describe('Text to format'),
    format: z
      .enum(['uppercase', 'lowercase', 'titlecase'])
      .describe('Format to apply'),
  }),
  async ({ text, format }) => {
    switch (format) {
      case 'uppercase':
        return text.toUpperCase();
      case 'lowercase':
        return text.toLowerCase();
      case 'titlecase':
        return text
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Method 2: Builder API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('2. Builder API (using toolBuilder):\n');
console.log('```typescript');
console.log(`const builderTool = toolBuilder()
  .name('format-text')
  .description('Format text with various transformations')
  .category(ToolCategory.UTILITY)
  .tag('text')
  .tag('format')
  .tag('transform')
  .example({
    description: 'Convert to uppercase',
    input: { text: 'hello', format: 'uppercase' },
    output: 'HELLO',
  })
  .usageNotes('Supports uppercase, lowercase, and title case')
  .limitation('Maximum text length: 10000 characters')
  .version('1.0.0')
  .schema(z.object({
    text: z.string().describe('Text to format'),
    format: z
      .enum(['uppercase', 'lowercase', 'titlecase'])
      .describe('Format to apply'),
  }))
  .implement(async ({ text, format }) => {
    // Implementation
  })
  .build();`);
console.log('```\n');

const builderTool = toolBuilder()
  .name('format-text-builder')
  .description('Format text with various transformations')
  .category(ToolCategory.UTILITY)
  .tag('text')
  .tag('format')
  .tag('transform')
  .example({
    description: 'Convert to uppercase',
    input: { text: 'hello', format: 'uppercase' as const },
    output: 'HELLO',
  })
  .usageNotes('Supports uppercase, lowercase, and title case')
  .limitation('Maximum text length: 10000 characters')
  .version('1.0.0')
  .schema(z.object({
    text: z.string().describe('Text to format'),
    format: z
      .enum(['uppercase', 'lowercase', 'titlecase'])
      .describe('Format to apply'),
  }))
  .implement(async ({ text, format }) => {
    switch (format) {
      case 'uppercase':
        return text.toUpperCase();
      case 'lowercase':
        return text.toLowerCase();
      case 'titlecase':
        return text
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
    }
  })
  .build();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Comparison
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Comparison:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('✅ Builder API Advantages:');
console.log('   - More readable and fluent');
console.log('   - Easier to add optional fields incrementally');
console.log('   - Better for adding tags/examples/limitations one at a time');
console.log('   - Great IDE autocomplete support');
console.log('   - Clear method names (self-documenting)');
console.log();

console.log('✅ Manual Creation Advantages:');
console.log('   - More concise for simple tools');
console.log('   - Easier to see all metadata at once');
console.log('   - Better for copying/pasting metadata objects');
console.log();

console.log('📊 Both methods:');
console.log('   - Provide the same validation');
console.log('   - Enforce schema descriptions');
console.log('   - Produce identical Tool objects');
console.log('   - Have full TypeScript type safety');
console.log();

// Test both tools
async function testTools() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Testing Both Tools:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const input = { text: 'hello world', format: 'titlecase' as const };

  const manualResult = await manualTool.execute(input);
  const builderResult = await builderTool.execute(input);

  console.log('Input:', input);
  console.log('Manual Tool Result:', manualResult);
  console.log('Builder Tool Result:', builderResult);
  console.log();

  console.log('✅ Both produce the same result!');
  console.log();

  console.log('💡 Recommendation:');
  console.log('   - Use Builder API for complex tools with many optional fields');
  console.log('   - Use createTool() for simple tools or when you have metadata objects');
  console.log('   - Both are equally valid - choose based on your preference!');
}

testTools().catch(console.error);

