# AgentForge

> Production-ready framework for building deep agents with LangGraph

[![GitHub](https://img.shields.io/badge/GitHub-TVScoundrel%2Fagentforge-blue?logo=github)](https://github.com/TVScoundrel/agentforge)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-671%20passing-success)](./packages)
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
- 🌊 **Streaming & Real-time** - Stream transformers, aggregators, SSE, WebSocket, progress tracking
- 🛠️ **Advanced Tools** - Async execution, lifecycle management, composition, testing utilities
- 📦 **Resource Management** - Connection pooling, memory management, batch processing, circuit breaker
- 📊 **Monitoring** - Health checks, profiling, alerts, audit logging
- 🚀 **Deployment** - Docker, Kubernetes, CI/CD templates, multi-cloud guides
- 🔒 **Type Safety** - Full TypeScript support with Zod schemas
- 🧪 **Testing First** - Comprehensive test coverage (671 tests)
- 📚 **Documentation** - 10,000+ lines of guides, examples, and API docs



---

## 📦 Packages

| Package | Description | Status |
|---------|-------------|--------|
| [@agentforge/core](./packages/core) | Core abstractions (tools, registry, LangGraph utilities, middleware, streaming, resources, monitoring) | ✅ Complete (Phase 1, 2, 4 & 5) |
| [@agentforge/patterns](./packages/patterns) | Agent patterns (ReAct, Plan-Execute, Reflection, Multi-Agent) | ✅ Complete (Phase 3) |
| [@agentforge/tools](./packages/tools) | Standard tool library (web, file, data, utility tools) | ✅ Complete (Phase 6.3) |
| [@agentforge/testing](./packages/testing) | Testing utilities (mocks, assertions, fixtures) | ✅ Complete (Phase 6.2) |
| [@agentforge/cli](./packages/cli) | CLI tool (scaffolding, dev server, testing) | ✅ Complete (Phase 6.1) |

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

### Examples & Templates
- **[Examples Directory](./examples/)** - Real-world applications and integrations
  - [Research Assistant](./examples/applications/research-assistant/) - ReAct pattern for research
  - [Code Reviewer](./examples/applications/code-reviewer/) - Reflection pattern for code quality
  - [Data Analyst](./examples/applications/data-analyst/) - Plan-Execute pattern for data analysis
  - [Customer Support Bot](./examples/applications/customer-support/) - Multi-Agent pattern for support
  - [Express.js Integration](./examples/integrations/express-api/) - REST API with streaming
  - [Next.js Integration](./examples/integrations/nextjs-app/) - Full-stack app with chat UI
- **Pattern Examples**
  - [ReAct Examples](./packages/patterns/examples/react/) - 4 ReAct examples
  - [Plan-Execute Examples](./packages/patterns/examples/plan-execute/) - 4 Plan-Execute examples
  - [Reflection Examples](./packages/patterns/examples/reflection/) - 4 Reflection examples
  - [Multi-Agent Examples](./packages/patterns/examples/multi-agent/) - 4 Multi-Agent examples
- **Feature Examples**
  - [Streaming Examples](./packages/core/examples/streaming/) - 5 streaming examples (32+ demonstrations)
  - [Advanced Tools Examples](./packages/core/examples/tools/) - 4 tool examples
  - [Resource Management Examples](./packages/core/examples/resources/) - 4 resource examples
  - [Monitoring Examples](./packages/core/examples/monitoring/) - 4 monitoring examples
  - [Deployment Examples](./packages/core/examples/deployment/) - 4 deployment examples

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

**Phase:** 6 - Developer Experience ✅ COMPLETE

**🎉 AgentForge is 100% Complete and Production-Ready!**

**All Phases Complete:**
- ✅ **Phase 1**: Tool Registry (113 tests)
  - Rich tool metadata, builder API, registry with events
  - LangChain integration, prompt generation
- ✅ **Phase 2**: LangGraph Utilities (158 tests)
  - State management, workflow builders, error handling
  - Memory & persistence, observability & logging
- ✅ **Phase 3**: Agent Patterns (143 tests)
  - ReAct, Plan-Execute, Reflection, Multi-Agent patterns
  - 16 working examples with comprehensive documentation
- ✅ **Phase 4**: Middleware System (94 tests)
  - Composable middleware (caching, rate limiting, validation, concurrency)
  - Production, development, and testing presets
- ✅ **Phase 5**: Production Features (163 tests)
  - **5.1**: Streaming & Real-time (68 tests) - Stream transformers, SSE, WebSocket, progress tracking
  - **5.2**: Advanced Tools - Async execution, lifecycle, composition, testing utilities
  - **5.3**: Resource Management - Connection pooling, memory management, batch processing, circuit breaker
  - **5.4**: Monitoring - Health checks, profiling, alerts, audit logging
  - **5.5**: Deployment - Docker, Kubernetes, CI/CD, configuration management
  - 20 working examples demonstrating all features
- ✅ **Phase 6**: Developer Experience
  - **6.1**: CLI Tool - Project scaffolding, dev server, testing commands
  - **6.2**: Testing Utilities - Mocks, assertions, fixtures, test helpers
  - **6.3**: Standard Tools - 20+ production-ready tools (web, file, data, utility)
  - **6.4**: Documentation Site - Comprehensive guides, API docs, tutorials
  - **6.5**: Templates & Examples - 4 applications + 2 framework integrations
- **Total: 671 tests passing** with comprehensive coverage
- **Documentation: 10,000+ lines** of guides, examples, and API docs
- **Examples: 30+ files, 2,500+ lines** of real-world code

**What You Can Build:**
- 🤖 Autonomous agents with any pattern (ReAct, Plan-Execute, Reflection, Multi-Agent)
- 🌊 Real-time streaming applications with SSE/WebSocket
- 🔌 Production APIs with Express.js or Next.js
- 📊 Data analysis and research tools
- 💬 Customer support systems
- 🔍 Code review and quality tools
- 🚀 Enterprise-grade deployments with Docker/Kubernetes

See [ROADMAP.md](./docs/ROADMAP.md) and [PHASE_6_5_SUMMARY.md](./docs/PHASE_6_5_SUMMARY.md) for complete details.

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
