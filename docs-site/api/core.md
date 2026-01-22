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

## Logging

### createLogger()

Create a structured logger for observability and debugging.

```typescript
import { createLogger, LogLevel } from '@agentforge/core';

// Create a logger with default settings (INFO level)
const logger = createLogger('my-agent');

// Create a logger with custom settings
const logger = createLogger('my-agent', {
  level: LogLevel.DEBUG,
  format: 'json',
  includeTimestamp: true,
  includeContext: true
});

// Use the logger
logger.debug('Processing request', { userId: 'user-123' });
logger.info('Task completed', { duration: 1500 });
logger.warn('Rate limit approaching', { usage: 95 });
logger.error('Operation failed', { error: err.message });
```

#### Parameters

- **`name`** (string) - Logger name, typically the agent or component name
- **`options`** (optional) - Logger configuration:
  - **`level`** - Minimum log level (default: `LogLevel.INFO`)
  - **`format`** - Output format: `'pretty'` or `'json'` (default: `'pretty'`)
  - **`includeTimestamp`** - Include timestamps in logs (default: `true`)
  - **`includeContext`** - Include context data in logs (default: `true`)

#### Logger Methods

- **`logger.debug(message, data?)`** - Debug-level logs (detailed execution flow)
- **`logger.info(message, data?)`** - Info-level logs (important events)
- **`logger.warn(message, data?)`** - Warning-level logs (degraded performance, retries)
- **`logger.error(message, data?)`** - Error-level logs (failures, exceptions)

### LogLevel

Enum for controlling log verbosity:

```typescript
enum LogLevel {
  DEBUG = 'debug',  // Most verbose - all logs
  INFO = 'info',    // Informational messages and above
  WARN = 'warn',    // Warnings and errors only
  ERROR = 'error'   // Errors only
}
```

#### Log Level Priority

Logs are filtered based on priority (lowest to highest):
- `DEBUG` (0) - Shows all logs
- `INFO` (1) - Shows info, warn, and error
- `WARN` (2) - Shows warn and error
- `ERROR` (3) - Shows error only

#### Environment Variable

Control log level via environment variable:

```bash
# Development - show all logs
LOG_LEVEL=debug

# Production - show info and above
LOG_LEVEL=info

# Production - errors only
LOG_LEVEL=error
```

```typescript
// Logger respects LOG_LEVEL environment variable
const logLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || LogLevel.INFO;
const logger = createLogger('my-agent', { level: logLevel });
```

#### Usage Examples

**Development debugging:**
```typescript
const logger = createLogger('agent', { level: LogLevel.DEBUG });

logger.debug('Tool selected', { tool: 'search', reasoning: '...' });
logger.debug('API request', { url: '/api/search', params: {...} });
```

**Production logging:**
```typescript
const logger = createLogger('agent', {
  level: LogLevel.INFO,
  format: 'json' // Better for log aggregation
});

logger.info('Request processed', {
  requestId: 'req-123',
  duration: 1500,
  tokensUsed: 450
});
```

**Error tracking:**
```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    context: { userId, taskId }
  });
}
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

Create SSE streams for real-time communication:

```typescript
import { createSSEStream } from '@agentforge/core/streaming';

const sseStream = createSSEStream({
  onMessage: (data) => {
    // Send SSE message
  }
});
```

### Human-in-the-Loop SSE

Specialized SSE utilities for human-in-the-loop workflows:

```typescript
import { createHumanInLoopSSE } from '@agentforge/core/streaming';
import type { HumanRequest, HumanResponse } from '@agentforge/core/langgraph';

// In your Express route
app.get('/api/stream', (req, res) => {
  const sse = createHumanInLoopSSE(res);

  // Send human request
  sse.sendHumanRequest({
    id: 'req-123',
    question: 'Approve this action?',
    priority: 'high',
    createdAt: Date.now(),
    status: 'pending'
  });

  // Send human response
  sse.sendHumanResponse({
    requestId: 'req-123',
    response: 'yes',
    respondedAt: Date.now()
  });

  // Send timeout notification
  sse.sendHumanTimeout({
    requestId: 'req-123',
    defaultResponse: 'no',
    timedOutAt: Date.now()
  });

  // Send error
  sse.sendHumanError({
    requestId: 'req-123',
    error: 'Failed to process request',
    erroredAt: Date.now()
  });
});
```

**SSE Event Types:**
- `human_request` - New request for human input
- `human_response` - Human provided a response
- `human_timeout` - Request timed out
- `human_error` - Error processing request

## LangGraph Integration

### Interrupt Utilities

Utilities for working with LangGraph's interrupt mechanism:

```typescript
import {
  isNodeInterrupt,
  extractHumanRequest,
  createInterruptResponse
} from '@agentforge/core/langgraph';

// Check if error is a NodeInterrupt
try {
  await app.invoke(input, config);
} catch (error) {
  if (isNodeInterrupt(error)) {
    // Extract human request from interrupt
    const request = extractHumanRequest(error);
    console.log('Human input needed:', request);

    // Create response to resume execution
    const response = createInterruptResponse(request.id, 'approved');

    // Resume execution with response
    await app.invoke(null, {
      ...config,
      resumeValue: response
    });
  }
}
```

### Types

```typescript
import type {
  HumanRequest,
  HumanRequestPriority,
  HumanRequestStatus,
  HumanResponse
} from '@agentforge/core/langgraph';

// HumanRequest - Request for human input
interface HumanRequest {
  id: string;
  question: string;
  context?: Record<string, unknown>;
  priority?: HumanRequestPriority;
  createdAt: number;
  timeout?: number;
  defaultResponse?: string;
  suggestions?: string[];
  status: HumanRequestStatus;
}

// HumanRequestPriority - Priority levels
type HumanRequestPriority = 'low' | 'normal' | 'high' | 'critical';

// HumanRequestStatus - Request status
type HumanRequestStatus = 'pending' | 'responded' | 'timeout' | 'error';

// HumanResponse - Response from human
interface HumanResponse {
  requestId: string;
  response: string;
  respondedAt: number;
}
```

### Usage with askHuman Tool

The `askHuman` tool (from `@agentforge/tools`) uses these utilities internally:

```typescript
import { createAskHumanTool } from '@agentforge/tools';
import { MemorySaver } from '@langchain/langgraph';

// Create agent with askHuman tool
const agent = createReActAgent({
  model: chatModel,
  tools: [createAskHumanTool()],
});

// Compile with checkpointer (required for interrupts)
const checkpointer = new MemorySaver();
const app = agent.compile({ checkpointer });

// Execute - will pause when askHuman is called
try {
  const result = await app.invoke(input, config);
} catch (error) {
  if (isNodeInterrupt(error)) {
    // Handle human request via SSE
    const request = extractHumanRequest(error);
    // Send to frontend, wait for response, resume execution
  }
}
```

See the [Human-in-the-Loop Guide](../guide/advanced/human-in-the-loop.md) for complete examples.

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

