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

### Pattern 2: Tool with Complex Schema

**Before:**
```typescript
const searchTool = new DynamicStructuredTool({
  name: 'search',
  description: 'Search for information',
  schema: z.object({
    query: z.string(),
    filters: z.object({
      category: z.string().optional(),
      dateRange: z.object({
        start: z.string(),
        end: z.string(),
      }).optional(),
    }).optional(),
    limit: z.number().default(10),
  }),
  func: async (input) => {
    // Search implementation
    return JSON.stringify(results);
  },
});
```

**After:**
```typescript
const searchTool = toolBuilder()
  .name('search')
  .description('Search for information with advanced filtering')
  .category(ToolCategory.DATA)
  .tag('search')
  .tag('query')
  .usageNotes('Date ranges should be in ISO 8601 format (YYYY-MM-DD)')
  .limitation('Maximum 100 results per query')
  .limitation('Search is case-insensitive')
  .example({
    description: 'Basic search',
    input: { query: 'machine learning' },
    explanation: 'Searches for "machine learning" with default settings',
  })
  .example({
    description: 'Search with filters',
    input: {
      query: 'AI research',
      filters: {
        category: 'papers',
        dateRange: { start: '2023-01-01', end: '2023-12-31' },
      },
      limit: 20,
    },
    explanation: 'Searches for AI research papers from 2023, limited to 20 results',
  })
  .schema(z.object({
    query: z.string().describe('The search query'),
    filters: z.object({
      category: z.string().optional().describe('Filter by category'),
      dateRange: z.object({
        start: z.string().describe('Start date (YYYY-MM-DD)'),
        end: z.string().describe('End date (YYYY-MM-DD)'),
      }).optional().describe('Date range filter'),
    }).optional().describe('Optional filters'),
    limit: z.number().default(10).describe('Maximum number of results'),
  }))
  .implement(async (input) => {
    // Search implementation
    return JSON.stringify(results);
  })
  .build();
```

### Pattern 3: Migrating Multiple Tools

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

### Pattern 4: Tool with Error Handling

**Before:**
```typescript
const apiTool = new DynamicStructuredTool({
  name: 'api-call',
  description: 'Call an external API',
  schema: z.object({ endpoint: z.string() }),
  func: async ({ endpoint }) => {
    try {
      const response = await fetch(endpoint);
      return await response.text();
    } catch (error) {
      return `Error: ${error.message}`;
    }
  },
});
```

**After:**
```typescript
const apiTool = toolBuilder()
  .name('api-call')
  .description('Call an external API endpoint')
  .category(ToolCategory.WEB)
  .tag('api')
  .usageNotes('Returns error message if request fails')
  .limitation('Timeout: 30 seconds')
  .limitation('Does not follow redirects')
  .example({
    description: 'Call a REST API',
    input: { endpoint: 'https://api.example.com/data' },
    explanation: 'Fetches data from the API endpoint',
  })
  .schema(z.object({
    endpoint: z.string().url().describe('The API endpoint URL'),
  }))
  .implement(async ({ endpoint }) => {
    try {
      const response = await fetch(endpoint);
      return await response.text();
    } catch (error) {
      return `Error: ${error.message}`;
    }
  })
  .build();
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

### Event Listeners

Monitor registry changes:

```typescript
import { RegistryEvent } from '@agentforge/core';

registry.on(RegistryEvent.TOOL_REGISTERED, (tool) => {
  console.log(`New tool registered: ${tool.metadata.name}`);
});

registry.on(RegistryEvent.TOOL_REMOVED, (tool) => {
  console.log(`Tool removed: ${tool.metadata.name}`);
});
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

### Type Safety with Zod

AgentForge leverages Zod for runtime validation:

```typescript
const tool = toolBuilder()
  .name('typed-tool')
  .description('A tool with strong typing')
  .category(ToolCategory.UTILITY)
  .schema(z.object({
    name: z.string().min(1).describe('User name'),
    age: z.number().int().positive().describe('User age'),
    email: z.string().email().describe('User email'),
    tags: z.array(z.string()).optional().describe('User tags'),
  }))
  .implement(async (input) => {
    // input is fully typed!
    // TypeScript knows: input.name is string, input.age is number, etc.
    return `Hello ${input.name}, age ${input.age}`;
  })
  .build();

// Invalid input will throw ZodError
await tool.execute({ name: '', age: -5 }); // ❌ Validation error
await tool.execute({ name: 'John', age: 30 }); // ✅ Valid
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

Or use `createToolUnsafe()` to skip validation (not recommended):
```typescript
import { createToolUnsafe } from '@agentforge/core';

const tool = createToolUnsafe({
  metadata: { /* ... */ },
  schema: z.object({
    path: z.string(), // No description required
  }),
  execute: async (input) => { /* ... */ },
});
```

### Issue: Converting back to LangChain

**Problem:**
```typescript
const langchainTool = myTool.toLangChainTool();
// Error: toLangChainTool is not a function
```

**Solution:**
Make sure you're calling it on an AgentForge tool, not a LangChain tool:
```typescript
// ✅ Correct
const agentforgeTool = toolBuilder()./* ... */.build();
const langchainTool = agentforgeTool.toLangChainTool();

