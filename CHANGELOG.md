# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Phase 2.2 (2024-12-24)

#### Workflow Builders
- `createSequentialWorkflow()` - Function API for sequential workflows
- `sequentialBuilder()` - Fluent builder API for sequential workflows
- `createParallelWorkflow()` - Fan-out/fan-in pattern for parallel execution
- `createConditionalRouter()` - Multi-way conditional routing
- `createBinaryRouter()` - True/false conditional routing
- `createMultiRouter()` - Discriminator-based routing

#### Subgraph Composition
- `createSubgraph()` - Create reusable subgraphs
- `composeGraphs()` - Add subgraphs to parent graphs
- Support for nested subgraphs

#### Error Handling Patterns
- `withRetry()` - Retry with configurable backoff strategies (constant, linear, exponential)
- `withErrorHandler()` - Error handling with custom callbacks
- `withTimeout()` - Timeout with custom handlers
- `TimeoutError` - Custom error class for timeouts
- Composable pattern support (wrap multiple patterns together)

#### Tests
- 54 new tests for workflow builders and error handling patterns
- Total test count: 185 tests

#### Documentation
- `PHASE_2_2_COMPLETE.md` - Complete Phase 2.2 documentation
- `examples/phase-2.2-demo.ts` - Comprehensive examples

### Added - Phase 2.1 (2024-12-24)

#### LangGraph State Management
- `createStateAnnotation()` - Type-safe state annotations with Zod validation
- `validateState()` - Runtime state validation
- `mergeState()` - State merging with custom reducers
- Full TypeScript type inference support

#### Tests
- 18 new tests for state management (14 unit + 4 integration)
- Total test count: 131 tests

#### Documentation
- `PHASE_2_1_COMPLETE.md` - Complete Phase 2.1 documentation
- `LANGGRAPH_INTEGRATION.md` - LangGraph integration guide
- `LANGGRAPH_QUICK_REFERENCE.md` - Quick reference guide
- `examples/phase-2.1-demo.ts` - Comprehensive examples
- `examples/langgraph-state.ts` - State management examples

### Added - Phase 1 (2024-12-23 to 2024-12-24)

#### Tool System
- `createTool()` - Function API for creating tools
- `toolBuilder()` - Fluent builder API for creating tools
- `ToolRegistry` - Centralized tool management
- Rich metadata support (categories, tags, examples, version)
- Zod schema validation
- LangChain integration (`toLangChainTool()`, `toLangChainTools()`)
- Prompt generation (`generatePrompt()`)
- Event system (tool:registered, tool:removed, tool:updated, registry:cleared)

#### Tests
- 113 tests for tool system
- Comprehensive unit and integration tests

#### Documentation
- `TOOL_SYSTEM.md` - Complete tool system documentation
- `LANGCHAIN_INTEGRATION.md` - LangChain integration guide
- `MIGRATION_GUIDE.md` - Migration from raw LangChain
- `QUICK_REFERENCE.md` - Quick reference guide
- Multiple working examples

### Infrastructure
- Monorepo setup with pnpm workspaces
- TypeScript configuration
- Build tooling (tsup)
- Testing setup (Vitest)
- Linting and formatting (ESLint, Prettier)

## [0.1.0] - 2024-12-23

### Added
- Initial project setup
- Core package structure
- Development tooling
- Documentation framework

[Unreleased]: https://github.com/paymentology/agentforge/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/paymentology/agentforge/releases/tag/v0.1.0

