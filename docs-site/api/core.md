# @agentforge/core

The core package provides the foundation for building AI agents with tools, middleware, streaming, and utilities.

## Installation

```bash
pnpm add @agentforge/core
```

## Tool System

### toolBuilder()

Fluent API for creating tools with rich metadata and validation.

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

const myTool = toolBuilder()
  .name('my-tool')
  .description('Tool description')
  .category(ToolCategory.UTILITY)
  .tags(['tag1', 'tag2'])
  .schema(z.object({
    input: z.string().describe('Input parameter')
  }))
  .implement(async ({ input }) => {
    return { success: true, data: input };
  })
  .build();

// Tool with relations (NEW in v0.3.9)
const editFileTool = toolBuilder()
  .name('edit-file')
  .description('Edit a file using string replacement')
  .category(ToolCategory.FILE_SYSTEM)
  .requires(['view-file'])        // Must view file first
  .suggests(['run-tests'])         // Suggest testing after edit
  .follows(['search-codebase'])    // Typically follows search
  .precedes(['run-tests'])         // Typically before tests
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
```

#### Methods

**Basic Configuration:**
- **`.name(name: string)`** - Set tool name (required)
- **`.description(desc: string)`** - Set description (required)
- **`.category(category: ToolCategory)`** - Set category (required)
- **`.tags(tags: string[])`** - Add tags for discovery
- **`.schema(schema: ZodSchema)`** - Define input schema (required)
- **`.examples(examples: Example[])`** - Add usage examples
- **`.implement(fn: ToolFunction)`** - Implement tool logic (required)

**Tool Relations (NEW in v0.3.9):**
- **`.requires(tools: string[])`** - Tools that must be called before this tool
- **`.suggests(tools: string[])`** - Tools that work well with this tool
- **`.conflicts(tools: string[])`** - Tools that conflict with this tool
- **`.follows(tools: string[])`** - Tools this typically follows in a workflow
- **`.precedes(tools: string[])`** - Tools this typically precedes in a workflow

**Build:**
- **`.build()`** - Build the tool with validation

### ToolCategory

Enum for categorizing tools:

```typescript
enum ToolCategory {
  WEB = 'web',
  DATA = 'data',
  FILE = 'file',
  UTILITY = 'utility',
  COMMUNICATION = 'communication',
  CUSTOM = 'custom'
}
```

### ToolRegistry

Manage and discover tools:

```typescript
import { ToolRegistry } from '@agentforge/core';

const registry = new ToolRegistry();

// Register tools
registry.register(myTool);
registry.registerMany([tool1, tool2, tool3]);

// Find tools
const webTools = registry.getByCategory(ToolCategory.FILE_SYSTEM);
const searchTools = registry.getByTag('search');
const tool = registry.get('tool-name');

// List all tools
const allTools = registry.getAll();

// Generate prompts for LLMs
const fullPrompt = registry.generatePrompt({
  includeExamples: true,
  includeNotes: true,
  includeLimitations: true,
  includeRelations: true,  // NEW in v0.3.8
  groupByCategory: true
});

// Minimal prompt mode (NEW in v0.3.9)
// Use with providers that have native tool calling (OpenAI, Anthropic, Gemini)
// Reduces token usage by up to 67%
const minimalPrompt = registry.generatePrompt({
  minimal: true,              // Only supplementary context
  includeRelations: true,     // Include workflow hints
  includeExamples: true,      // Include usage examples
  includeNotes: true          // Include usage notes
});
```

#### Prompt Generation Options

- **`includeExamples`** - Include usage examples
- **`includeNotes`** - Include usage notes
- **`includeLimitations`** - Include known limitations
- **`includeRelations`** - Include tool relations (NEW in v0.3.9)
- **`groupByCategory`** - Group tools by category
- **`categories`** - Filter by specific categories
- **`maxExamplesPerTool`** - Limit examples per tool
- **`minimal`** - Minimal mode for native tool calling (NEW in v0.3.9)

## Middleware System

### createMiddleware()

Create custom middleware:

```typescript
import { createMiddleware } from '@agentforge/core/middleware';

const loggingMiddleware = createMiddleware({
  name: 'logging',
  before: async (context) => {
    console.log('Before:', context.input);
    return context;
  },
  after: async (context, result) => {
    console.log('After:', result);
    return result;
  },
  onError: async (context, error) => {
    console.error('Error:', error);
    throw error;
  }
});
```

### Built-in Middleware

#### Caching

```typescript
import { caching } from '@agentforge/core/middleware';

const cache = caching({
  ttl: 3600,
  maxSize: 1000,
  keyGenerator: (input) => JSON.stringify(input)
});
```

#### Rate Limiting

```typescript
import { rateLimiting } from '@agentforge/core/middleware';

const rateLimit = rateLimiting({
  maxRequests: 100,
  windowMs: 60000
});
```

#### Retry Logic

```typescript
import { retry } from '@agentforge/core/middleware';

const retryMiddleware = retry({
  maxAttempts: 3,
  delayMs: 1000,
  backoff: 'exponential'
});
```

#### Validation

```typescript
import { validation } from '@agentforge/core/middleware';
import { z } from 'zod';

const validate = validation({
  input: z.object({
    query: z.string().min(1)
  }),
  output: z.object({
    result: z.string()
  })
});
```

#### Production Bundle

```typescript
import { production } from '@agentforge/core/middleware';

const prod = production({
  retry: { maxAttempts: 3 },
  timeout: { timeoutMs: 30000 },
  logging: { level: 'info' },
  metrics: { enabled: true }
});
```

## Streaming

### StreamManager

Manage streaming responses:

```typescript
import { StreamManager } from '@agentforge/core/streaming';

const stream = new StreamManager({
  onChunk: (chunk) => console.log(chunk),
  onComplete: () => console.log('Done'),
  onError: (error) => console.error(error)
});

await stream.start(async (write) => {
  write({ type: 'text', content: 'Hello' });
  write({ type: 'text', content: ' World' });
});
```

### SSE (Server-Sent Events)

```typescript
import { createSSEStream } from '@agentforge/core/streaming';

const sseStream = createSSEStream({
  onMessage: (data) => {
    // Send SSE message
  }
});
```

## Resource Management

### ResourcePool

Manage connections and resources:

```typescript
import { ResourcePool } from '@agentforge/core/resources';

const pool = new ResourcePool({
  create: async () => createConnection(),
  destroy: async (conn) => conn.close(),
  validate: async (conn) => conn.isAlive(),
  min: 2,
  max: 10
});

const resource = await pool.acquire();
try {
  // Use resource
} finally {
  pool.release(resource);
}
```

## Monitoring

### HealthCheck

```typescript
import { HealthCheck } from '@agentforge/core/monitoring';

const health = new HealthCheck();

health.addCheck('database', async () => {
  // Check database connection
  return { healthy: true };
});

const status = await health.check();
```

### Metrics

```typescript
import { MetricsCollector } from '@agentforge/core/monitoring';

const metrics = new MetricsCollector();

metrics.increment('requests');
metrics.gauge('active_connections', 5);
metrics.histogram('response_time', 150);
```

## Type Definitions

All exports include full TypeScript definitions. See the [source code](https://github.com/TVScoundrel/agentforge/tree/main/packages/core/src) for complete type information.

