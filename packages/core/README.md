# @agentforge/core

> Core abstractions for AgentForge - production-ready framework for building deep agents with LangGraph

[![npm version](https://img.shields.io/npm/v/@agentforge/core)](https://www.npmjs.com/package/@agentforge/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](../../LICENSE)

## 🎉 Status: Production Ready & Published

**All features complete** | **500+ tests passing** | **Full TypeScript support** | **Comprehensive documentation**

## ✨ Features

### 🛠️ Tool System
- **Rich Metadata** - Categories, tags, examples, and detailed descriptions
- **Fluent Builder API** - Easy tool creation with `createTool()`
- **Tool Registry** - Centralized management with querying and events
- **LangChain Integration** - Seamless conversion to/from LangChain tools
- **Prompt Generation** - Automatic LLM-friendly prompt generation
- **113 tests** - Comprehensive test coverage

### 📊 LangGraph Utilities
- **State Management** - Type-safe state annotations with Zod validation
- **Workflow Builders** - Sequential, parallel, and conditional patterns
- **Error Handling** - Retry, error handling, and timeout utilities
- **Subgraph Composition** - Reusable subgraph utilities
- **Memory & Persistence** - Checkpointer and thread management
- **Observability** - LangSmith integration, metrics, logging, error reporting
- **158 tests** - Full coverage of all utilities

### � Middleware System
- **Composable Middleware** - Caching, rate limiting, validation, concurrency control
- **Production Presets** - Ready-to-use middleware stacks
- **Development Tools** - Logging, debugging, and testing middleware
- **94 tests** - Comprehensive middleware testing

### 🌊 Streaming & Real-time
- **Stream Transformers** - Filter, map, batch, debounce, throttle
- **Stream Aggregators** - Collect, reduce, window operations
- **SSE Support** - Server-Sent Events for real-time updates
- **WebSocket Support** - Bidirectional streaming
- **Progress Tracking** - Monitor long-running operations
- **68 tests** - Full streaming coverage

### 🛠️ Advanced Tools
- **Async Execution** - Parallel and sequential tool execution
- **Lifecycle Management** - Setup, teardown, and cleanup hooks
- **Tool Composition** - Combine tools into pipelines
- **Testing Utilities** - Mock tools and test helpers

### 📦 Resource Management
- **Connection Pooling** - Efficient resource reuse
- **Memory Management** - Automatic cleanup and limits
- **Batch Processing** - Efficient bulk operations
- **Circuit Breaker** - Fault tolerance and resilience

### � Monitoring
- **Health Checks** - System and component health monitoring
- **Profiling** - Performance metrics and bottleneck detection
- **Alerts** - Configurable alerting system
- **Audit Logging** - Comprehensive activity tracking

### 🚀 Deployment
- **Docker Support** - Production-ready containers
- **Kubernetes** - Deployment manifests and guides
- **CI/CD Templates** - GitHub Actions, GitLab CI
- **Configuration Management** - Environment-based config

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

📚 **[Full Documentation](https://tvscoundrel.github.io/agentforge/)**

### Core Guides
- [Getting Started](https://tvscoundrel.github.io/agentforge/guide/getting-started)
- [Core Concepts](https://tvscoundrel.github.io/agentforge/guide/concepts/tools)
- [API Reference](https://tvscoundrel.github.io/agentforge/api/core)

### Tutorials
- [Building Your First Agent](https://tvscoundrel.github.io/agentforge/tutorials/first-agent)
- [Creating Custom Tools](https://tvscoundrel.github.io/agentforge/tutorials/custom-tools)
- [Advanced Patterns](https://tvscoundrel.github.io/agentforge/tutorials/advanced-patterns)

## Examples

See the [examples documentation](https://tvscoundrel.github.io/agentforge/examples/react-agent) for complete working examples.

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

## 🔗 Links

- [GitHub Repository](https://github.com/TVScoundrel/agentforge)
- [npm Package](https://www.npmjs.com/package/@agentforge/core)
- [Changelog](https://tvscoundrel.github.io/agentforge/changelog.html) - See what's new before upgrading
- [Report Issues](https://github.com/TVScoundrel/agentforge/issues)

## License

MIT © 2026 Tom Van Schoor

