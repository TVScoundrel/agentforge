# Tools

Tools are the building blocks that allow AI agents to interact with the world. AgentForge provides a comprehensive tool system with rich metadata, automatic validation, and seamless LangChain integration.

::: tip Related Concepts
- **[Agent Patterns](/guide/concepts/patterns)** - Learn how tools are used in different agent patterns
- **[Custom Tools Tutorial](/tutorials/custom-tools)** - Step-by-step guide to building your own tools
- **[Standard Tools API](/api/tools)** - Browse 68+ pre-built tools
:::

## What is a Tool?

A **tool** is a function that an AI agent can call to perform actions or retrieve information. Tools enable agents to:

- 📁 **Read and write files**
- 🌐 **Make HTTP requests**
- 🗄️ **Query databases**
- 🧮 **Perform calculations**
- 🔍 **Search the web**
- And much more...

## Why AgentForge Tools?

AgentForge's tool system goes beyond simple function calling:

### Rich Metadata
Every tool includes comprehensive metadata that helps both LLMs and developers understand what the tool does:

- **Name & Description** - Clear identification
- **Category & Tags** - Organization and discovery
- **Examples** - Usage demonstrations
- **Usage Notes** - Important context
- **Limitations** - What the tool can't do
- **Version & Author** - Tracking and attribution

### Type Safety
Full TypeScript support with Zod schema validation ensures:

- ✅ Input validation at runtime
- ✅ Type inference for better DX
- ✅ Automatic error messages
- ✅ IDE autocomplete

### LangChain Compatible
Tools can be seamlessly converted to LangChain's `DynamicStructuredTool` format, allowing you to use them with any LangChain agent or workflow.

## Creating Tools

### Using the Builder API (Recommended)

The fluent builder API is the easiest way to create tools:

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

const readFileTool = toolBuilder()
  .name('read-file')
  .description('Read the contents of a file from the file system')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['file', 'read', 'io'])
  .usageNotes('Paths are relative to the current working directory')
  .limitation('Cannot read binary files larger than 10MB')
  .example({
    description: 'Read a text file',
    input: { path: './README.md' },
    explanation: 'Reads the README file in the current directory',
  })
  .schema(z.object({
    path: z.string().describe('Path to the file to read'),
    encoding: z.string().default('utf-8').describe('File encoding (default: utf-8)'),
  }))
  .implement(async ({ path, encoding }) => {
    const fs = await import('fs/promises');
    return await fs.readFile(path, encoding);
  })
  .build();
```

### Builder Methods

| Method | Required | Description |
|--------|----------|-------------|
| `.name(string)` | ✅ | Tool identifier (kebab-case) |
| `.description(string)` | ✅ | What the tool does (min 10 chars) |
| `.category(ToolCategory)` | ✅ | Primary category |
| `.schema(ZodSchema)` | ✅ | Input validation schema |
| `.implement(function)` | ✅ | Async implementation function |
| `.tags(string[])` | ❌ | Tags for discovery |
| `.displayName(string)` | ❌ | Human-readable name |
| `.usageNotes(string)` | ❌ | Important usage information |
| `.limitation(string)` | ❌ | What the tool can't do |
| `.example(ToolExample)` | ❌ | Usage example |
| `.version(string)` | ❌ | Tool version |
| `.author(string)` | ❌ | Tool author |

::: tip Schema Descriptions Required
All schema fields **must** include `.describe()` for LLM understanding:

```typescript
// ✅ Good
z.string().describe('Path to the file')

// ❌ Bad - missing description
z.string()
```
:::

## Tool Categories

AgentForge provides predefined categories for organizing tools:

```typescript
enum ToolCategory {
  FILE_SYSTEM = 'file-system',  // File operations
  WEB = 'web',                   // HTTP, scraping
  CODE = 'code',                 // Code execution, analysis
  DATA = 'data',                 // Data processing
  SEARCH = 'search',             // Search operations
  COMMUNICATION = 'communication', // Email, messaging
  UTILITY = 'utility',           // General utilities
  CUSTOM = 'custom',             // Custom tools
}
```

Choose the category that best fits your tool's primary purpose.

## Tool Registry

The `ToolRegistry` provides centralized tool management with CRUD operations, querying, and events.

### Basic Usage

```typescript
import { ToolRegistry } from '@agentforge/core';

const registry = new ToolRegistry();

// Register tools
registry.register(readFileTool);
registry.register(writeFileTool);

// Get a specific tool
const tool = registry.get('read-file');

// Get all tools
const allTools = registry.getAll();

// Query by category
const fileTools = registry.getByCategory(ToolCategory.FILE_SYSTEM);

// Query by tag
const readTools = registry.getByTag('read');

// Search
const results = registry.search('file');
```

### Bulk Operations

```typescript
// Register multiple tools at once
registry.registerMany([tool1, tool2, tool3]);

