# @agentforge/core

Core abstractions for AgentForge - production-ready deep agents framework.

## Status

🚧 **In Development** - MVP Phase

## Features

### ✅ Implemented

- **Tool System** - Type-safe tool definitions with Zod schemas
- **LangChain Integration** - Seamless conversion between AgentForge and LangChain tools
- **LangGraph Integration** - Type-safe state management utilities

### 🚧 Planned

- **Agent Core** - Base agent abstractions
- **Advanced Workflows** - Complex agent orchestration patterns

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

### LangGraph State Management

```typescript
import { StateGraph } from '@langchain/langgraph';
import { createStateAnnotation } from '@agentforge/core';
import { z } from 'zod';

const AgentState = createStateAnnotation({
  messages: {
    schema: z.array(z.string()),
    reducer: (left, right) => [...left, ...right],
    default: () => []
  }
});

const workflow = new StateGraph(AgentState)
  .addNode('process', (state) => ({ messages: ['processed'] }))
  .compile();
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