// Or use the converter function
import { toLangChainTool } from '@agentforge/core';
const langchainTool = toLangChainTool(agentforgeTool);
```

### Issue: Tool execution returns wrong type

**Problem:**
LangChain tools must return strings, but your tool returns an object.

**Solution:**
AgentForge automatically converts non-string results to strings:
```typescript
.implement(async (input) => {
  const result = { data: [1, 2, 3] };
  return result; // ✅ Automatically converted to JSON string
})
```

Or explicitly convert:
```typescript
.implement(async (input) => {
  const result = { data: [1, 2, 3] };
  return JSON.stringify(result); // ✅ Explicit conversion
})
```

### Issue: Duplicate tool names in registry

**Problem:**
```typescript
registry.register(tool1);
registry.register(tool1); // ❌ Error: Tool already registered
```

**Solution:**
Use `update()` to modify existing tools:
```typescript
registry.register(tool1);
registry.update('tool-1', updatedTool1); // ✅ Updates existing tool
```

Or check before registering:
```typescript
if (!registry.has('tool-1')) {
  registry.register(tool1);
}
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

**Why:** Good examples serve as documentation and help LLMs learn usage patterns.

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

**Why:** Limitations help prevent misuse and set correct expectations.

### 4. Use Appropriate Categories

```typescript
// File operations
.category(ToolCategory.FILE_SYSTEM)

// HTTP requests, web scraping
.category(ToolCategory.WEB)

// Database queries
.category(ToolCategory.DATABASE)

// Math, string manipulation, etc.
.category(ToolCategory.UTILITY)

// Data processing, analysis
.category(ToolCategory.DATA)

// Code execution, compilation
.category(ToolCategory.CODE)

// AI/ML operations
.category(ToolCategory.AI)
```

**Why:** Categories enable better organization and filtering.

### 5. Add Relevant Tags

```typescript
.tag('file')
.tag('read')
.tag('io')
.tag('filesystem')
```

**Why:** Tags improve searchability and discoverability.

### 6. Use the Registry for Organization

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

**Why:** The registry provides powerful querying and organization capabilities.

### 7. Validate Input Thoroughly

```typescript
.schema(z.object({
  email: z.string().email().describe('User email address'),
  age: z.number().int().positive().max(150).describe('User age'),
  url: z.string().url().describe('Website URL'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Date (YYYY-MM-DD)'),
}))
```

**Why:** Zod validation catches errors before execution, improving reliability.

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

## Complete Migration Example

Here's a complete before/after example:

### Before (Raw LangChain)

```typescript
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';

// Define tools
const weatherTool = new DynamicStructuredTool({
  name: 'get-weather',
  description: 'Get weather for a location',
  schema: z.object({
    location: z.string(),
  }),
  func: async ({ location }) => {
    // Implementation
    return `Weather in ${location}: Sunny, 72°F`;
  },
});

const newsTool = new DynamicStructuredTool({
  name: 'get-news',
  description: 'Get latest news',
  schema: z.object({
    topic: z.string(),
  }),
  func: async ({ topic }) => {
    // Implementation
    return `Latest news about ${topic}`;
  },
});

// Create agent
const agent = createReactAgent({
  model: new ChatOpenAI(),
  tools: [weatherTool, newsTool],
});
```

### After (AgentForge)

```typescript
import { toolBuilder, ToolCategory, ToolRegistry } from '@agentforge/core';
import { z } from 'zod';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';

// Create registry
const registry = new ToolRegistry();

// Define tools with rich metadata
const weatherTool = toolBuilder()
  .name('get-weather')
  .description('Get current weather information for a location')
  .category(ToolCategory.WEB)
  .tag('weather')
  .tag('api')
  .usageNotes('Location can be city name, zip code, or coordinates')
  .limitation('Only supports US locations')
  .example({
    description: 'Get weather for a city',
    input: { location: 'San Francisco' },
    explanation: 'Returns current weather conditions for San Francisco',
  })
  .schema(z.object({
    location: z.string().describe('City name, zip code, or coordinates'),
  }))
  .implement(async ({ location }) => {
    // Implementation
    return `Weather in ${location}: Sunny, 72°F`;
  })
  .build();

const newsTool = toolBuilder()
  .name('get-news')
  .description('Get latest news articles about a topic')
  .category(ToolCategory.WEB)
  .tag('news')
  .tag('api')
  .usageNotes('Returns top 5 most recent articles')
  .limitation('News from last 24 hours only')
  .example({
    description: 'Get tech news',
    input: { topic: 'artificial intelligence' },
    explanation: 'Returns latest AI-related news articles',
  })
  .schema(z.object({
    topic: z.string().describe('News topic or keyword'),
  }))
  .implement(async ({ topic }) => {
    // Implementation
    return `Latest news about ${topic}`;
  })
  .build();

// Register tools
registry.registerMany([weatherTool, newsTool]);

// Generate prompt for LLM (optional)
const toolPrompt = registry.generatePrompt({
  includeExamples: true,
  groupByCategory: true,
});
console.log('Tool descriptions for LLM:\n', toolPrompt);

// Convert to LangChain and create agent
const agent = createReactAgent({
  model: new ChatOpenAI(),
  tools: registry.toLangChainTools(), // Seamless conversion!
});
```

---

## Next Steps

After migrating your tools:

1. **Explore the Registry** - Use querying and search features
2. **Generate Prompts** - Leverage automatic prompt generation
3. **Add More Metadata** - Enhance tools with examples and notes
4. **Organize by Category** - Group related tools together
5. **Share Tools** - Export and share tool definitions with your team

---

## Need Help?

- 📚 [API Documentation](./API.md)
- 🔧 [Tool Registry Spec](./TOOL_REGISTRY_SPEC.md)
- 💡 [Examples](../packages/core/examples/)
- 🐛 [Report Issues](https://github.com/TVScoundrel/agentforge/issues)

---

**Happy Migrating! 🚀**