// Clear all tools
registry.clear();
```

### Events

Listen to registry events for observability:

```typescript
import { RegistryEvent } from '@agentforge/core';

registry.on(RegistryEvent.TOOL_REGISTERED, (tool) => {
  console.log(`Tool registered: ${tool.metadata.name}`);
});

registry.on(RegistryEvent.TOOL_REMOVED, ({ name }) => {
  console.log(`Tool removed: ${name}`);
});
```

## LangChain Integration

AgentForge tools can be converted to LangChain format for use with LangChain agents:

```typescript
// Convert a single tool
const langchainTool = readFileTool.toLangChainTool();

// Convert all tools in registry
const langchainTools = registry.toLangChainTools();

// Use with LangChain agent
import { ChatOpenAI } from '@langchain/openai';
import { createReActAgent } from '@agentforge/patterns';

const agent = createReActAgent({
  llm: new ChatOpenAI({ model: 'gpt-4' }),
  tools: registry.toLangChainTools(), // All tools from registry
});
```

## Prompt Generation

The registry can generate formatted prompts for LLMs:

```typescript
// Generate prompt for all tools
const prompt = registry.generatePrompt();

// Generate prompt with options
const detailedPrompt = registry.generatePrompt({
  includeExamples: true,      // Include usage examples
  includeUsageNotes: true,    // Include usage notes
  includeLimitations: true,   // Include limitations
  format: 'detailed',         // 'minimal' | 'standard' | 'detailed'
});

// Generate prompt for specific tools
const fileToolsPrompt = registry.generatePrompt({
  tools: registry.getByCategory(ToolCategory.FILE_SYSTEM),
});
```

## Best Practices

### 1. Clear Descriptions

Write descriptions that help LLMs understand when to use the tool:

```typescript
// ✅ Good - specific and actionable
.description('Read the contents of a text file from the file system')

// ❌ Bad - too vague
.description('Reads files')
```

### 2. Comprehensive Examples

Provide examples that demonstrate typical usage:

```typescript
.example({
  description: 'Read a configuration file',
  input: { path: './config.json', encoding: 'utf-8' },
  explanation: 'Reads a JSON configuration file with UTF-8 encoding',
})
```

### 3. Document Limitations

Be explicit about what the tool cannot do:

```typescript
.limitation('Cannot read binary files larger than 10MB')
.limitation('Requires read permissions on the file')
.limitation('Does not follow symbolic links')
```

### 4. Use Appropriate Categories

Choose categories that match the tool's primary purpose:

```typescript
// ✅ Good - primary purpose is file operations
toolBuilder()
  .name('read-json-file')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['file', 'json', 'read'])

// ❌ Bad - DATA is not the primary purpose
toolBuilder()
  .name('read-json-file')
  .category(ToolCategory.DATA)
```

### 5. Validate Inputs

Use Zod schemas to validate and transform inputs:

```typescript
.schema(z.object({
  path: z.string()
    .min(1, 'Path cannot be empty')
    .describe('Path to the file'),
  encoding: z.enum(['utf-8', 'ascii', 'base64'])
    .default('utf-8')
    .describe('File encoding'),
  maxSize: z.number()
    .positive()
    .optional()
    .describe('Maximum file size in bytes'),
}))
```

## Common Patterns

### Error Handling

```typescript
.implement(async ({ path }) => {
  try {
    const fs = await import('fs/promises');
    return await fs.readFile(path, 'utf-8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${path}`);
    }
    if (error.code === 'EACCES') {
      throw new Error(`Permission denied: ${path}`);
    }
    throw error;
  }
})
```

### Async Operations

All tool implementations must be async:

```typescript
// ✅ Good - async function
.implement(async ({ url }) => {
  const response = await fetch(url);
  return await response.text();
})

// ❌ Bad - sync function
.implement(({ value }) => {
  return value * 2; // Should be: return Promise.resolve(value * 2)
})
```

### Composing Tools

Build complex tools from simpler ones:

```typescript
const readJsonTool = toolBuilder()
  .name('read-json-file')
  .description('Read and parse a JSON file')
  .category(ToolCategory.FILE_SYSTEM)
  .schema(z.object({
    path: z.string().describe('Path to JSON file'),
  }))
  .implement(async ({ path }) => {
    // Use the read-file tool
    const content = await readFileTool.execute({ path, encoding: 'utf-8' });
    return JSON.parse(content);
  })
  .build();
```

## Next Steps

- [API Reference](/api/core#tool-system) - Complete API documentation
- [Standard Tools](/api/tools) - 68+ pre-built tools
- [Custom Tools Tutorial](/tutorials/custom-tools) - Build your own tools
- [Agent Patterns](/guide/concepts/patterns) - Use tools with agents

