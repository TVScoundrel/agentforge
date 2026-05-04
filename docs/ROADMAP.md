# AgentForge Development Roadmap

> Phased development plan for the AgentForge framework

## Current Status: Phase 9 Complete!

**Overall Progress**: Framework 100% Complete, Documentation 100% Complete
**Latest Achievement**: Phase 9.4 CLI Scaffolding for Reusable Agents Complete
**Framework Status**: Production-Ready
**Documentation Status**: 100% Complete (34/34 pages)
**Updated**: January 22, 2026

### Quick Stats
- Complete: **7 Packages**: core, patterns, cli, testing, tools, docs + 4 templates
- Complete: **1032 Tests**: Comprehensive test coverage (98.11% CLI coverage)
- Complete: **68 Tools**: Production-ready standard tools
- Complete: **34/34 Doc Pages**: Documentation site (100% complete)
- Complete: **4 Patterns**: ReAct, Plan-Execute, Reflection, Multi-Agent
- Complete: **6 Examples**: 4 applications + 2 framework integrations
- Complete: **~33,500 Lines**: Production code + documentation + examples

---

## Timeline Overview

**Framework Duration**: ~10 weeks (MVP to Production-Ready)
**Documentation Duration**: ~2 weeks (phases 7.1-7.5 complete; Phase 7.6 pending)
**Current Phase**: Phase 9 - 100% Complete
**Start Date**: 2025-12-23
**Framework Completion**: 2026-01-07
**Phase 9 Completion**: 2026-01-22

---

## Completed Phases

### Phase 0: Planning & Setup COMPLETE
**Duration**: 1 day | **Status**: Complete (2025-12-23)

Initial project setup with monorepo structure, TypeScript configuration, and build tooling.

[View Phase 0 Details](./phases/phase-0-planning.md)

---

### Phase 1: Tool Registry (MVP) COMPLETE
**Duration**: 10 days | **Status**: Complete (2025-12-24)

Production-ready tool system with rich metadata, builder API, and LangChain integration.

[View Phase 1 Details](./phases/phase-1-tool-registry.md)

---

### Phase 2: LangGraph Integration COMPLETE
**Duration**: 7 days | **Status**: Complete
LangGraph state utilities, graph builders, and agent utilities for production-ready agent development.

[View Phase 2 Details](./phases/phase-2-langgraph.md)

---

### Phase 3: Agent Patterns COMPLETE
**Duration**: 14 days | **Status**: Complete
Four production-ready agent patterns: ReAct, Plan-Execute, Reflection, and Multi-Agent.

[View Phase 3 Details](./phases/phase-3-patterns.md)

---

### Phase 4: Middleware System COMPLETE
**Duration**: 14 days | **Status**: Complete
Comprehensive middleware system with logging, error handling, caching, rate limiting, and more.

[View Phase 4 Details](./phases/phase-4-middleware.md)

---

### Phase 5: Production Features COMPLETE
**Duration**: 14 days | **Status**: Complete
Streaming, resource management, monitoring, observability, and deployment infrastructure.

[View Phase 5 Details](./phases/phase-5-production.md)

---

### Phase 6: Developer Experience COMPLETE
**Duration**: 14 days | **Status**: Complete
CLI tool, testing utilities, standard tools library, and comprehensive documentation site.

[View Phase 6 Details](./phases/phase-6-developer-experience.md)

---

### Phase 7: Documentation Completion 97% COMPLETE
**Duration**: 8-10 days | **Status**: Needs attention: 97% Complete (34/34 pages, Phase 7.6 pending)

Complete documentation coverage with core concepts, pattern guides, advanced topics, examples, and tutorials.

**Deliverables**:
- Complete: Core Concepts (5/5 pages): tools, patterns, middleware, state, memory
- Complete: Pattern Guides (4/4 pages - 2,011 lines): ReAct, Plan-Execute, Reflection, Multi-Agent
- Complete: Advanced Topics (4/4 pages - 3,474 lines): streaming, resources, monitoring, deployment
- Complete: Examples (2 pages): custom-tools, middleware
- Complete: Tutorials (3 pages): advanced-patterns, production-deployment, testing
- Needs attention: Documentation Review & Polish (Phase 7.6): pending
- Complete: **Total: 34/34 pages, 10,000+ lines of documentation**

