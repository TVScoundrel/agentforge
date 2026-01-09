# Custom Tools Example

This example demonstrates how to create custom tools for your agents using the AgentForge tool builder API.

## Overview

Custom tools allow you to extend your agent's capabilities with domain-specific functionality. This example shows:

- Creating simple utility tools
- Building file system tools
- Creating API integration tools
- Publishing tools to a registry

## Example 1: Simple Calculator Tool

A basic utility tool that performs arithmetic operations:

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

const calculatorTool = toolBuilder()
  .name('calculator')
  .description('Perform basic arithmetic operations')
  .category(ToolCategory.UTILITY)
  .tags(['math', 'calculator', 'arithmetic'])
  .example({
    description: 'Add two numbers',
    input: { operation: 'add', a: 5, b: 3 },
    explanation: 'Returns 8'
  })
  .schema(z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide'])
      .describe('The arithmetic operation to perform'),
    a: z.number().describe('First number'),
    b: z.number().describe('Second number')
  }))
  .implement(async ({ operation, a, b }) => {
    switch (operation) {
      case 'add': return a + b;
      case 'subtract': return a - b;
      case 'multiply': return a * b;
      case 'divide':
        if (b === 0) throw new Error('Division by zero');
        return a / b;
    }
  })
  .build();

// Use the tool
const result = await calculatorTool.execute({
  operation: 'multiply',
  a: 6,
  b: 7
});
console.log(result); // 42
```

## Example 2: File System Tool

A tool that reads files with proper error handling:

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import fs from 'fs/promises';

const readFileTool = toolBuilder()
  .name('read-file')
  .description('Read the contents of a file from the file system')
  .category(ToolCategory.FILE_SYSTEM)
  .tags(['file', 'read', 'io'])
  .usageNotes('Paths are relative to the current working directory')
  .limitation('Cannot read binary files larger than 10MB')
  .example({
    description: 'Read a text file',
    input: { path: './README.md', encoding: 'utf-8' },
    explanation: 'Reads the README file in the current directory'
  })
  .schema(z.object({
    path: z.string()
      .min(1, 'Path cannot be empty')
      .describe('Path to the file to read'),
    encoding: z.enum(['utf-8', 'ascii', 'base64'])
      .default('utf-8')
      .describe('File encoding (default: utf-8)')
  }))
  .implement(async ({ path, encoding }) => {
    try {
      const content = await fs.readFile(path, encoding);
      return content;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${path}`);
      }
      if (error.code === 'EACCES') {
        throw new Error(`Permission denied: ${path}`);
      }
      throw error;
    }
  })
  .build();
```

## Example 3: API Integration Tool

A tool that makes HTTP requests to external APIs:

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

const weatherTool = toolBuilder()
  .name('get-weather')
  .description('Get current weather information for a city')
  .category(ToolCategory.WEB)
  .tags(['weather', 'api', 'http'])
  .example({
    description: 'Get weather for San Francisco',
    input: { city: 'San Francisco', units: 'celsius' },
    explanation: 'Returns current temperature and conditions'
  })
  .schema(z.object({
    city: z.string().describe('City name'),
    units: z.enum(['celsius', 'fahrenheit'])
      .default('celsius')
      .describe('Temperature units')
  }))
  .implement(async ({ city, units }) => {
    // In a real implementation, you would call a weather API
    const response = await fetch(
      `https://api.weather.example.com/current?city=${encodeURIComponent(city)}&units=${units}`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      city,
      temperature: data.temperature,
      condition: data.condition,
      humidity: data.humidity,
      units
    };
  })
  .build();
```

## Example 4: Database Query Tool

A tool with resource management for database operations:

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';
import { Pool } from 'pg'; // PostgreSQL client

// Create a connection pool (shared resource)
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

const queryDatabaseTool = toolBuilder()
  .name('query-database')
  .description('Execute a SQL query against the database')
  .category(ToolCategory.DATABASE)
  .tags(['database', 'sql', 'query'])
  .usageNotes('Only SELECT queries are allowed for safety')
  .limitation('Maximum 1000 rows returned')
  .schema(z.object({
    query: z.string()
      .regex(/^\s*SELECT/i, 'Only SELECT queries allowed')
      .describe('SQL SELECT query to execute'),
    params: z.array(z.any())
      .optional()
      .describe('Query parameters for prepared statements')
  }))
  .implement(async ({ query, params = [] }) => {
    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return {
        rows: result.rows.slice(0, 1000), // Limit results
        rowCount: result.rowCount
      };
    } finally {
      client.release();
    }
  })
  .build();
```

