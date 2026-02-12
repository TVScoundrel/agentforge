# AgentForge

> Production-ready framework for building deep agents with LangGraph

[![GitHub](https://img.shields.io/badge/GitHub-TVScoundrel%2Fagentforge-blue?logo=github)](https://github.com/TVScoundrel/agentforge)
[![Documentation](https://img.shields.io/badge/docs-live-brightgreen?logo=readthedocs)](https://tvscoundrel.github.io/agentforge/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-1076%20passing-success)](./packages)
[![Coverage](https://img.shields.io/badge/CLI%20coverage-98.11%25-brightgreen)](./packages/cli)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

**AgentForge** is a TypeScript framework that provides production-grade abstractions for building autonomous agents with LangGraph. It focuses on developer experience, type safety, and real-world production needs.

📚 **[View Full Documentation](https://tvscoundrel.github.io/agentforge/)** | 🚀 **[Quick Start Guide](https://tvscoundrel.github.io/agentforge/guide/quick-start)** | 💡 **[Examples](https://tvscoundrel.github.io/agentforge/examples/react-agent)**

---

## ✨ Features

### ✅ Complete & Production-Ready

**Phase 1-2: Core Foundation**
- 🛠️ **Rich Tool Registry** - Metadata-driven tools with automatic prompt generation
- 🔗 **LangChain Integration** - Seamless conversion between AgentForge and LangChain tools
- 📊 **LangGraph State Management** - Type-safe state utilities with Zod validation
- 🏗️ **Workflow Builders** - Sequential, parallel, and conditional workflow patterns
- 🔄 **Error Handling Patterns** - Retry, error handling, and timeout utilities
- 🧩 **Subgraph Composition** - Reusable subgraph utilities
- 💾 **Memory & Persistence** - Checkpointer and thread management utilities
- 📈 **Observability** - LangSmith integration, metrics, logging, and error handling

**Phase 3: Agent Patterns**
- 🤖 **ReAct Pattern** - Reasoning and Action loop for exploratory tasks
- 📋 **Plan-Execute Pattern** - Structured planning with parallel execution
- 🔍 **Reflection Pattern** - Iterative self-improvement through critique
- 👥 **Multi-Agent Pattern** - Coordinate specialized agents with supervisor routing

**Phase 4-5: Advanced Features**
- 🔌 **Middleware System** - Composable middleware for caching, rate limiting, validation
- 🌊 **Streaming & Real-time** - Stream transformers, aggregators, SSE, WebSocket, progress tracking
- 🛠️ **Advanced Tools** - Async execution, lifecycle management, composition, testing utilities
- 📦 **Resource Management** - Connection pooling, memory management, batch processing, circuit breaker
- 📊 **Monitoring** - Health checks, profiling, alerts, audit logging
- 🚀 **Deployment** - Docker, Kubernetes, CI/CD templates, multi-cloud guides

**Phase 6: Developer Experience**
- 🎯 **CLI Tool** - Project scaffolding, development, testing, deployment (156 tests, 98.11% coverage)
- 🧪 **Testing Utilities** - Mocks, assertions, fixtures for agent testing
- 📦 **Standard Tools** - 81 production-ready tools across 5 categories
- 🔒 **Type Safety** - Full TypeScript support with Zod schemas
- 📚 **Comprehensive Tests** - 1076 tests passing across all packages

**Phase 7: Documentation**
- 📖 **Complete Documentation** - 34 pages, 10,000+ lines of guides, tutorials, and API docs
- 💡 **Pattern Guides** - Detailed guides for all 4 agent patterns
- 🎓 **Tutorials** - 5 step-by-step tutorials from basics to advanced
- 📚 **Examples** - 6 complete working examples
- 🔍 **API Reference** - Full API documentation for all 5 packages



---

## 📦 Packages

All packages are **published on npm** and ready for production use!

| Package | Version | Description | npm |
|---------|---------|-------------|-----|
| [@agentforge/core](./packages/core) | 0.12.6 | Core abstractions (tools, registry, LangGraph utilities, middleware, streaming, resources, monitoring) | [![npm](https://img.shields.io/npm/v/@agentforge/core)](https://www.npmjs.com/package/@agentforge/core) |
| [@agentforge/patterns](./packages/patterns) | 0.12.6 | Agent patterns (ReAct, Plan-Execute, Reflection, Multi-Agent) | [![npm](https://img.shields.io/npm/v/@agentforge/patterns)](https://www.npmjs.com/package/@agentforge/patterns) |
| [@agentforge/tools](./packages/tools) | 0.12.6 | Standard tool library (81 production-ready tools) | [![npm](https://img.shields.io/npm/v/@agentforge/tools)](https://www.npmjs.com/package/@agentforge/tools) |
| [@agentforge/testing](./packages/testing) | 0.12.6 | Testing utilities (mocks, assertions, fixtures) | [![npm](https://img.shields.io/npm/v/@agentforge/testing)](https://www.npmjs.com/package/@agentforge/testing) |
| [@agentforge/cli](./packages/cli) | 0.12.6 | CLI tool (156 tests, 98.11% coverage) | [![npm](https://img.shields.io/npm/v/@agentforge/cli)](https://www.npmjs.com/package/@agentforge/cli) |

### Installation

```bash
# Install core package
npm install @agentforge/core

# Install agent patterns
npm install @agentforge/patterns

# Install standard tools
npm install @agentforge/tools

# Install testing utilities (dev dependency)
npm install -D @agentforge/testing

# Install CLI globally
npm install -g @agentforge/cli
```

---

## 🤖 Agent Patterns

AgentForge provides 4 production-ready agent patterns:

### 1. ReAct (Reasoning and Action)
Think → Act → Observe loop for exploratory tasks
```typescript
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

const agent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [searchTool, calculatorTool],
  maxIterations: 5
});
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
  supervisor: { model: llm, strategy: 'skill-based' },
  workers: [],
  aggregator: { model: llm },
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
import { compose, withCache, withValidation, withRateLimit } from '@agentforge/core';
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
import { production } from '@agentforge/core';

const productionNode = productionPreset(myNode, {
  cache: { ttl: 3600000 },
  rateLimit: { maxRequests: 100, windowMs: 60000 },
  retry: { maxAttempts: 3 },
});
```

See the [Middleware Guide](https://tvscoundrel.github.io/agentforge/guide/concepts/middleware) for comprehensive documentation.

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

### 🌐 User Documentation (GitHub Pages)
- 🚀 **[Quick Start](https://tvscoundrel.github.io/agentforge/guide/quick-start)** - Get started in 5 minutes
- 📚 **[Full Documentation](https://tvscoundrel.github.io/agentforge/)** - Complete guides and API reference
- 🤖 **[Pattern Guides](https://tvscoundrel.github.io/agentforge/guide/patterns/react)** - ReAct, Plan-Execute, Reflection, Multi-Agent
- 🔧 **[Middleware Guide](https://tvscoundrel.github.io/agentforge/guide/concepts/middleware)** - Comprehensive middleware guide
- 💡 **[Examples](https://tvscoundrel.github.io/agentforge/examples/react-agent)** - Working code examples
- 📖 **[API Reference](https://tvscoundrel.github.io/agentforge/api/core)** - Complete API documentation

### 📂 Developer Documentation (Repository)
For contributors and advanced users:
- [Framework Design](./docs/FRAMEWORK_DESIGN.md) - Architecture and design decisions
- [Roadmap](./docs/ROADMAP.md) - Development roadmap and milestones
- [Monorepo Setup](./docs/MONOREPO_SETUP.md) - Monorepo structure and setup
- [Codebase Learning Guide](./docs/CODEBASE_LEARNING_GUIDE.md) - Contributor onboarding
- [Logging Standards](./docs/LOGGING_STANDARDS.md) - Internal logging standards
- [Pattern Comparison](./packages/patterns/docs/pattern-comparison.md) - Detailed pattern comparison

### Examples & Templates

#### 🚀 [Deployment Templates](./templates/)
Production-ready templates for deploying your agents:
- **[Docker Templates](./templates/docker/)** - Containerization with docker-compose
- **[Kubernetes Manifests](./templates/kubernetes/)** - Production K8s deployment
- **[CI/CD Pipelines](./templates/ci-cd/)** - GitHub Actions & GitLab CI
- **[Cloud Guides](./templates/deployment/)** - AWS, GCP, Azure deployment guides

#### 💡 [Application Examples](./examples/)
Real-world applications and integrations:
- [Research Assistant](./examples/applications/research-assistant/) - ReAct pattern for research
- [Code Reviewer](./examples/applications/code-reviewer/) - Reflection pattern for code quality
- [Data Analyst](./examples/applications/data-analyst/) - Plan-Execute pattern for data analysis
- [Customer Support Bot](./examples/applications/customer-support/) - Multi-Agent pattern for support
- [Express.js Integration](./examples/integrations/express-api/) - REST API with streaming
- [Next.js Integration](./examples/integrations/nextjs-app/) - Full-stack app with chat UI

#### 📚 Pattern Examples
- [ReAct Examples](./packages/patterns/examples/react/) - 4 ReAct examples
- [Plan-Execute Examples](./packages/patterns/examples/plan-execute/) - 4 Plan-Execute examples
- [Reflection Examples](./packages/patterns/examples/reflection/) - 4 Reflection examples
- [Multi-Agent Examples](./packages/patterns/examples/multi-agent/) - 4 Multi-Agent examples

#### 🔧 Feature Examples
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

**🎉 AgentForge v0.12.6 - Published on npm and Production-Ready!**

**All 7 Phases Complete:**

### ✅ Phase 1: Tool Registry (113 tests)
- Rich tool metadata, builder API, registry with events
- LangChain integration, prompt generation
- **Status**: Complete & Published

### ✅ Phase 2: LangGraph Utilities (158 tests)
- State management, workflow builders, error handling
- Memory & persistence, observability & logging
- **Status**: Complete & Published

### ✅ Phase 3: Agent Patterns (129 tests)
- ReAct, Plan-Execute, Reflection, Multi-Agent patterns
- 16 working examples with comprehensive documentation
- **Status**: Complete & Published

### ✅ Phase 4: Middleware System (94 tests)
- Composable middleware (caching, rate limiting, validation, concurrency)
- Production, development, and testing presets
- **Status**: Complete & Published

### ✅ Phase 5: Production Features (163 tests)
- **5.1**: Streaming & Real-time (68 tests) - Stream transformers, SSE, WebSocket, progress tracking
- **5.2**: Advanced Tools - Async execution, lifecycle, composition, testing utilities
- **5.3**: Resource Management - Connection pooling, memory management, batch processing, circuit breaker
- **5.4**: Monitoring - Health checks, profiling, alerts, audit logging
- **5.5**: Deployment - Docker, Kubernetes, CI/CD, configuration management
- 20 working examples demonstrating all features
- **Status**: Complete & Published

### ✅ Phase 6: Developer Experience
- **6.1**: CLI Tool - 156 tests (98.11% coverage), 13 commands, 4 templates
- **6.2**: Testing Utilities - Mocks, assertions, fixtures, test helpers
- **6.3**: Standard Tools - 74 production-ready tools (web, file, data, utility, agent)
- **6.4**: Documentation Site - 17 pages, comprehensive guides, API docs, tutorials
- **Status**: Complete & Published

### ✅ Phase 7: Documentation Completion (34 pages, 10,000+ lines)
- **7.1**: Core Concepts - 5 foundational guides
- **7.2**: Pattern Guides - 4 comprehensive pattern guides (2,011 lines)
- **7.3**: Advanced Topics - 4 advanced guides (3,474 lines)
- **7.4**: Additional Tutorials - 3 step-by-step tutorials
- **7.5**: Missing Examples - 2 complete working examples
- **7.6**: Documentation Review & Polish - Quality assurance, link validation, cross-references
- **Status**: Complete & Published

---

## 📊 Project Metrics

- **Total Tests**: 1076 passing across all packages
- **Test Coverage**: 98.11% (CLI package)
- **Documentation**: 34 pages, 10,000+ lines
- **Examples**: 30+ files, 2,500+ lines of real-world code
- **Tools**: 74 production-ready tools
- **Patterns**: 4 complete agent patterns
- **Packages**: 5 published on npm

---

## 💡 What You Can Build

- 🤖 **Autonomous Agents** - ReAct, Plan-Execute, Reflection, Multi-Agent patterns
- 🌊 **Real-time Applications** - Streaming with SSE/WebSocket
- 🔌 **Production APIs** - Express.js or Next.js integrations
- 📊 **Data Analysis Tools** - Research and analytics agents
- 💬 **Customer Support** - Multi-agent support systems
- 🔍 **Code Review Tools** - Reflection-based quality tools
- 🚀 **Enterprise Deployments** - Docker/Kubernetes ready

See [ROADMAP.md](./docs/ROADMAP.md) for complete development history.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

### Release Process

For maintainers releasing new versions:

1. **Automated Version Bump**:
   ```bash
   ./scripts/release.sh 0.4.2
   ```
   This updates all package.json files, CLI templates, and documentation.

2. **Manual Steps** (see [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md)):
   - Update CHANGELOG.md with release notes
   - Run `pnpm build` and `pnpm test`
   - Review changes with `git diff`
   - Commit: `git add . && git commit -m "chore: Bump version to X.Y.Z"`
   - Tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
   - Push: `git push && git push --tags`

3. **Publish to npm**:
   ```bash
   ./scripts/publish.sh
   ```
   This publishes all packages in the correct dependency order.

See [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) for the complete checklist.

---

## 📄 License

MIT © 2026 Tom Van Schoor

---

## 🙏 Acknowledgments

- Inspired by [DeepAgents](https://github.com/langchain-ai/deepagentsjs)
- Built on [LangGraph](https://langchain-ai.github.io/langgraph/)
- Powered by [LangChain](https://js.langchain.com/)
