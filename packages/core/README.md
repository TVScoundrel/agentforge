# @agentforge/core

Core abstractions for AgentForge - production-ready deep agents framework.

## Status

✅ **Phase 1 & 2 Complete** | 🚧 **Phase 3 In Progress** - Foundation + ReAct Core Ready

**300 tests passing** | **Full TypeScript support** | **Comprehensive documentation**

## Features

### ✅ Production Ready (Phase 1 & 2)

**Phase 1: Tool System** (113 tests)
- **Tool Metadata** - Rich metadata with categories, tags, examples
- **Tool Builder** - Fluent API for creating tools
- **Tool Registry** - Centralized management with querying and events
- **LangChain Integration** - Seamless conversion to LangChain tools
- **Prompt Generation** - Automatic LLM prompt generation

**Phase 2: LangGraph Utilities** (158 tests)
- **State Management** - Type-safe state annotations with Zod validation
- **Workflow Builders** - Sequential, parallel, and conditional patterns
- **Error Handling** - Retry, error handling, and timeout utilities
- **Subgraph Composition** - Reusable subgraph utilities
- **Memory & Persistence** - Checkpointer and thread management
- **Observability** - LangSmith integration, metrics, logging, error reporting

### 🚧 In Progress (Phase 3)

**Phase 3.1.1-3.1.3: ReAct Pattern Core** (29 tests) ✅
- **ReAct State** - State definition with Zod schemas
- **Agent Builder** - `createReActAgent()` factory function
- **Prompt Templates** - System prompts and reasoning templates
- **Reasoning Node** - Generates thoughts and decides on actions
- **Action Node** - Executes tools with error handling
- **Observation Node** - Processes results and updates scratchpad

**Phase 3.1.4: ReAct Integration** (In Progress)
- Fluent builder API (consistent with Phase 1 tool builder)
- Complete workflow with routing logic
- Working examples (Q&A, multi-step reasoning, tool chaining)
- Integration tests

### 📋 Coming Soon

**Phase 3.2-3.4: More Agent Patterns**
- Plan-Execute pattern
- Reflection pattern
- Multi-agent coordination

**Phase 4: Middleware System**
- Logging, tracing, caching middleware
- Rate limiting and retry middleware

**Phase 5: Production Features**
- Streaming support
- Performance monitoring
- Production deployment guides

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

