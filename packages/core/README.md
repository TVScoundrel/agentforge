# @agentforge/core

Core abstractions for AgentForge - production-ready deep agents framework.

## Status

🚧 **In Development** - MVP Phase

## Features

### ✅ Implemented

- **Tool System** - Type-safe tool definitions with Zod schemas
- **Tool Registry** - Centralized tool management with querying and events
- **LangChain Integration** - Seamless conversion between AgentForge and LangChain tools
- **LangGraph State Management** - Type-safe state annotations with Zod validation
- **Workflow Builders** - Sequential, parallel, and conditional workflow patterns
- **Error Handling Patterns** - Retry, error handling, and timeout utilities
- **Subgraph Composition** - Reusable subgraph utilities

### 🚧 Planned

- **Memory & Persistence** - Checkpointer and thread management utilities
- **Observability** - LangSmith integration and logging utilities
- **Agent Patterns** - ReAct, Planner-Executor, and other common patterns

## Installation

```bash
pnpm add @agentforge/core
```

## Quick Start

### Tool System

```typescript
import { createTool } from '@agentforge/core';
import { z } from 'zod';

const weatherTool = createTool({
  name: 'get_weather',
  description: 'Get current weather for a location',
  schema: z.object({
    location: z.string().describe('City name'),
    units: z.enum(['celsius', 'fahrenheit']).optional()
  }),
  execute: async ({ location, units = 'celsius' }) => {
    // Implementation
    return { temperature: 22, units, location };
  }
});
```

### LangGraph Workflow Builders

```typescript
import { createSequentialWorkflow, withRetry } from '@agentforge/core';
import { z } from 'zod';

// Create a sequential workflow
const workflow = createSequentialWorkflow(AgentState, [
  { name: 'fetch', node: fetchNode },
  { name: 'process', node: processNode },
  { name: 'save', node: saveNode },
]);

// Add error handling
const robustNode = withRetry(myNode, {
  maxAttempts: 3,
  backoff: 'exponential',
});

const app = workflow.compile();
```

## Documentation

- [Tool System](./docs/TOOL_SYSTEM.md)
- [LangChain Integration](./docs/LANGCHAIN_INTEGRATION.md)
- [LangGraph Integration](./docs/LANGGRAPH_INTEGRATION.md)

## Examples

See the [examples](./examples) directory for complete working examples.

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm dev

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## License

MIT © Paymentology

