# AgentForge Tools - Quick Reference

## Installation

```bash
npm install @agentforge/core zod
```

## Basic Usage

### Create a Tool (Builder API)

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

const tool = toolBuilder()
  .name('my-tool')                    // Required: kebab-case
  .description('What it does')        // Required: min 10 chars
  .category(ToolCategory.UTILITY)     // Required
  .schema(z.object({                  // Required
    input: z.string().describe('Input description'), // .describe() required!
  }))
  .implement(async ({ input }) => {   // Required
    return `Result: ${input}`;
  })
  .build();                           // Validates and builds

// Use it
const result = await tool.execute({ input: 'hello' });
```

### Create a Tool (Manual)

```typescript
import { createTool, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

const tool = createTool(
  {
    name: 'my-tool',
    description: 'What it does',
    category: ToolCategory.UTILITY,
  },
  z.object({
    input: z.string().describe('Input description'),
  }),
  async ({ input }) => `Result: ${input}`
);
```

## Tool Categories

```typescript
ToolCategory.UTILITY          // General utilities
ToolCategory.FILE_SYSTEM      // File operations
ToolCategory.WEB              // HTTP/web operations
ToolCategory.DATABASE         // Database operations
ToolCategory.AI               // AI/ML operations
ToolCategory.SEARCH           // Search operations
ToolCategory.COMMUNICATION    // Communication tools
ToolCategory.DATA_PROCESSING  // Data transformation
ToolCategory.CUSTOM           // Custom category
```

## Schema Descriptions (REQUIRED!)

```typescript
// ❌ WRONG - No descriptions
z.object({
  path: z.string(),
  count: z.number(),
})

// ✅ CORRECT - All fields described
z.object({
  path: z.string().describe('Path to the file'),
  count: z.number().describe('Number of items (1-100)'),
})
```

## Optional Metadata

```typescript
toolBuilder()
  .name('my-tool')
  .description('What it does')
  .category(ToolCategory.UTILITY)
  
  // Optional fields
  .displayName('My Tool')                    // Human-friendly name
  .version('1.0.0')                          // Semantic version
  .author('Your Name')                       // Author name
  
  // Tags (multiple ways)
  .tags(['tag1', 'tag2'])                    // Set all at once
  .tag('tag3')                               // Add one at a time
  
  // Examples
  .example({
    description: 'Example usage',
    input: { x: 1 },
    output: 2,
    explanation: 'Doubles the input',
  })
  
  // Usage notes and limitations
  .usageNotes('Important usage information')
  .limitations(['Limit 1', 'Limit 2'])       // Set all at once
  .limitation('Limit 3')                     // Add one at a time
  
  .schema(/* ... */)
  .implement(/* ... */)
  .build();
```

## Common Schema Patterns

### Optional Fields

```typescript
z.object({
  // Option 1: Description on wrapper
  email: z.string().optional().describe('Email (optional)'),
  
  // Option 2: Description on inner type
  phone: z.string().describe('Phone number').optional(),
})
```

### Default Values

```typescript
z.object({
  limit: z.number().default(10).describe('Max results (default: 10)'),
})
```

### Arrays

```typescript
z.object({
  tags: z
    .array(z.string().describe('Tag name'))  // Element description
    .describe('List of tags'),                // Array description
})
```

### Nested Objects

```typescript
z.object({
  user: z
    .object({
      name: z.string().describe('User name'),
      email: z.string().describe('User email'),
    })
    .describe('User information'),
})
```

### Enums

```typescript
z.object({
  format: z
    .enum(['json', 'xml', 'csv'])
    .describe('Output format (json, xml, or csv)'),
})
```

## Validation

### Check for Missing Descriptions

```typescript
import { getMissingDescriptions } from '@agentforge/core';

const missing = getMissingDescriptions(schema);
if (missing.length > 0) {
  console.log('Missing descriptions:', missing);
}
```

### Safe Validation

```typescript
import { safeValidateSchemaDescriptions } from '@agentforge/core';

const result = safeValidateSchemaDescriptions(schema);
if (!result.success) {
  console.error(result.error.message);
}
```

## Error Handling

```typescript
import { MissingDescriptionError } from '@agentforge/core';

try {
  const tool = toolBuilder()
    .name('bad-tool')
    .description('Testing')
    .category(ToolCategory.UTILITY)
    .schema(z.object({
      input: z.string(), // Missing .describe()!
    }))
    .implement(async ({ input }) => input)
    .build();
} catch (error) {
  if (error instanceof MissingDescriptionError) {
    console.error('Missing description:', error.message);
  }
}
```

## Type Inference

```typescript
const tool = toolBuilder()
  .schema(z.object({
    name: z.string().describe('Name'),
    age: z.number().describe('Age'),
  }))
  .implement(async ({ name, age }) => {
    // TypeScript knows: name is string, age is number
    const upper: string = name.toUpperCase();
    const double: number = age * 2;
    return { upper, double };
  })
  .build();
```

## Best Practices

1. ✅ **Always use `.describe()`** on every schema field
2. ✅ **Be specific** - "Path to the file" not "A path"
3. ✅ **Include constraints** - Mention min/max, formats, defaults
4. ✅ **Add examples** - Help LLMs understand usage
5. ✅ **Document limitations** - Be clear about restrictions
6. ✅ **Use builder API** for complex tools
7. ✅ **Use createTool()** for simple tools
8. ✅ **Add tags** for searchability

## Examples

See [examples directory](../packages/core/examples/):
- `basic-tool.ts` - Basic usage
- `schema-descriptions.ts` - Schema patterns
- `tool-builder.ts` - Builder API
- `builder-vs-manual.ts` - Comparison

## Documentation

- [TOOLS_OVERVIEW.md](./TOOLS_OVERVIEW.md) - Complete guide
- [TOOL_METADATA.md](./TOOL_METADATA.md) - Metadata reference
- [SCHEMA_DESCRIPTIONS.md](./SCHEMA_DESCRIPTIONS.md) - Schema guide
- [TOOL_BUILDER.md](./TOOL_BUILDER.md) - Builder API reference