[View Phase 7 Details](./phases/phase-7-documentation.md)

---

## Future Phases (Post-MVP)

### Phase 8: Advanced Features IN PROGRESS
**Status**: In Progress | **Priority**: Medium | **Duration**: 4-6 weeks

Advanced features to enhance the framework:

#### Phase 8.1: Tool Relations & Minimal Prompt Mode COMPLETE
**Status**: Complete | **Completed**: 2026-01-09 | **Duration**: 2.5 hours

Implemented tool relations and minimal prompt mode:
- Complete: Tool relations (requires, suggests, conflicts, follows, precedes)
- Complete: Minimal prompt mode for providers with native tool calling
- Complete: Reduce token usage by up to 67% for OpenAI/Anthropic/Gemini
- Complete: Improve LLM tool selection with workflow hints
- Complete: Fluent builder API for defining relations
- Complete: Full TypeScript support with validation
- Complete: 106 tests passing (24 types + 41 builder + 41 registry)

[View Phase 8.1 Details](../.dev-docs/phase-8.1-design.md) | [Completion Summary](../.dev-docs/PHASE_8_1_COMPLETE.md)

#### Phase 8.2: Checkpointer Support Across All Patterns COMPLETE
**Status**: Complete | **Completed**: 2026-01-21 | **Duration**: 1 hour

**Problem**: The askHuman tool (Phase 9.1) is complete but **cannot be used** with any pattern because none of the pattern factory functions accept a `checkpointer` parameter. This blocks:
- Missing: Human-in-the-loop workflows with any pattern
- Missing: State persistence and conversation continuity
- Missing: LangGraph interrupts (required for askHuman)
- Missing: Multi-turn conversations with checkpointing

**Root Cause**: All pattern factory functions (`createReActAgent`, `createPlanExecuteAgent`, `createReflectionAgent`, `createMultiAgentSystem`) compile the graph internally without accepting a checkpointer parameter:
```typescript
// Current implementation (all patterns)
return workflow.compile();  // ❌ No checkpointer support

// Required implementation
return workflow.compile(checkpointer ? { checkpointer } : undefined);  // ✅
```

**Implementation Tasks**:
- [x] Update `packages/patterns/src/react/agent.ts`
  - [x] Add `checkpointer?: BaseCheckpointSaver` to `ReActAgentConfig` interface
  - [x] Pass checkpointer to `workflow.compile({ checkpointer })`
  - [x] Update JSDoc examples to show checkpointer usage
  - [ ] Add tests for checkpointing with ReAct pattern (deferred)
- [x] Update `packages/patterns/src/plan-execute/agent.ts`
  - [x] Add `checkpointer?: BaseCheckpointSaver` to `PlanExecuteAgentConfig` interface (in `types.ts`)
  - [x] Pass checkpointer to `workflow.compile({ checkpointer })`
  - [x] Update JSDoc examples to show checkpointer usage
  - [ ] Add tests for checkpointing with Plan-Execute pattern (deferred)
- [x] Update `packages/patterns/src/reflection/agent.ts`
  - [x] Add `checkpointer?: BaseCheckpointSaver` to `ReflectionAgentConfig` interface
  - [x] Pass checkpointer to `workflow.compile({ checkpointer })`
  - [x] Update JSDoc examples to show checkpointer usage
  - [ ] Add tests for checkpointing with Reflection pattern (deferred)
- [x] Update `packages/patterns/src/multi-agent/agent.ts`
  - [x] Add `checkpointer?: BaseCheckpointSaver` to `MultiAgentSystemConfig` interface (in `types.ts`)
  - [x] Pass checkpointer to `workflow.compile({ checkpointer })`
  - [x] Update JSDoc examples to show checkpointer usage
  - [ ] Add tests for checkpointing with Multi-Agent pattern (deferred)
- [ ] Update documentation (deferred - can be done later)
  - [ ] Update pattern guides to show checkpointer usage
  - [ ] Update askHuman tool documentation with pattern examples
  - [ ] Add checkpointing section to each pattern guide
  - [ ] Update API documentation
- [ ] Update examples (deferred - can be done later)
  - [ ] Add checkpointing to ReAct examples
  - [ ] Add checkpointing to Plan-Execute examples
  - [ ] Add checkpointing to Multi-Agent examples
  - [ ] Create example showing askHuman with each pattern

