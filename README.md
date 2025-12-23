# AgentForge

> Production-ready framework for building deep agents with LangGraph

**AgentForge** is a TypeScript framework that provides production-grade abstractions for building autonomous agents with LangGraph. It focuses on developer experience, type safety, and real-world production needs.

---

## ✨ Features

- 🛠️ **Rich Tool Registry** - Metadata-driven tools with automatic prompt generation
- 🎯 **Agent Patterns** - Pre-built patterns (ReAct, Planner-Executor, etc.)
- 🔒 **Type Safety** - Full TypeScript support with Zod schemas
- 🧪 **Testing First** - Built-in testing utilities and patterns
- 📦 **Modular** - Use only what you need
- 🚀 **Production Ready** - Middleware, error handling, observability

---

## 📦 Packages

| Package | Description | Status |
|---------|-------------|--------|
| [@agentforge/core](./packages/core) | Core abstractions (tools, registry, agents) | 🚧 In Development |
| @agentforge/patterns | Agent patterns (ReAct, Planner-Executor) | 📋 Planned |
| @agentforge/tools | Standard tool library | 📋 Planned |
| @agentforge/testing | Testing utilities | 📋 Planned |
| @agentforge/cli | CLI tool | 📋 Planned |

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

**Phase:** MVP - Tool Registry  
**Progress:** Monorepo setup complete, implementing tool registry

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
