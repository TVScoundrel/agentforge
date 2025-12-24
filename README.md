# AgentForge

> Production-ready framework for building deep agents with LangGraph

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
- 🔒 **Type Safety** - Full TypeScript support with Zod schemas
- 🧪 **Testing First** - Comprehensive test coverage (271 tests)

### 📋 Planned
- 🎭 **Agent Patterns** - Pre-built patterns (ReAct, Planner-Executor, etc.)
- 📦 **Standard Tools** - Common tool library
- 🔌 **Middleware System** - Logging, tracing, caching, and rate limiting

---

## 📦 Packages

| Package | Description | Status |
|---------|-------------|--------|
| [@agentforge/core](./packages/core) | Core abstractions (tools, registry, LangGraph utilities) | ✅ Phase 1 & 2 Complete |
| @agentforge/patterns | Agent patterns (ReAct, Planner-Executor) | 📋 Planned (Phase 3) |
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
git clone <repository-url>
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

**Phase:** 2 - LangGraph Integration & Agent Utilities ✅ COMPLETE

**What's Ready for Production:**
- ✅ **Phase 1**: Tool Registry (113 tests)
  - Rich tool metadata, builder API, registry with events
  - LangChain integration, prompt generation
- ✅ **Phase 2**: LangGraph Utilities (158 tests)
  - State management, workflow builders, error handling
  - Memory & persistence, observability & logging
- **Total: 271 tests passing** with comprehensive coverage

**What's Next:**
- 📋 **Phase 3**: Agent Patterns (ReAct, Planner-Executor, etc.)
- 📋 **Phase 4**: Middleware System (logging, tracing, caching)
- 📋 **Phase 5**: Production Features (streaming, monitoring)
- 📋 **Phase 6**: Developer Experience (CLI, testing utils, standard tools)

**Current State:** The core foundation is production-ready! You can build agents with tools, state management, workflows, persistence, and observability. Agent patterns and middleware are coming next.

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
