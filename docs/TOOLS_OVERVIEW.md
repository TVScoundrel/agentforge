# AgentForge Tools - Complete Guide

## Overview

AgentForge provides a **comprehensive tool system** designed for LLM agents. Tools are the building blocks that allow agents to interact with the world.

## Key Features

✅ **Rich Metadata** - Name, description, category, tags, examples, and more  
✅ **Schema Validation** - Zod-based input validation with automatic type inference  
✅ **Description Enforcement** - All schema fields MUST have descriptions for LLM understanding  
✅ **Fluent Builder API** - Ergonomic tool creation with automatic validation  
✅ **Type Safety** - Full TypeScript support with inferred types  
✅ **LangChain Compatible** - Ready for LangChain integration  

## Quick Start

### Using the Builder API (Recommended)

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

const readFileTool = toolBuilder()
  .name('read-file')
  .description('Read a file from the file system')
  .category(ToolCategory.FILE_SYSTEM)
  .tag('file')
  .tag('read')
  .schema(z.object({
    path: z.string().describe('Path to the file to read'),
    encoding: z.string().default('utf-8').describe('File encoding'),
  }))
  .implement(async ({ path, encoding }) => {
    // Your implementation
    return fileContents;
  })
  .build();

// Use the tool
const result = await readFileTool.execute({ path: './README.md' });
```

### Using createTool()

```typescript
import { createTool, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

const readFileTool = createTool(
  {
    name: 'read-file',
    description: 'Read a file from the file system',
    category: ToolCategory.FILE_SYSTEM,
    tags: ['file', 'read'],
  },
  z.object({
    path: z.string().describe('Path to the file to read'),
    encoding: z.string().default('utf-8').describe('File encoding'),
  }),
  async ({ path, encoding }) => {
    // Your implementation
    return fileContents;
  }
);
```

## Core Concepts

### 1. Tool Metadata

Every tool has rich metadata for LLM understanding:

- **name** (required) - Kebab-case identifier (e.g., 'read-file')
- **description** (required) - Clear description (min 10 chars)
- **category** (required) - Tool category for organization
- **displayName** (optional) - Human-friendly name
- **tags** (optional) - Searchable tags
- **examples** (optional) - Usage examples
- **usageNotes** (optional) - Important usage information
- **limitations** (optional) - Known limitations
- **version** (optional) - Semantic version
- **author** (optional) - Tool author

See [Tool Metadata](./TOOL_METADATA.md) for details.

### 2. Schema Descriptions

**All schema fields MUST have descriptions!** This is critical for LLM understanding.

```typescript
// ❌ BAD - No descriptions
z.object({
  path: z.string(),
  limit: z.number(),
})

// ✅ GOOD - All fields described
z.object({
  path: z.string().describe('Path to the file'),
  limit: z.number().describe('Maximum results (1-100)'),
})
```

See [Schema Descriptions](./SCHEMA_DESCRIPTIONS.md) for details.

### 3. Tool Categories

Tools are organized into categories:

- `UTILITY` - General utilities
- `FILE_SYSTEM` - File operations
- `WEB` - Web/HTTP operations
- `DATABASE` - Database operations
- `AI` - AI/ML operations
- `SEARCH` - Search operations
- `COMMUNICATION` - Communication tools
- `DATA_PROCESSING` - Data transformation
- `CUSTOM` - Custom category

## Tool Creation Methods

### Method 1: Builder API (Recommended)

**Best for:** Complex tools with many optional fields

```typescript
const tool = toolBuilder()
  .name('my-tool')
  .description('Does something')
  .category(ToolCategory.UTILITY)
  .tag('tag1')
  .tag('tag2')
  .example({ description: 'Example', input: { x: 1 } })
  .schema(z.object({ x: z.number().describe('Input') }))
  .implement(async ({ x }) => x * 2)
  .build();
```

**Advantages:**
- Fluent, readable syntax
- Easy to add optional fields
- Great IDE autocomplete
- Self-documenting

See [Tool Builder](./TOOL_BUILDER.md) for details.

### Method 2: createTool()

**Best for:** Simple tools or when you have metadata objects

```typescript
const tool = createTool(
  { name: 'my-tool', description: 'Does something', category: ToolCategory.UTILITY },
  z.object({ x: z.number().describe('Input') }),
  async ({ x }) => x * 2
);
```

**Advantages:**
- More concise
- See all metadata at once
- Easy to copy/paste

### Method 3: createToolUnsafe() (Not Recommended)

**Only use during migration!** Skips schema description validation.

```typescript
const tool = createToolUnsafe(
  metadata,
  z.object({ x: z.number() }), // No .describe() - allowed but not recommended!
  execute
);
```

## Validation

All tools are automatically validated:

### Metadata Validation
- Name must be kebab-case
- Description must be at least 10 characters
- Category must be valid
- Examples must have descriptions

### Schema Validation
- **All fields must have descriptions**
- Nested objects must have descriptions
- Array elements must have descriptions
- Optional/nullable fields must have descriptions

### Error Handling

```typescript
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
    // Error: Schema field "input" (ZodString) is missing a description.
  }
}
```

## Examples

See the [examples directory](../packages/core/examples/) for complete examples:

- [basic-tool.ts](../packages/core/examples/basic-tool.ts) - Basic tool creation
- [schema-descriptions.ts](../packages/core/examples/schema-descriptions.ts) - Schema descriptions
- [tool-builder.ts](../packages/core/examples/tool-builder.ts) - Builder API examples
- [builder-vs-manual.ts](../packages/core/examples/builder-vs-manual.ts) - Comparison

## API Reference

### Functions

- `toolBuilder()` - Create a new tool builder
- `createTool()` - Create a tool with validation
- `createToolUnsafe()` - Create a tool without schema validation
- `validateTool()` - Validate an existing tool
- `validateSchemaDescriptions()` - Validate schema descriptions
- `getMissingDescriptions()` - Get missing description paths

### Types

- `Tool<TInput, TOutput>` - Tool interface
- `ToolMetadata` - Tool metadata interface
- `ToolCategory` - Tool category enum
- `ToolExample` - Usage example interface

### Errors

- `MissingDescriptionError` - Thrown when schema fields lack descriptions

## Best Practices

1. **Always use descriptions** - Every schema field needs a `.describe()`
2. **Be specific** - "Path to the file" is better than "A path"
3. **Include constraints** - Mention min/max, formats, defaults
4. **Add examples** - Help LLMs understand usage patterns
5. **Document limitations** - Be clear about what the tool can't do
6. **Use appropriate categories** - Helps with tool organization
7. **Add tags** - Makes tools searchable
8. **Version your tools** - Track changes over time

## Next Steps

- Read [Tool Metadata](./TOOL_METADATA.md) for metadata details
- Read [Schema Descriptions](./SCHEMA_DESCRIPTIONS.md) for schema best practices
- Read [Tool Builder](./TOOL_BUILDER.md) for builder API reference
- Check out the [examples](../packages/core/examples/)