## Example 5: Tools with Relations (NEW in v0.3.9)

Define tool workflows and dependencies to help LLMs make better decisions:

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

// Step 1: Search for files
const searchCodebaseTool = toolBuilder()
  .name('search-codebase')
  .description('Search for files or code patterns in the codebase')
  .category(ToolCategory.FILE_SYSTEM)
  .precedes(['view-file', 'edit-file'])  // Typically called before viewing/editing
  .schema(z.object({
    pattern: z.string().describe('Search pattern or file name')
  }))
  .implement(async ({ pattern }) => {
    // Implementation
    return { files: ['src/app.ts', 'src/utils.ts'] };
  })
  .build();

// Step 2: View file contents
const viewFileTool = toolBuilder()
  .name('view-file')
  .description('View the contents of a file')
  .category(ToolCategory.FILE_SYSTEM)
  .follows(['search-codebase'])  // Often follows search
  .precedes(['edit-file'])        // Typically before editing
  .schema(z.object({
    path: z.string().describe('File path')
  }))
  .implement(async ({ path }) => {
    // Implementation
    return { content: 'file contents...' };
  })
  .build();

// Step 3: Edit file
const editFileTool = toolBuilder()
  .name('edit-file')
  .description('Edit a file using string replacement')
  .category(ToolCategory.FILE_SYSTEM)
  .requires(['view-file'])        // MUST view file first
  .suggests(['run-tests'])         // Suggest testing after edit
  .follows(['search-codebase', 'view-file'])  // Typical workflow
  .precedes(['run-tests'])         // Usually test after editing
  .schema(z.object({
    path: z.string().describe('File path'),
    oldStr: z.string().describe('String to replace'),
    newStr: z.string().describe('Replacement string')
  }))
  .implement(async ({ path, oldStr, newStr }) => {
    // Implementation
    return { success: true };
  })
  .build();

// Step 4: Run tests
const runTestsTool = toolBuilder()
  .name('run-tests')
  .description('Run test suite to verify changes')
  .category(ToolCategory.CODE)
  .follows(['edit-file'])  // Typically follows editing
  .schema(z.object({
    path: z.string().optional().describe('Specific test file (optional)')
  }))
  .implement(async ({ path }) => {
    // Implementation
    return { passed: true, failures: 0 };
  })
  .build();
```

**Benefits of Tool Relations:**
- ✅ **Better LLM decisions** - Relations guide the LLM through proper workflows
- ✅ **Fewer errors** - `requires` prevents calling tools in wrong order
- ✅ **Improved suggestions** - `suggests` helps LLM discover related tools
- ✅ **Workflow hints** - `follows`/`precedes` show typical usage patterns

## Tool Registry & Auto-Prompt Generation

The **Tool Registry** is AgentForge's killer feature - it manages your tools and automatically generates LLM-ready prompts.

### Basic Registration

```typescript
import { ToolRegistry } from '@agentforge/core';

const registry = new ToolRegistry();

// Register individual tools
registry.register(calculatorTool);
registry.register(readFileTool);
registry.register(weatherTool);

// Or register multiple tools at once
registry.registerMany([
  calculatorTool,
  readFileTool,
  weatherTool,
  queryDatabaseTool
]);
```

### Using Standard Tools from @agentforge/tools

All 68+ tools from `@agentforge/tools` can be registered directly - they're already built with the tool builder API:

```typescript
import { ToolRegistry } from '@agentforge/core';
import {
  calculator,
  currentDateTime,
  httpGet,
  jsonParser,
  fileReader,
  fileWriter,
  stringCase,
  validateEmail
} from '@agentforge/tools';

const registry = new ToolRegistry();

// Mix custom tools with standard library tools
registry.registerMany([
  // Your custom tools
  weatherTool,
  queryDatabaseTool,

  // Standard library tools
  calculator,
  currentDateTime,
  httpGet,
  jsonParser,
  fileReader,
  fileWriter,
  stringCase,
  validateEmail
]);

// Auto-generate prompts for all tools (custom + standard)
const prompt = registry.generatePrompt({
  includeExamples: true,
  groupByCategory: true
});
```

### Querying Tools

```typescript
// Get all tools
const allTools = registry.getAll();