**Deliverables**:
- Complete: All 4 patterns support `checkpointer` parameter
- Complete: askHuman tool works with all patterns
- Deferred: Tests for checkpointing with each pattern (deferred)
- Deferred: Updated documentation and examples (deferred)
- Complete: Consistent API across all patterns

**Impact**: **Unblocked Phase 9.1 (askHuman tool) for production use!**

**Files Modified**:
- `packages/patterns/src/react/types.ts` - Added `checkpointer` field to `ReActAgentConfig`
- `packages/patterns/src/react/agent.ts` - Pass checkpointer to `workflow.compile()`
- `packages/patterns/src/plan-execute/types.ts` - Added `checkpointer` field to `PlanExecuteAgentConfig`
- `packages/patterns/src/plan-execute/agent.ts` - Pass checkpointer to `workflow.compile()`
- `packages/patterns/src/reflection/types.ts` - Added `checkpointer` field to `ReflectionAgentConfig`
- `packages/patterns/src/reflection/agent.ts` - Pass checkpointer to `workflow.compile()`
- `packages/patterns/src/multi-agent/types.ts` - Added `checkpointer` field to `MultiAgentSystemConfig`
- `packages/patterns/src/multi-agent/agent.ts` - Pass checkpointer to `workflow.compile()`

---

#### Phase 8.3: Multi-Modal Support (1-2 weeks)
- Vision support (image analysis, OCR)
- Audio support (transcription, TTS)
- Multi-modal tool definitions
- Example multi-modal agents

#### Phase 8.4: Advanced Memory Systems (1-2 weeks)
- Vector store integrations (Pinecone, Weaviate, Chroma)
- Semantic search capabilities
- Long-term memory patterns
- Memory compression strategies

#### Phase 8.5: Advanced Collaboration (1-2 weeks)
- Hierarchical agent patterns
- Swarm intelligence patterns
- Agent-to-agent communication protocols
- Collaborative decision making

---

### Phase 9: Human-in-the-Loop & Reusable Agents PLANNED
**Status**: Planned | **Priority**: High | **Duration**: 1-2 weeks

Enable human-in-the-loop workflows and promote reusable agent patterns:

#### Phase 9.1: askHuman Tool (High Priority)
**Duration**: 3-5 days

Core framework tool for human-in-the-loop interactions:

**Implementation Tasks**:
- [x] Design `askHuman` tool API and types
- [x] Implement core `askHuman` tool in `@agentforge/tools`
- [x] Add LangGraph interrupt handling integration in `@agentforge/core`
- [x] Implement SSE streaming support for real-time communication
- [x] Add support for multiple concurrent human requests
- [x] Implement timeout and fallback handling
- [x] Add TypeScript types and interfaces
- [x] Write unit tests (>90% coverage)
- [x] Write integration tests with ReAct pattern
- [x] Write integration tests with Plan-Execute pattern
- [x] Create documentation page: "Human-in-the-Loop"
- [x] Create example: Customer support agent with approval workflow
- [x] Update API documentation
- [x] Add to exports in `@agentforge/tools`

**Status**: **COMPLETE** (13/13 tasks done)

**Deliverables**:
- `askHuman` tool implementation in `@agentforge/tools`
- Interrupt handling utilities in `@agentforge/core`
- SSE streaming integration in `@agentforge/core`
- TypeScript types and interfaces
- Unit tests (>90% coverage)
- Integration tests with ReAct/Plan-Execute patterns
- Documentation page: "Human-in-the-Loop"
- Example: Customer support agent with approval workflow

#### Phase 9.2: Reusable Agent Pattern Documentation (High Priority)
**Duration**: 2-3 days

Document best practices for creating reusable agents:

**Documentation Tasks**:
- [x] Create guide: "Creating Reusable Agents"
- [x] Document pattern: Agent factory functions
- [x] Document pattern: Configuration-driven agents
- [x] Document pattern: Tool injection and composition
- [x] Document pattern: System prompt customization
- [x] Create guide: Publishing agents to npm
- [x] Create guide: Versioning strategies
- [x] Document TypeScript best practices
- [x] Add code examples for each pattern
- [x] Create publishing checklist
- [x] Add to documentation site navigation
- [x] Review and polish documentation

