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

## Registering Tools

Once you've created your tools, register them with a `ToolRegistry`:

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

// Query tools
const allTools = registry.getAll();
const fileTools = registry.getByCategory(ToolCategory.FILE_SYSTEM);
const weatherTools = registry.getByTag('weather');
```

## Using Tools with Agents

Use your custom tools with any AgentForge pattern:

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

const agent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4' }),
  tools: registry.toLangChainTools(), // Convert all tools
  systemPrompt: 'You are a helpful assistant with access to various tools.'
});

// Run the agent
const result = await agent.invoke({
  input: 'What is the weather in San Francisco?'
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
- [Standard Tools](/api/tools) - 68+ pre-built tools
- [Agent Patterns](/guide/concepts/patterns) - Use tools with agents