// Query by category
const fileTools = registry.getByCategory(ToolCategory.FILE_SYSTEM);
const webTools = registry.getByCategory(ToolCategory.WEB);

// Query by tag
const weatherTools = registry.getByTag('weather');
const apiTools = registry.getByTag('api');

// Search by name or description
const searchResults = registry.search('file');

// Check if tool exists
if (registry.has('calculator')) {
  const tool = registry.get('calculator');
}
```

### Auto-Generate LLM Prompts

The registry can automatically generate formatted tool descriptions for your LLM:

```typescript
// Basic prompt
const basicPrompt = registry.generatePrompt();
console.log(basicPrompt);
// Available Tools:
//
// - calculator: Perform basic arithmetic operations
//   Parameters: operation (enum), a (number), b (number)
// - read-file: Read a file from the file system
//   Parameters: path (string)
// ...

// Detailed prompt with examples and relations
const detailedPrompt = registry.generatePrompt({
  includeExamples: true,
  includeNotes: true,
  includeLimitations: true,
  includeRelations: true,  // NEW in v0.3.9
  groupByCategory: true,
  maxExamplesPerTool: 2
});

console.log(detailedPrompt);
// Available Tools:
//
// UTILITY TOOLS:
// - calculator: Perform basic arithmetic operations
//   Parameters: operation (enum), a (number), b (number)
//   Example: Add two numbers
//     Input: { "operation": "add", "a": 5, "b": 3 }
//     Explanation: Returns 8
//
// FILE SYSTEM TOOLS:
// - edit-file: Edit a file using string replacement
//   Parameters: path (string), oldStr (string), newStr (string)
//   Requires: view-file
//   Suggests: run-tests
//   Follows: search-codebase, view-file
//   Precedes: run-tests
//   Example: Edit a configuration file
//     Input: { "path": "./config.json", ... }
// ...

// Minimal mode for providers with native tool calling (NEW in v0.3.9)
// Use with OpenAI, Anthropic, Gemini, Mistral - reduces token usage by up to 67%
const minimalPrompt = registry.generatePrompt({
  minimal: true,              // Only supplementary context
  includeRelations: true,     // Include workflow hints
  includeExamples: true,      // Include usage examples
  includeNotes: true          // Include usage notes
});

console.log(minimalPrompt);
// ## edit-file
//   Requires: view-file
//   Suggests: run-tests
//   Follows: search-codebase, view-file
//   Example: Edit a configuration file
//     Input: { "path": "./config.json", ... }
//   Notes: Use exact string matching
// ...

// Filter by category
const fileToolsPrompt = registry.generatePrompt({
  categories: [ToolCategory.FILE_SYSTEM],
  includeExamples: true,
  includeRelations: true
});
```

### Using with Agents

Use the registry with any AgentForge pattern - the auto-generated prompt saves you from manual prompt engineering:

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

// Generate the tool prompt automatically
const toolPrompt = registry.generatePrompt({
  includeExamples: true,
  groupByCategory: true
});

const agent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4' }),
  tools: registry.toLangChainTools(), // Convert all tools
  systemPrompt: `You are a helpful assistant with access to various tools.

${toolPrompt}

Use these tools to help answer user questions.`
});

// Run the agent
const result = await agent.invoke({
  messages: [{
    role: 'user',
    content: 'What is the weather in San Francisco?'
  }]
});
```

### Multiple Registries for Different Agents

You can create **separate registries for different agents** to give each agent a specialized toolset:

```typescript
import { ToolRegistry, ToolCategory } from '@agentforge/core';
import { createReActAgent } from '@agentforge/patterns';
import {
  httpGet,
  httpPost,
  jsonParser,
  calculator,
  fileReader,
  fileWriter,
  currentDateTime
} from '@agentforge/tools';

// Registry for a web scraping agent
const webScraperRegistry = new ToolRegistry();
webScraperRegistry.registerMany([
  httpGet,
  jsonParser,
  stringCase,
  fileWriter  // Save scraped data
]);

// Registry for a data analysis agent
const dataAnalystRegistry = new ToolRegistry();
dataAnalystRegistry.registerMany([
  fileReader,
  jsonParser,
  calculator,
  currentDateTime
]);

// Registry for a general assistant
const generalRegistry = new ToolRegistry();
generalRegistry.registerMany([
  calculator,
  currentDateTime,
  httpGet,
  validateEmail
]);

// Create specialized agents with different toolsets
const webScraperAgent = createReActAgent({
  model: llm,
  tools: webScraperRegistry.toLangChainTools(),
  systemPrompt: `You are a web scraping specialist.

