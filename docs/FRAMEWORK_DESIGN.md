# AgentForge Framework Design

> Architecture and design decisions for the AgentForge framework

---

## Overview

**AgentForge** is a production-ready TypeScript framework for building autonomous agents with LangGraph. It provides rich abstractions, type safety, and developer experience improvements over raw LangGraph usage.

### Core Principles

1. **Developer Experience First** - Intuitive APIs, great TypeScript support, helpful error messages
2. **Production Ready** - Built-in observability, error handling, testing utilities
3. **Modular Architecture** - Use only what you need, extend what you want
4. **Type Safety** - Leverage TypeScript and Zod for runtime validation
5. **LangGraph Native** - Build on top of LangGraph, don't replace it

---

## Architecture Layers

```
┌─────────────────────────────────────────┐
│         Developer Experience            │
│  (@agentforge/cli, @agentforge/testing) │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          Agent Patterns                 │
│      (@agentforge/patterns)             │
│  ReAct, Planner-Executor, Reflection    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           Agent Core                    │
│       (@agentforge/core)                │
│  Base Agent, Middleware, State Mgmt     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          Tool System                    │
│       (@agentforge/core)                │
│  Registry, Metadata, Prompt Generation  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Standard Tools                  │
│      (@agentforge/tools)                │
│   File, Web, Code, Database Tools       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          LangGraph + LangChain          │
│         (External Dependencies)         │
└─────────────────────────────────────────┘
```

---

## Core Components

### 1. Tool System (@agentforge/core)

**Purpose**: Rich metadata-driven tool system with automatic prompt generation

**Key Features**:
- Fluent builder API for tool creation
- Rich metadata (description, examples, categories, tags)
- Automatic prompt generation from metadata
- Zod schema integration for validation
- LangChain tool conversion
- Tool registry with CRUD and query operations

**Design Decisions**:
- ✅ Use Zod for schema definition (runtime validation + TypeScript types)
- ✅ Separate metadata from implementation (better organization)
- ✅ Builder pattern for ergonomic tool creation
- ✅ Registry pattern for centralized tool management

### 2. Agent Core (@agentforge/core)

**Purpose**: Base abstractions for building agents

**Key Features**:
- Base agent class with common functionality
- State management utilities
- Middleware system (logging, tracing, error handling)
- Memory management abstractions
- Event system for observability

**Design Decisions**:
- ✅ Composition over inheritance (use mixins/traits)
- ✅ Middleware pattern for cross-cutting concerns
- ✅ Event-driven architecture for observability
- ✅ Immutable state updates (functional approach)

### 3. Agent Patterns (@agentforge/patterns)

**Purpose**: Pre-built agent patterns ready to use

**Patterns**:
- **ReAct**: Reasoning + Acting loop
- **Planner-Executor**: Plan first, then execute
- **Reflection**: Self-critique and improvement
- **Multi-Agent**: Coordinated agent systems

**Design Decisions**:
- ✅ Each pattern is a factory function
- ✅ Patterns are composable and extensible
- ✅ Patterns use core abstractions
- ✅ Patterns include examples and tests

### 4. Standard Tools (@agentforge/tools)

**Purpose**: Production-ready tool library

**Tool Categories**:
- **File System**: Read, write, search files
- **Web**: HTTP requests, web scraping
- **Code**: Execute code, analyze syntax
- **Database**: Query databases
- **API**: Common API integrations

**Design Decisions**:
- ✅ Each tool is independently importable
- ✅ Tools follow consistent metadata patterns
- ✅ Tools include comprehensive examples
- ✅ Tools have thorough error handling

### 5. Testing Utilities (@agentforge/testing)

**Purpose**: Make testing agents easy

**Features**:
- Mock LLM responses
- Agent test harness
- Assertion helpers
- Snapshot testing for agent outputs
- Performance testing utilities

### 6. CLI (@agentforge/cli)

**Purpose**: Developer productivity tools

**Commands**:
- `agentforge init` - Initialize new project
- `agentforge tool create` - Scaffold new tool
- `agentforge agent create` - Scaffold new agent
- `agentforge dev` - Development mode with hot reload
- `agentforge test` - Run tests with agent-specific features

---

## Technology Stack

### Core Dependencies
- **TypeScript 5.3+** - Type safety and modern JavaScript
- **Zod 3.x** - Runtime validation and schema definition
- **LangGraph** - Agent orchestration framework
- **LangChain** - LLM integration and tools

### Development Tools
- **pnpm** - Fast, efficient package manager
- **tsup** - Fast TypeScript bundler
- **Vitest** - Fast unit testing
- **ESLint + Prettier** - Code quality and formatting

### Build Targets
- **ESM** - Modern module system (primary)
- **CommonJS** - Legacy compatibility
- **TypeScript Declarations** - Full type support

---

## Design Patterns

### 1. Builder Pattern
Used for tool creation - fluent, type-safe API

### 2. Registry Pattern
Used for tool management - centralized, queryable

### 3. Middleware Pattern
Used for cross-cutting concerns - composable, reusable

### 4. Factory Pattern
Used for agent patterns - consistent creation interface

### 5. Strategy Pattern
Used for different agent behaviors - swappable implementations

---

## Next Steps

See [ROADMAP.md](./ROADMAP.md) for development phases and timeline.

