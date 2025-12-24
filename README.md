# AgentForge

> Production-ready framework for building deep agents with LangGraph

[![GitHub](https://img.shields.io/badge/GitHub-TVScoundrel%2Fagentforge-blue?logo=github)](https://github.com/TVScoundrel/agentforge)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-300%20passing-success)](./packages/core)
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
- 🤖 **ReAct Pattern (Core)** - State, agent builder, and reasoning/action/observation nodes
- 🔒 **Type Safety** - Full TypeScript support with Zod schemas
- 🧪 **Testing First** - Comprehensive test coverage (300 tests)

### 🚧 In Progress
- 🎭 **ReAct Pattern (Integration)** - Complete workflow and examples

### 📋 Planned
- 🎭 **More Agent Patterns** - Plan-Execute, Reflection, Multi-Agent
- 📦 **Standard Tools** - Common tool library
- 🔌 **Middleware System** - Logging, tracing, caching, and rate limiting

---

## 📦 Packages

| Package | Description | Status |
|---------|-------------|--------|
| [@agentforge/core](./packages/core) | Core abstractions (tools, registry, LangGraph utilities, agent patterns) | ✅ Phase 1 & 2 Complete, 🚧 Phase 3 In Progress |
| @agentforge/patterns | Agent patterns (ReAct, Planner-Executor) | 🚧 In Progress (Phase 3) |
| @agentforge/tools | Standard tool library | 📋 Planned (Phase 6) |
| @agentforge/testing | Testing utilities | 📋 Planned (Phase 6) |
| @agentforge/cli | CLI tool | 📋 Planned (Phase 6) |

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

- [Framework Design](./docs/FRAMEWORK_DESIGN.md) - Architecture and design decisions
- [Roadmap](./docs/ROADMAP.md) - Development roadmap and milestones
- [Tool Registry Spec](./docs/TOOL_REGISTRY_SPEC.md) - Tool registry specification
- [Monorepo Setup](./docs/MONOREPO_SETUP.md) - Monorepo structure and setup
- [Diagrams](./docs/DIAGRAMS.md) - Visual diagrams and architecture

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
