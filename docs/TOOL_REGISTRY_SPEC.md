# Tool Registry Specification

> Detailed specification for the AgentForge tool system

---

## Overview

The Tool Registry is the foundation of AgentForge. It provides a rich, metadata-driven approach to tool management with automatic prompt generation and seamless LangChain integration.

---

## Core Interfaces

### ToolMetadata

```typescript
interface ToolMetadata {
  // Basic Information
  name: string;                    // Unique identifier (kebab-case)
  displayName?: string;            // Human-readable name
  description: string;             // What the tool does
  
  // Categorization
  category: ToolCategory;          // Primary category
  tags?: string[];                 // Additional tags for search
  
  // Usage Information
  examples?: ToolExample[];        // Usage examples
  usageNotes?: string;             // Additional guidance
  limitations?: string[];          // Known limitations
  
  // Metadata
  version?: string;                // Tool version
  author?: string;                 // Tool author
  deprecated?: boolean;            // Deprecation flag
  replacedBy?: string;             // Replacement tool name
}
```

### ToolExample

```typescript
interface ToolExample {
  description: string;             // What this example demonstrates
  input: Record<string, unknown>;  // Example input
  output?: unknown;                // Expected output (optional)
  explanation?: string;            // Why this works
}
```

### ToolCategory

```typescript
enum ToolCategory {
  FILE_SYSTEM = 'file-system',
  WEB = 'web',
  CODE = 'code',
  DATABASE = 'database',
  API = 'api',
  UTILITY = 'utility',
  CUSTOM = 'custom',
}
```

### Tool Interface

```typescript
interface Tool<TInput = unknown, TOutput = unknown> {
  metadata: ToolMetadata;
  schema: z.ZodSchema<TInput>;
  execute: (input: TInput) => Promise<TOutput>;
}
```

---

## Tool Builder API

### Basic Usage

```typescript
import { createTool } from '@agentforge/core';
import { z } from 'zod';

const readFileTool = createTool()
  .name('read-file')
  .displayName('Read File')
  .description('Read the contents of a file from the file system')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['file', 'read', 'io'])
  .schema(z.object({
    path: z.string().describe('Path to the file to read'),
    encoding: z.enum(['utf-8', 'ascii', 'base64']).default('utf-8'),
  }))
  .example({
    description: 'Read a text file',
    input: { path: './README.md', encoding: 'utf-8' },
    output: '# My Project\n\nWelcome to...',
  })
  .example({
    description: 'Read a binary file as base64',
    input: { path: './image.png', encoding: 'base64' },
  })
  .usageNotes('Paths are relative to the current working directory')
  .limitations(['Cannot read files larger than 10MB', 'Requires read permissions'])
  .implement(async ({ path, encoding }) => {
    const fs = await import('fs/promises');
    return await fs.readFile(path, encoding);
  })
  .build();
```

### Builder Methods

```typescript
interface ToolBuilder<TInput, TOutput> {
  // Required
  name(name: string): this;
  description(description: string): this;
  category(category: ToolCategory): this;
  schema<T>(schema: z.ZodSchema<T>): ToolBuilder<T, TOutput>;
  implement<T>(fn: (input: TInput) => Promise<T>): ToolBuilder<TInput, T>;
  build(): Tool<TInput, TOutput>;
  
  // Optional
  displayName(name: string): this;
  tags(tags: string[]): this;
  example(example: ToolExample): this;
  usageNotes(notes: string): this;
  limitations(limitations: string[]): this;
  version(version: string): this;
  author(author: string): this;
  deprecated(replacedBy?: string): this;
}
```

---

## Tool Registry

### Registry Interface

```typescript
interface ToolRegistry {
  // CRUD Operations
  register(tool: Tool): void;
  get(name: string): Tool | undefined;
  remove(name: string): boolean;
  update(name: string, tool: Tool): boolean;
  has(name: string): boolean;
  
  // Query Operations
  getAll(): Tool[];
  getByCategory(category: ToolCategory): Tool[];
  getByTag(tag: string): Tool[];
  search(query: string): Tool[];
  
  // Bulk Operations
  registerMany(tools: Tool[]): void;
  clear(): void;
  
  // Conversion
  toLangChainTools(): StructuredTool[];
  
  // Prompt Generation
  generatePrompt(options?: PromptOptions): string;
  
  // Events
  on(event: RegistryEvent, handler: EventHandler): void;
  off(event: RegistryEvent, handler: EventHandler): void;
}
```

### Usage Example

```typescript
import { ToolRegistry } from '@agentforge/core';

const registry = new ToolRegistry();

// Register tools
registry.register(readFileTool);
registry.register(writeFileTool);
registry.registerMany([searchTool, httpTool]);

// Query tools
const fileTool = registry.get('read-file');
const fileTools = registry.getByCategory(ToolCategory.FILE_SYSTEM);
const searchResults = registry.search('file');

// Generate prompt
const prompt = registry.generatePrompt({
  includeExamples: true,
  groupByCategory: true,
});

// Convert to LangChain
const langChainTools = registry.toLangChainTools();
```

---

## Prompt Generation

### Generated Prompt Format

```
Available Tools:

FILE SYSTEM TOOLS:
- read-file: Read the contents of a file from the file system
  Parameters: path (string), encoding (utf-8|ascii|base64)
  Example: Read a text file
    Input: { "path": "./README.md", "encoding": "utf-8" }
  Notes: Paths are relative to the current working directory

- write-file: Write content to a file
  Parameters: path (string), content (string)
  ...

WEB TOOLS:
- http-request: Make an HTTP request
  ...
```

### Prompt Options

```typescript
interface PromptOptions {
  includeExamples?: boolean;       // Include usage examples
  includeNotes?: boolean;          // Include usage notes
  includeLimitations?: boolean;    // Include limitations
  groupByCategory?: boolean;       // Group by category
  categories?: ToolCategory[];     // Filter by categories
  maxExamplesPerTool?: number;     // Limit examples
}
```

---

## LangChain Integration

### Conversion

```typescript
// AgentForge Tool → LangChain StructuredTool
const langChainTool = tool.toLangChainTool();

// Registry → Array of LangChain Tools
const langChainTools = registry.toLangChainTools();
```

### Schema Mapping

- Zod schemas are automatically converted to JSON Schema
- Descriptions are preserved
- Validation is maintained

---

## Validation

### Schema Validation

```typescript
// Input is validated against Zod schema before execution
const result = await tool.execute({ path: './file.txt' });
// ✅ Valid

await tool.execute({ invalid: 'input' });
// ❌ Throws ZodError
```

### Metadata Validation

```typescript
// Metadata is validated when building
createTool()
  .name('invalid name with spaces')  // ❌ Throws error
  .build();

createTool()
  .name('valid-name')                // ✅ Valid
  .build();
```

---

## Error Handling

### Tool Execution Errors

```typescript
try {
  const result = await tool.execute(input);
} catch (error) {
  if (error instanceof z.ZodError) {
    // Handle validation error
  } else if (error instanceof ToolExecutionError) {
    // Handle execution error
  }
}
```

---

## Testing

### Unit Testing Tools

```typescript
import { describe, it, expect } from 'vitest';

describe('read-file tool', () => {
  it('should read file contents', async () => {
    const result = await readFileTool.execute({
      path: './test.txt',
      encoding: 'utf-8',
    });
    expect(result).toBe('test content');
  });
  
  it('should validate input', async () => {
    await expect(
      readFileTool.execute({ path: 123 })
    ).rejects.toThrow(z.ZodError);
  });
});
```

---

## Next Steps

See [ROADMAP.md](./ROADMAP.md) for implementation timeline.