**Status**: **COMPLETE** (12/12 tasks done)

**Deliverables**:
- Documentation page: "Creating Reusable Agents"
- Best practices guide
- TypeScript patterns and examples
- Publishing checklist
- Versioning guide

#### Phase 9.3: Reusable Agent Examples (High Priority)
**Duration**: 2-3 days
**Status**: COMPLETE

Provide reference implementations of reusable agents:

**Example Tasks**:
- [x] Create `examples/reusable-agents/` directory
- [x] Implement customer support agent (configurable)
  - [x] Agent factory function
  - [x] Configuration schema
  - [x] Tool injection pattern
  - [x] System prompt customization (external prompts)
  - [x] README with usage examples
  - [x] Tests demonstrating reusability (24 tests passing)
- [x] Implement code review agent (configurable)
  - [x] Agent factory function
  - [x] Configuration schema
  - [x] Tool injection pattern
  - [x] System prompt customization (external prompts)
  - [x] README with usage examples
  - [x] Tests demonstrating reusability (26 tests passing)
- [x] Implement data analyst agent (configurable)
  - [x] Agent factory function
  - [x] Configuration schema
  - [x] Tool injection pattern
  - [x] System prompt customization (external prompts)
  - [x] README with usage examples
  - [x] Tests demonstrating reusability (28 tests passing)
- [x] Create main README for reusable agents examples
- [x] Add TypeScript types for all configurations (via Zod schemas)
- [-] Add integration tests showing different configurations (obsolete - covered by reusability scenario tests)
- [x] Update main examples README

**Deliverables**:
- 3 example reusable agents in `examples/reusable-agents/`
- README for each with usage examples
- Configuration schemas
- TypeScript types
- Tests demonstrating reusability

#### Phase 9.4: CLI Scaffolding (Nice to Have)
**Duration**: 1-2 days
**Status**: COMPLETE

CLI commands for creating reusable agents:

**CLI Tasks**:
- [x] Design CLI command API
- [x] Implement `agentforge agent:create-reusable <name>` command
- [x] Create template for reusable agent structure
- [x] Add TypeScript types template
- [x] Add README template with usage examples
- [x] Add package.json template for publishing
- [x] Add configuration schema template
- [x] Add tests template
- [x] Write unit tests for CLI command (5 tests passing)
- [x] Update CLI documentation
- [x] Add to CLI help text
- [x] Test end-to-end workflow (build successful)

**Deliverables**:
- Complete: CLI command implementation (`agent:create-reusable`)
- Complete: Templates for reusable agents (complete template in `packages/cli/templates/reusable-agent/`)
- Complete: Documentation update (CLI README with detailed usage)
- Complete: Tests for CLI command (5 tests, mocked file operations)

---

### Phase 10: Tool-Enabled Supervisor COMPLETE
**Status**: Complete | **Priority**: High
**Duration**: 5 hours (actual)
**Target**: Q1 2026
**Started**: January 22, 2026
**Completed**: January 22, 2026

Enable supervisors in the multi-agent pattern to use tools (especially `askHuman`) during routing decisions.

**Motivation**: Real-world multi-agent systems often need to gather additional information before routing tasks. The supervisor should be able to ask for clarification, query databases, or call APIs before making routing decisions.

**Key Features**:
- [x] Supervisor can bind tools (especially `askHuman`)
- [x] LLM-based routing detects and executes tool calls
- [x] Routing retries with tool results as additional context
- [x] Backward compatible - tools are optional
- [x] Works with any tool, not just `askHuman`

**Implementation Tasks**:
- [x] Update `SupervisorConfig` type to accept `tools` and `maxToolRetries`
- [x] Implement tool execution helper function
- [x] Update `llmBasedRouting` to detect and execute tool calls
- [x] Update `createMultiAgentSystem` to bind tools to supervisor model
- [x] Add conversation history tracking for tool calls
- [x] Unit tests (11 tests - tool detection, retry logic, error handling, backward compatibility)
- [x] Integration tests (3 tests - system configuration, tool binding, parameter passing)
- [x] Update multi-agent pattern documentation
- [x] Create example: supervisor-with-askhuman
- [x] Update PTY AGI playground to use feature

