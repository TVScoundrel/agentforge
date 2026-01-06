# AgentForge

> Production-ready framework for building deep agents with LangGraph

[![GitHub](https://img.shields.io/badge/GitHub-TVScoundrel%2Fagentforge-blue?logo=github)](https://github.com/TVScoundrel/agentforge)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-478%20passing-success)](./packages)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

**AgentForge** is a TypeScript framework that provides production-grade abstractions for building autonomous agents with LangGraph. It focuses on developer experience, type safety, and real-world production needs.

---

## ✨ Features

### ✅ Implemented
- 🛠️ **Rich Tool Registry** - Metadata-driven tools with automatic prompt generation
- 🔗 **LangChain Integration** - Seamless conversion between AgentForge and LangChain tools
- 📊 **LangGraph State Management** - Type-safe state utilities with Zod validation
- 🏗️ **Workflow Builders** - Sequential, parallel, and conditional workflow patterns
- 🔄 **Error Handling Patterns** - Retry, error handling, and timeout utilities
- 🧩 **Subgraph Composition** - Reusable subgraph utilities
- 💾 **Memory & Persistence** - Checkpointer and thread management utilities
- 📈 **Observability** - LangSmith integration, metrics, logging, and error handling
- 🤖 **Agent Patterns** - ReAct, Plan-Execute, Reflection, Multi-Agent (all complete!)
- 🔌 **Middleware System** - Composable middleware for caching, rate limiting, validation, and more
- 🔒 **Type Safety** - Full TypeScript support with Zod schemas
- 🧪 **Testing First** - Comprehensive test coverage (478 tests)
- 📚 **Documentation** - 8000+ lines of guides, examples, and API docs

### 📋 Planned
- 📦 **Standard Tools** - Common tool library
- 🛠️ **CLI Tool** - Project scaffolding and development utilities

---

## 📦 Packages

| Package | Description | Status |
|---------|-------------|--------|
| [@agentforge/core](./packages/core) | Core abstractions (tools, registry, LangGraph utilities, middleware) | ✅ Complete (Phase 1, 2 & 4) |
| [@agentforge/patterns](./packages/patterns) | Agent patterns (ReAct, Plan-Execute, Reflection, Multi-Agent) | ✅ Complete (Phase 3) |
| @agentforge/tools | Standard tool library | 📋 Planned (Phase 6) |
| @agentforge/testing | Testing utilities | 📋 Planned (Phase 6) |
| @agentforge/cli | CLI tool | 📋 Planned (Phase 6) |

---

## 🤖 Agent Patterns

AgentForge provides 4 production-ready agent patterns:

### 1. ReAct (Reasoning and Action)
Think → Act → Observe loop for exploratory tasks
```typescript
import { ReActAgentBuilder } from '@agentforge/patterns';

const agent = new ReActAgentBuilder()
  .withLLM(llm)
  .withTools([searchTool, calculatorTool])
  .build();
```

### 2. Plan-Execute
Structured planning with parallel execution
```typescript
import { createPlanExecuteAgent } from '@agentforge/patterns';

const agent = createPlanExecuteAgent({
  planner: { llm, maxSteps: 5 },
  executor: { tools, parallel: true },
});
```

### 3. Reflection
Iterative self-improvement through critique
```typescript
import { createReflectionAgent } from '@agentforge/patterns';

const agent = createReflectionAgent({
  generator: { llm },
  reflector: { llm },
  maxIterations: 3,
});
```

### 4. Multi-Agent
Coordinate specialized agents
```typescript
import { createMultiAgentSystem, registerWorkers } from '@agentforge/patterns';

const system = createMultiAgentSystem({
  supervisor: { llm, routingStrategy: 'skill-based' },
  workers: [],
  aggregator: { llm },
});

registerWorkers(system, [
  { name: 'tech_support', capabilities: ['technical'], tools: [...] },
  { name: 'billing_support', capabilities: ['billing'], tools: [...] },
]);
```

See the [Pattern Comparison Guide](./packages/patterns/docs/pattern-comparison.md) to choose the right pattern.

---

## 🔌 Middleware System

AgentForge provides a powerful middleware system for adding cross-cutting concerns to your LangGraph nodes:

### Built-in Middleware
- **Caching** - TTL-based caching with LRU eviction
- **Rate Limiting** - Token bucket, sliding window, and fixed window strategies
- **Validation** - Zod schema validation for inputs and outputs
- **Concurrency Control** - Semaphore-based concurrency limiting
- **Logging** - Structured logging with customizable levels
- **Retry** - Exponential backoff retry logic
- **Error Handling** - Graceful error handling with fallbacks
- **Timeout** - Execution timeouts for long-running operations
- **Metrics** - Performance metrics collection
- **Tracing** - Distributed tracing support

### Quick Example
```typescript
import { compose, withCache, withValidation, withRateLimit } from '@agentforge/core/middleware';
import { z } from 'zod';

const schema = z.object({ query: z.string() }).strict();

const enhancedNode = compose(
  withValidation({ inputSchema: schema }),
  withCache({ ttl: 3600000 }),
  withRateLimit({ maxRequests: 100, windowMs: 60000 }),
  myNode
);
```

### Production Presets
```typescript
import { productionPreset } from '@agentforge/core/middleware';

const productionNode = productionPreset(myNode, {
  cache: { ttl: 3600000 },
  rateLimit: { maxRequests: 100, windowMs: 60000 },
  retry: { maxAttempts: 3 },
});
```

See the [Middleware Guide](./docs/guides/middleware-guide.md) for comprehensive documentation.

---

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

---

## 📖 Documentation

### Framework
- [Framework Design](./docs/FRAMEWORK_DESIGN.md) - Architecture and design decisions
- [Roadmap](./docs/ROADMAP.md) - Development roadmap and milestones
- [Tool Registry Spec](./docs/TOOL_REGISTRY_SPEC.md) - Tool registry specification
- [Monorepo Setup](./docs/MONOREPO_SETUP.md) - Monorepo structure and setup
- [Diagrams](./docs/DIAGRAMS.md) - Visual diagrams and architecture

### Agent Patterns
- [Pattern Comparison Guide](./packages/patterns/docs/pattern-comparison.md) - Choose the right pattern
- [ReAct Pattern Guide](./packages/patterns/docs/react-agent-guide.md) - Comprehensive ReAct guide
- [Plan-Execute Pattern Guide](./packages/patterns/docs/plan-execute-pattern.md) - Comprehensive Plan-Execute guide
- [Reflection Pattern Guide](./packages/patterns/docs/reflection-pattern.md) - Comprehensive Reflection guide
- [Multi-Agent Pattern Guide](./packages/patterns/docs/multi-agent-pattern.md) - Comprehensive Multi-Agent guide

### Middleware
- [Middleware Guide](./docs/guides/middleware-guide.md) - Comprehensive middleware guide
- [Middleware API Reference](./docs/api/middleware.md) - Complete API documentation
- [Middleware Best Practices](./docs/guides/middleware-best-practices.md) - Production best practices
- [Phase 4 Complete](./docs/PHASE_4_COMPLETE.md) - Implementation details

### Examples
- [ReAct Examples](./packages/patterns/examples/react/) - 4 ReAct examples
- [Plan-Execute Examples](./packages/patterns/examples/plan-execute/) - 4 Plan-Execute examples
- [Reflection Examples](./packages/patterns/examples/reflection/) - 4 Reflection examples
- [Multi-Agent Examples](./packages/patterns/examples/multi-agent/) - 4 Multi-Agent examples

---

## 🏗️ Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Setup

```bash
# Clone the repository
git clone https://github.com/TVScoundrel/agentforge.git
cd agentforge

# Install dependencies
pnpm install

# Build packages
pnpm build
```

### Available Scripts

```bash
pnpm build          # Build all packages
pnpm dev            # Watch mode for all packages
pnpm test           # Run tests
pnpm test:coverage  # Run tests with coverage
pnpm test:ui        # Run tests with UI
pnpm lint           # Lint all packages
pnpm lint:fix       # Lint and fix all packages
pnpm format         # Format all packages
pnpm typecheck      # Type check all packages
pnpm clean          # Clean all build artifacts
```

---

## 🎯 Current Status

**Phase:** 3 - Agent Patterns 🚧 IN PROGRESS

**What's Ready for Production:**
- ✅ **Phase 1**: Tool Registry (113 tests)
  - Rich tool metadata, builder API, registry with events
  - LangChain integration, prompt generation
- ✅ **Phase 2**: LangGraph Utilities (158 tests)
  - State management, workflow builders, error handling
  - Memory & persistence, observability & logging
- 🚧 **Phase 3.1.1-3.1.3**: ReAct Pattern Core (29 tests)
  - State definition with Zod schemas
  - Agent builder with configuration
  - Reasoning, action, and observation nodes
- **Total: 300 tests passing** with comprehensive coverage

**What's In Progress:**
- 🚧 **Phase 3.1.4**: ReAct Integration & Examples (workflow, examples, integration tests)

**What's Next:**
- 📋 **Phase 3.2-3.4**: More Agent Patterns (Plan-Execute, Reflection, Multi-Agent)
- 📋 **Phase 4**: Middleware System (logging, tracing, caching)
- 📋 **Phase 5**: Production Features (streaming, monitoring)
- 📋 **Phase 6**: Developer Experience (CLI, testing utils, standard tools)

**Current State:** The core foundation is production-ready! You can build agents with tools, state management, workflows, persistence, and observability. The ReAct pattern core is complete, with integration and examples coming next.

See [ROADMAP.md](./docs/ROADMAP.md) for detailed progress.

---

## 🤝 Contributing

This is currently an internal Paymentology project. Contributions from team members are welcome!

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a pull request

---

## 📄 License

MIT © Paymentology

---

## 🙏 Acknowledgments

- Inspired by [DeepAgents](https://github.com/deepagents/deepagents)
- Built on [LangGraph](https://langchain-ai.github.io/langgraph/)
- Powered by [LangChain](https://js.langchain.com/)
