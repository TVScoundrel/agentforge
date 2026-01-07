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
    input: z.string()
  }))
  .implement(async ({ input }) => {
    return { success: true, data: input };
  })
  .build();
```

#### Methods

- **`.name(name: string)`** - Set tool name (required)
- **`.description(desc: string)`** - Set description (required)
- **`.category(category: ToolCategory)`** - Set category
- **`.tags(tags: string[])`** - Add tags for discovery
- **`.schema(schema: ZodSchema)`** - Define input schema (required)
- **`.examples(examples: Example[])`** - Add usage examples
- **`.implement(fn: ToolFunction)`** - Implement tool logic (required)
- **`.build()`** - Build the tool

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
const webTools = registry.findByCategory(ToolCategory.WEB);
const searchTools = registry.findByTag('search');
const tool = registry.get('tool-name');

// List all tools
const allTools = registry.list();
```

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