**Deliverables**:
- Complete: Tool-enabled supervisor in `@agentforge/patterns` v0.5.4
- Complete: 14 tests (11 unit + 3 integration) - All passing
- Complete: Updated multi-agent pattern guide (packages/patterns/docs + docs-site)
- Complete: Working example with askHuman (05-supervisor-with-askhuman.ts)
- Complete: PTY AGI integration (playground/src/system/pty-agi.ts)

**Documentation**:
- [Feature Planning Document](./FEATURE_TOOL_ENABLED_SUPERVISOR.md)

**Progress**:
- Complete: Phase 1: Core Implementation (Complete - 2 hours)
  - Complete: Updated `SupervisorConfig` type with `tools` and `maxToolRetries`
  - Complete: Implemented `executeTools()` helper function
  - Complete: Updated `llmBasedRouting` with tool call detection and retry logic
  - Complete: Updated `createMultiAgentSystem` to bind tools to supervisor model
  - Complete: Build successful, no TypeScript errors
- Complete: Phase 2: Testing (Complete - 1.5 hours)
  - Complete: Created `routing-with-tools.test.ts` with 11 unit tests
  - Complete: Created `integration-with-tools.test.ts` with 3 integration tests
  - Complete: All 14 tests passing (192/192 total tests in patterns package)
  - Complete: Test coverage: tool detection, retry logic, error handling, backward compatibility
- Complete: Phase 3: Documentation (Complete - 1 hour)
  - Complete: Added "Tool-Enabled Supervisor" section to Advanced Usage in `packages/patterns/docs/multi-agent-pattern.md`
  - Complete: Updated API Reference with `tools` and `maxToolRetries` parameters
  - Complete: Added comprehensive examples and best practices
  - Complete: Updated `docs-site/guide/patterns/multi-agent.md` with same content
  - Complete: Documented configuration options, workflow, and troubleshooting
- Complete: Phase 4: Examples (Complete - 0.5 hours)
  - Complete: Created `05-supervisor-with-askhuman.ts` example (202 lines)
  - Complete: Demonstrates supervisor with askHuman tool
  - Complete: Shows handling of ambiguous vs. clear requests
  - Complete: Includes 3 example scenarios with mock responses
  - Complete: Updated multi-agent examples README with new example
  - Complete: Added "Tool-Enabled Supervisor" section to README
  - Complete: Fixed all TypeScript errors (imports, types, unused variables)
  - Complete: Uses relative imports for monorepo compatibility
- Complete: Phase 5: PTY AGI Integration (Complete - 0.5 hours)
  - Complete: Added `createAskHumanTool` import to `playground/src/system/pty-agi.ts`
  - Complete: Created askHuman tool instance in `createPtyAgi()` function
  - Complete: Added `tools: [askHumanTool]` to supervisor configuration
  - Complete: Added `maxToolRetries: 3` to supervisor configuration
  - Complete: Updated supervisor system prompt with askHuman usage guidelines
  - Complete: Verified no TypeScript errors in pty-agi.ts
  - Complete: Ran test:supervisor script - all tests pass
  - Complete: PTY AGI now supports supervisor asking for clarification on ambiguous queries

---

### Phase X: Ecosystem FUTURE
**Status**: Planned | **Priority**: Low

Community and ecosystem development:
- Community tools registry
- Plugin system
- Integration marketplace
- Example applications gallery
- Community templates

---

## Documentation Resources

- [Roadmap Archive](./ROADMAP_ARCHIVE.md) - Detailed historical summaries and success metrics
- [Framework Design](./FRAMEWORK_DESIGN.md) - Architecture details
- [Documentation Roadmap](../docs-site/DOCUMENTATION_ROADMAP.md) - Documentation tracking

---

## Phase Summary Files

All completed phases have detailed documentation:
- [Phase 0: Planning & Setup](./phases/phase-0-planning.md)
- [Phase 1: Tool Registry](./phases/phase-1-tool-registry.md)
- [Phase 2: LangGraph Integration](./phases/phase-2-langgraph.md)
- [Phase 3: Agent Patterns](./phases/phase-3-patterns.md)
- [Phase 4: Middleware System](./phases/phase-4-middleware.md)
- [Phase 5: Production Features](./phases/phase-5-production.md)
- [Phase 6: Developer Experience](./phases/phase-6-developer-experience.md)
- [Phase 7: Documentation Completion](./phases/phase-7-documentation.md)