${webScraperRegistry.generatePrompt({ includeExamples: true, groupByCategory: true })}`
});

const dataAnalystAgent = createReActAgent({
  model: llm,
  tools: dataAnalystRegistry.toLangChainTools(),
  systemPrompt: `You are a data analysis expert.

${dataAnalystRegistry.generatePrompt({ includeExamples: true, groupByCategory: true })}`
});

const generalAgent = createReActAgent({
  model: llm,
  tools: generalRegistry.toLangChainTools(),
  systemPrompt: `You are a helpful general assistant.

${generalRegistry.generatePrompt({ includeExamples: true, groupByCategory: true })}`
});
```

**Benefits of multiple registries:**
- ✅ **Focused agents** - Each agent only has tools relevant to its purpose
- ✅ **Better performance** - Smaller tool sets = faster LLM decision making
- ✅ **Clearer prompts** - Auto-generated prompts are more concise and relevant
- ✅ **Easier maintenance** - Tools are organized by agent responsibility
- ✅ **Cost optimization** - Smaller prompts = lower token costs

### Event Listeners

Monitor registry changes with event listeners:

```typescript
import { RegistryEvent } from '@agentforge/core';

registry.on(RegistryEvent.TOOL_REGISTERED, (tool) => {
  console.log(`✅ Registered: ${tool.metadata.name}`);
});

registry.on(RegistryEvent.TOOL_REMOVED, (tool) => {
  console.log(`❌ Removed: ${tool.metadata.name}`);
});

registry.on(RegistryEvent.TOOL_UPDATED, (tool) => {
  console.log(`🔄 Updated: ${tool.metadata.name}`);
});

registry.on(RegistryEvent.REGISTRY_CLEARED, () => {
  console.log('🗑️  Registry cleared');
});
```

## Publishing Tools

To share your tools with others, you can publish them as npm packages:

### 1. Create a Package

```bash
# Create a new directory for your tool package
mkdir my-custom-tools
cd my-custom-tools

# Initialize package.json
npm init -y

# Install dependencies
npm install @agentforge/core zod
npm install -D typescript @types/node
```

### 2. Create Your Tools

```typescript
// src/index.ts
export { calculatorTool } from './calculator';
export { readFileTool } from './read-file';
export { weatherTool } from './weather';
```

### 3. Build and Publish

```bash
# Build your package
npm run build

# Publish to npm
npm publish
```

### 4. Use Published Tools

```typescript
// In another project
import { calculatorTool, weatherTool } from 'my-custom-tools';

const registry = new ToolRegistry();
registry.registerMany([calculatorTool, weatherTool]);
```

## Best Practices

### 1. Comprehensive Descriptions

Write clear descriptions that help LLMs understand when to use the tool:

```typescript
// ✅ Good - specific and actionable
.description('Read the contents of a text file from the file system')

// ❌ Bad - too vague
.description('Reads files')
```

### 2. Proper Error Handling

Always handle errors gracefully:

```typescript
.implement(async ({ path }) => {
  try {
    return await fs.readFile(path, 'utf-8');
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${path}`);
    }
    throw error;
  }
})
```

### 3. Input Validation

Use Zod schemas to validate and transform inputs:

```typescript
.schema(z.object({
  path: z.string()
    .min(1, 'Path cannot be empty')
    .describe('Path to the file'),
  encoding: z.enum(['utf-8', 'ascii', 'base64'])
    .default('utf-8')
    .describe('File encoding')
}))
```

### 4. Resource Management

Clean up resources properly:

```typescript
.implement(async ({ query }) => {
  const client = await pool.connect();
  try {
    return await client.query(query);
  } finally {
    client.release(); // Always release
  }
})
```

### 5. Document Limitations

Be explicit about what the tool cannot do:

```typescript
.limitation('Cannot read binary files larger than 10MB')
.limitation('Requires read permissions on the file')
.limitation('Does not follow symbolic links')
```

## Next Steps

- [Tool System Guide](/guide/concepts/tools) - Deep dive into the tool system
- [API Reference](/api/core#tool-system) - Complete API documentation
- [Standard Tools](/api/tools) - 69+ pre-built tools
- [Agent Patterns](/guide/concepts/patterns) - Use tools with agents

