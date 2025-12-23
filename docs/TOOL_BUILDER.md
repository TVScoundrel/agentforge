# Tool Builder API

## Overview

The Tool Builder provides a **fluent, ergonomic API** for creating tools with automatic validation. It's the recommended way to create tools in AgentForge.

## Quick Start

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

const tool = toolBuilder()
  .name('my-tool')
  .description('Does something useful')
  .category(ToolCategory.UTILITY)
  .schema(z.object({
    input: z.string().describe('Input parameter'),
  }))
  .implement(async ({ input }) => {
    return `Processed: ${input}`;
  })
  .build();
```

## Why Use the Builder?

### Before (Manual Creation)

```typescript
const tool: Tool<{ input: string }, string> = {
  metadata: {
    name: 'my-tool',
    description: 'Does something useful',
    category: ToolCategory.UTILITY,
    tags: ['tag1', 'tag2'],
    examples: [
      { description: 'Example', input: { input: 'test' } }
    ],
  },
  schema: z.object({
    input: z.string().describe('Input parameter'),
  }),
  execute: async ({ input }) => `Processed: ${input}`,
};
```

### After (Builder API)

```typescript
const tool = toolBuilder()
  .name('my-tool')
  .description('Does something useful')
  .category(ToolCategory.UTILITY)
  .tag('tag1')
  .tag('tag2')
  .example({ description: 'Example', input: { input: 'test' } })
  .schema(z.object({
    input: z.string().describe('Input parameter'),
  }))
  .implement(async ({ input }) => `Processed: ${input}`)
  .build();
```

**Benefits:**
- ✅ More readable and fluent
- ✅ Easier to add optional fields
- ✅ Automatic validation on `.build()`
- ✅ Type inference from schema
- ✅ Better IDE autocomplete

## API Reference

### Required Methods

#### `.name(name: string)`
Set the tool name (kebab-case).

```typescript
.name('read-file')
```

#### `.description(description: string)`
Set the tool description (min 10 characters).

```typescript
.description('Read a file from the file system')
```

#### `.category(category: ToolCategory)`
Set the tool category.

```typescript
.category(ToolCategory.FILE_SYSTEM)
```

#### `.schema<T>(schema: ZodSchema<T>)`
Set the input schema. **All fields must have `.describe()`!**

```typescript
.schema(z.object({
  path: z.string().describe('Path to the file'),
  encoding: z.string().optional().describe('File encoding'),
}))
```

#### `.implement<T>(execute: (input) => Promise<T>)`
Set the implementation function.

```typescript
.implement(async ({ path, encoding }) => {
  // Your implementation
  return fileContents;
})
```

#### `.build()`
Build and validate the tool.

```typescript
const tool = builder.build();
```

### Optional Methods

#### `.displayName(name: string)`
Set a human-friendly display name.

```typescript
.displayName('Read File')
```

#### `.tags(tags: string[])`
Set all tags at once.

```typescript
.tags(['file', 'read', 'io'])
```

#### `.tag(tag: string)`
Add a single tag (can be called multiple times).

```typescript
.tag('file')
.tag('read')
.tag('io')
```

#### `.example(example: ToolExample)`
Add a usage example (can be called multiple times).

```typescript
.example({
  description: 'Read a text file',
  input: { path: './README.md' },
  output: '# My Project...',
  explanation: 'Reads the file with default encoding',
})
```

#### `.usageNotes(notes: string)`
Add usage notes.

```typescript
.usageNotes('Paths are relative to the current working directory')
```

#### `.limitations(limitations: string[])`
Set all limitations at once.

```typescript
.limitations([
  'Cannot read files larger than 10MB',
  'Requires read permissions',
])
```

#### `.limitation(limitation: string)`
Add a single limitation (can be called multiple times).

```typescript
.limitation('Cannot read files larger than 10MB')
.limitation('Requires read permissions')
```

#### `.version(version: string)`
Set the semantic version.

```typescript
.version('1.0.0')
```

#### `.author(author: string)`
Set the author name.

```typescript
.author('AgentForge Team')
```

## Examples

### Simple Tool

```typescript
const calculator = toolBuilder()
  .name('add-numbers')
  .description('Add two numbers together')
  .category(ToolCategory.UTILITY)
  .schema(z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }))
  .implement(async ({ a, b }) => a + b)
  .build();
```

### Full-Featured Tool

```typescript
const searchFiles = toolBuilder()
  .name('search-files')
  .description('Search for files matching a pattern')
  .category(ToolCategory.FILE_SYSTEM)
  .displayName('Search Files')
  .version('1.0.0')
  .author('AgentForge Team')
  .tag('file')
  .tag('search')
  .example({
    description: 'Search for TypeScript files',
    input: { directory: './src', pattern: '*.ts' },
  })
  .usageNotes('Supports wildcards (* and ?)')
  .limitation('Maximum 1000 results')
  .schema(z.object({
    directory: z.string().describe('Directory to search'),
    pattern: z.string().describe('File pattern (supports wildcards)'),
    recursive: z.boolean().default(false).describe('Search subdirectories'),
  }))
  .implement(async ({ directory, pattern, recursive }) => {
    // Implementation
  })
  .build();
```

## See Also

- [Schema Descriptions](./SCHEMA_DESCRIPTIONS.md) - Why descriptions are required
- [Tool Metadata](./TOOL_METADATA.md) - Metadata field reference
- [Examples](../packages/core/examples/tool-builder.ts) - More examples

