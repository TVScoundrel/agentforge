# Migration Guide: LangChain → AgentForge

> Complete guide for migrating from raw LangChain tools to AgentForge's enhanced tool system

---

## Table of Contents

- [Why Migrate?](#why-migrate)
- [Quick Comparison](#quick-comparison)
- [Step-by-Step Migration](#step-by-step-migration)
- [Common Patterns](#common-patterns)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)

---

## Why Migrate?

AgentForge builds on top of LangChain, providing:

✅ **Rich Metadata** - Add examples, usage notes, limitations, and more  
✅ **Type Safety** - Full TypeScript support with Zod validation  
✅ **Better DX** - Fluent builder API for creating tools  
✅ **Discoverability** - Registry system with search and categorization  
✅ **Auto Prompts** - Generate LLM prompts automatically from metadata  
✅ **100% Compatible** - Convert back to LangChain tools anytime  

---

## Quick Comparison

### Before (Raw LangChain)

```typescript
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const readFileTool = new DynamicStructuredTool({
  name: 'read-file',
  description: 'Read a file from the file system',
  schema: z.object({
    path: z.string(),
  }),
  func: async ({ path }) => {
    return fs.readFileSync(path, 'utf-8');
  },
});
```

### After (AgentForge)

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

const readFileTool = toolBuilder()
  .name('read-file')
  .description('Read a file from the file system')
  .category(ToolCategory.FILE_SYSTEM)
  .tag('file')
  .tag('read')
  .usageNotes('Paths are relative to the current working directory')
  .limitation('Cannot read binary files larger than 10MB')
  .example({
    description: 'Read a text file',
    input: { path: './README.md' },
    explanation: 'Reads the README file in the current directory',
  })
  .schema(z.object({
    path: z.string().describe('Path to the file to read'),
  }))
  .implement(async ({ path }) => {
    return fs.readFileSync(path, 'utf-8');
  })
  .build();

// Convert back to LangChain when needed
const langchainTool = readFileTool.toLangChainTool();
```

**Key Differences:**
- 📝 Rich metadata (category, tags, examples, notes)
- 🔍 Better discoverability
- 📚 Self-documenting
- 🔄 Bidirectional conversion

---

## Step-by-Step Migration

### Step 1: Install AgentForge

```bash
pnpm add @agentforge/core
# or
npm install @agentforge/core
# or
yarn add @agentforge/core
```

### Step 2: Import the Builder

```typescript
// Before
import { DynamicStructuredTool } from '@langchain/core/tools';

// After
import { toolBuilder, ToolCategory } from '@agentforge/core';
```

### Step 3: Convert Your Tool

Let's migrate a complete example:

#### Before (LangChain)

```typescript
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';

const httpRequestTool = new DynamicStructuredTool({
  name: 'http-request',
  description: 'Make an HTTP request to a URL',
  schema: z.object({
    url: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
    headers: z.record(z.string()).optional(),
    body: z.any().optional(),
  }),
  func: async ({ url, method = 'GET', headers, body }) => {
    const response = await axios({
      url,
      method,
      headers,
      data: body,
    });
    return JSON.stringify(response.data);
  },
});
```

#### After (AgentForge)

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import axios from 'axios';

const httpRequestTool = toolBuilder()
  .name('http-request')
  .description('Make an HTTP request to a URL')
  .category(ToolCategory.WEB)
  .tag('http')
  .tag('api')
  .tag('web')
  .usageNotes('Supports GET, POST, PUT, and DELETE methods. Returns response as JSON string.')
  .limitation('Maximum response size: 10MB')
  .limitation('Timeout: 30 seconds')
  .example({
    description: 'GET request to fetch data',
    input: {
      url: 'https://api.example.com/users',
      method: 'GET',
    },
    explanation: 'Fetches user data from the API',
  })
  .example({
    description: 'POST request with JSON body',
    input: {
      url: 'https://api.example.com/users',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { name: 'John Doe', email: 'john@example.com' },
    },
    explanation: 'Creates a new user via POST request',
  })
  .schema(z.object({
    url: z.string().url().describe('The URL to request'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE'])
      .default('GET')
      .describe('HTTP method to use'),
    headers: z.record(z.string())
      .optional()
      .describe('HTTP headers to include'),
    body: z.any()
      .optional()
      .describe('Request body (for POST/PUT)'),
  }))
  .implement(async ({ url, method = 'GET', headers, body }) => {
    const response = await axios({
      url,
      method,
      headers,
      data: body,
    });
    return JSON.stringify(response.data);
  })
  .build();
```

### Step 4: Use with LangChain (Optional)

AgentForge tools are fully compatible with LangChain:

```typescript
// Convert to LangChain tool
const langchainTool = httpRequestTool.toLangChainTool();

// Use with LangChain agent
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';

const agent = createReactAgent({
  model: new ChatOpenAI(),
  tools: [langchainTool], // Works seamlessly!
});
```

---

## Common Patterns

### Pattern 1: Simple Tool Migration

**Before:**
```typescript
const calculatorTool = new DynamicStructuredTool({
  name: 'calculator',
  description: 'Perform basic math operations',
  schema: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number(),
    b: z.number(),
  }),
  func: async ({ operation, a, b }) => {
    switch (operation) {
      case 'add': return String(a + b);
      case 'subtract': return String(a - b);
      case 'multiply': return String(a * b);
      case 'divide': return String(a / b);
    }
  },
});
```

**After:**
```typescript
const calculatorTool = toolBuilder()
  .name('calculator')
  .description('Perform basic math operations')
  .category(ToolCategory.UTILITY)
  .tag('math')
  .tag('calculator')
  .limitation('Division by zero returns Infinity')
  .example({
    description: 'Add two numbers',
    input: { operation: 'add', a: 5, b: 3 },
  })
  .schema(z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide'])
      .describe('The math operation to perform'),
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }))
  .implement(async ({ operation, a, b }) => {
    switch (operation) {
      case 'add': return String(a + b);
      case 'subtract': return String(a - b);
      case 'multiply': return String(a * b);
      case 'divide': return String(a / b);
    }
  })
  .build();
```

### Pattern 2: Migrating Multiple Tools

**Before:**
```typescript
const tools = [
  new DynamicStructuredTool({ /* tool 1 */ }),
  new DynamicStructuredTool({ /* tool 2 */ }),
  new DynamicStructuredTool({ /* tool 3 */ }),
];
```

**After:**
```typescript
import { ToolRegistry } from '@agentforge/core';

const registry = new ToolRegistry();

// Create and register tools
const tool1 = toolBuilder()
  .name('tool-1')
  // ... metadata
  .build();

const tool2 = toolBuilder()
  .name('tool-2')
  // ... metadata
  .build();

const tool3 = toolBuilder()
  .name('tool-3')
  // ... metadata
  .build();

// Register all at once
registry.registerMany([tool1, tool2, tool3]);

// Convert entire registry to LangChain
const langchainTools = registry.toLangChainTools();

// Or query specific tools
const fileTools = registry.getByCategory(ToolCategory.FILE_SYSTEM);
const langchainFileTools = fileTools.map(t => t.toLangChainTool());
```

---

## Advanced Features

### Using the Tool Registry

The registry provides powerful organization and querying capabilities:

```typescript
import { ToolRegistry, ToolCategory } from '@agentforge/core';

const registry = new ToolRegistry();

// Register tools
registry.register(readFileTool);
registry.register(writeFileTool);
registry.register(httpRequestTool);

// Query by category
const fileTools = registry.getByCategory(ToolCategory.FILE_SYSTEM);
console.log(`Found ${fileTools.length} file system tools`);

// Search by name or description
const searchResults = registry.search('http');
console.log('HTTP-related tools:', searchResults.map(t => t.metadata.name));

// Get by tag
const apiTools = registry.getByTag('api');

// Generate prompt for LLM
const prompt = registry.generatePrompt({
  includeExamples: true,
  groupByCategory: true,
  maxExamplesPerTool: 2,
});
console.log(prompt);
```

### Generating LLM Prompts

Automatically generate tool descriptions for your LLM:

```typescript
// Basic prompt
const basicPrompt = registry.generatePrompt();

// Detailed prompt with examples
const detailedPrompt = registry.generatePrompt({
  includeExamples: true,
  includeNotes: true,
  includeLimitations: true,
  groupByCategory: true,
});

// Filtered prompt (only specific categories)
const filePrompt = registry.generatePrompt({
  categories: [ToolCategory.FILE_SYSTEM],
  includeExamples: true,
});
```

---

## Troubleshooting

### Issue: "Tool name must be kebab-case"

**Problem:**
```typescript
toolBuilder()
  .name('myTool') // ❌ camelCase not allowed
  .name('my_tool') // ❌ snake_case not allowed
  .name('My Tool') // ❌ spaces not allowed
```

**Solution:**
```typescript
toolBuilder()
  .name('my-tool') // ✅ kebab-case
```

### Issue: "Schema descriptions are required"

**Problem:**
```typescript
.schema(z.object({
  path: z.string(), // ❌ Missing description
}))
```

**Solution:**
```typescript
.schema(z.object({
  path: z.string().describe('Path to the file'), // ✅ Has description
}))
```

### Issue: Converting back to LangChain

**Problem:**
```typescript
const langchainTool = myTool.toLangChainTool();
// Error: toLangChainTool is not a function
```

**Solution:**
Make sure you're calling it on an AgentForge tool:
```typescript
// ✅ Correct
const agentforgeTool = toolBuilder()./* ... */.build();
const langchainTool = agentforgeTool.toLangChainTool();

// Or use the converter function
import { toLangChainTool } from '@agentforge/core';
const langchainTool = toLangChainTool(agentforgeTool);
```

---

## Best Practices

### 1. Always Add Descriptions to Schema Fields

**Bad:**
```typescript
.schema(z.object({
  path: z.string(),
  encoding: z.string(),
}))
```

**Good:**
```typescript
.schema(z.object({
  path: z.string().describe('Path to the file to read'),
  encoding: z.string().describe('File encoding (utf-8, ascii, base64)'),
}))
```

**Why:** Descriptions help LLMs understand how to use your tools correctly.

### 2. Provide Meaningful Examples

**Bad:**
```typescript
.example({
  description: 'Example',
  input: { x: 1 },
})
```

**Good:**
```typescript
.example({
  description: 'Calculate the area of a rectangle',
  input: { width: 10, height: 5 },
  explanation: 'Multiplies width (10) by height (5) to get area (50)',
})
```

### 3. Document Limitations

**Bad:**
```typescript
.description('Read a file')
```

**Good:**
```typescript
.description('Read a file from the file system')
.limitation('Cannot read binary files larger than 10MB')
.limitation('Requires read permissions on the file')
.limitation('Does not follow symbolic links')
```

### 4. Use the Registry for Organization

**Bad:**
```typescript
// Scattered tool definitions
const tool1 = toolBuilder()./* ... */.build();
const tool2 = toolBuilder()./* ... */.build();
const tool3 = toolBuilder()./* ... */.build();

// Manually manage arrays
const allTools = [tool1, tool2, tool3];
const fileTools = [tool1, tool3];
```

**Good:**
```typescript
// Centralized registry
const registry = new ToolRegistry();
registry.registerMany([tool1, tool2, tool3]);

// Easy querying
const fileTools = registry.getByCategory(ToolCategory.FILE_SYSTEM);
const searchResults = registry.search('file');
```

---

## Migration Checklist

Use this checklist when migrating each tool:

- [ ] Replace `new DynamicStructuredTool()` with `toolBuilder()`
- [ ] Add `.category()` with appropriate category
- [ ] Add `.tag()` for searchability (at least 2-3 tags)
- [ ] Add `.description()` to all schema fields
- [ ] Add at least one `.example()` showing typical usage
- [ ] Add `.usageNotes()` if there are important usage details
- [ ] Add `.limitation()` for any known limitations
- [ ] Test the tool with `.execute()`
- [ ] Verify LangChain conversion with `.toLangChainTool()`
- [ ] Add to registry if using centralized tool management

---

## Next Steps

After migrating your tools:

1. **Explore the Registry** - Use querying and search features
2. **Generate Prompts** - Leverage automatic prompt generation
3. **Add More Metadata** - Enhance tools with examples and notes
4. **Organize by Category** - Group related tools together
5. **Share Tools** - Export and share tool definitions with your team

## Related Documentation

- [Tool System Guide](/guide/concepts/tools) - Deep dive into the tool system
- [API Reference](/api/core#tool-system) - Complete API documentation
- [Standard Tools](/api/tools) - 70 pre-built tools
- [Custom Tools Tutorial](/tutorials/custom-tools) - Build your own tools

---

**Happy Migrating! 🚀**

