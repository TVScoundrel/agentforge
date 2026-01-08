# Phase 2.2: Graph Builder Utilities - Design Document

**Status**: 🚧 In Progress  
**Start Date**: December 24, 2024  
**Duration**: 2 days  
**Philosophy**: Provide ergonomic utilities for common LangGraph patterns

---

## Overview

Phase 2.2 focuses on **Graph Builder Utilities** - helper functions and patterns that make it easier to construct common LangGraph workflow patterns. These are thin wrappers that improve developer experience while using LangGraph's native API.

## Core Principle

**We provide utilities, not abstractions.**

- ✅ Helper functions for common patterns
- ✅ Type-safe wrappers around LangGraph APIs
- ✅ Composable utilities that work together
- ❌ NOT a replacement for StateGraph
- ❌ NOT hiding LangGraph's API
- ❌ NOT creating a new graph framework

---

## Features

### 1. Sequential Workflow Builder

**Goal**: Simplify building linear workflows where nodes execute in sequence.

```typescript
import { createSequentialWorkflow } from '@agentforge/core';
import { StateGraph } from '@langchain/langgraph';

const workflow = createSequentialWorkflow(AgentState, [
  { name: 'fetch', node: fetchNode },
  { name: 'process', node: processNode },
  { name: 'save', node: saveNode },
]);

// Returns a configured StateGraph ready to compile
const app = workflow.compile();
```

**Implementation**: Simple helper that chains `addNode` and `addEdge` calls.

---

### 2. Parallel Execution Builder

**Goal**: Simplify building workflows where multiple nodes execute in parallel.

```typescript
import { createParallelWorkflow } from '@agentforge/core';

const workflow = createParallelWorkflow(AgentState, {
  parallel: [
    { name: 'fetch_news', node: fetchNewsNode },
    { name: 'fetch_weather', node: fetchWeatherNode },
    { name: 'fetch_stocks', node: fetchStocksNode },
  ],
  aggregate: { name: 'combine', node: combineNode },
});

// Creates: START -> [news, weather, stocks] -> combine -> END
```

**Implementation**: Uses LangGraph's native parallel execution with a fan-out/fan-in pattern.

---

### 3. Conditional Routing Builder

**Goal**: Simplify adding conditional edges with type safety.

```typescript
import { createConditionalRouter } from '@agentforge/core';

const router = createConditionalRouter<AgentState>({
  routes: {
    'continue': 'agent',
    'end': END,
    'tools': 'tools',
  },
  condition: (state) => {
    if (state.shouldEnd) return 'end';
    if (state.needsTools) return 'tools';
    return 'continue';
  },
});

// Use with StateGraph
graph.addConditionalEdges('agent', router.condition, router.routes);
```

**Implementation**: Type-safe wrapper around `addConditionalEdges`.

---

### 4. Subgraph Composition

**Goal**: Utilities for composing and nesting subgraphs.

```typescript
import { createSubgraph, composeGraphs } from '@agentforge/core';

// Create a reusable subgraph
const researchSubgraph = createSubgraph(ResearchState, (graph) => {
  graph.addNode('search', searchNode);
  graph.addNode('analyze', analyzeNode);
  graph.addEdge('search', 'analyze');
  return graph;
});

// Compose into main graph
const mainGraph = new StateGraph(MainState);
mainGraph.addNode('research', researchSubgraph);
```

**Implementation**: Helper for creating and composing subgraphs with proper state mapping.

---

### 5. Error Handling Patterns

**Goal**: Common error handling patterns for graph nodes.

```typescript
import { withRetry, withErrorHandler, withTimeout } from '@agentforge/core';

// Wrap node with retry logic
const robustNode = withRetry(myNode, {
  maxAttempts: 3,
  backoff: 'exponential',
});

// Wrap node with error handling
const safeNode = withErrorHandler(myNode, {
  onError: (error, state) => {
    return { ...state, error: error.message };
  },
});

// Wrap node with timeout
const timedNode = withTimeout(myNode, {
  timeout: 5000,
  onTimeout: (state) => ({ ...state, timedOut: true }),
});

// Compose multiple wrappers
const productionNode = withTimeout(
  withRetry(
    withErrorHandler(myNode, errorConfig),
    retryConfig
  ),
  timeoutConfig
);
```

**Implementation**: Higher-order functions that wrap node functions with error handling logic.

---

## File Structure

```
packages/core/src/langgraph/
├── index.ts                    # Exports
├── state.ts                    # ✅ Phase 2.1 (existing)
├── builders/
│   ├── index.ts               # Builder exports
│   ├── sequential.ts          # Sequential workflow builder
│   ├── parallel.ts            # Parallel execution builder
│   ├── conditional.ts         # Conditional routing utilities
│   └── subgraph.ts            # Subgraph composition
└── patterns/
    ├── index.ts               # Pattern exports
    ├── retry.ts               # Retry pattern
    ├── error-handler.ts       # Error handling pattern
    └── timeout.ts             # Timeout pattern

packages/core/tests/langgraph/
├── state.test.ts              # ✅ Phase 2.1 (existing)
├── integration.test.ts        # ✅ Phase 2.1 (existing)
├── builders/
│   ├── sequential.test.ts     # Sequential tests (5 tests)
│   ├── parallel.test.ts       # Parallel tests (5 tests)
│   ├── conditional.test.ts    # Conditional tests (4 tests)
│   └── subgraph.test.ts       # Subgraph tests (4 tests)
└── patterns/
    ├── retry.test.ts          # Retry tests (4 tests)
    ├── error-handler.test.ts  # Error handler tests (4 tests)
    └── timeout.test.ts        # Timeout tests (4 tests)
```

---

## Deliverables

### Source Code
- [ ] `src/langgraph/builders/sequential.ts` - Sequential workflow builder
- [ ] `src/langgraph/builders/parallel.ts` - Parallel execution builder
- [ ] `src/langgraph/builders/conditional.ts` - Conditional routing utilities
- [ ] `src/langgraph/builders/subgraph.ts` - Subgraph composition
- [ ] `src/langgraph/patterns/retry.ts` - Retry pattern
- [ ] `src/langgraph/patterns/error-handler.ts` - Error handling
- [ ] `src/langgraph/patterns/timeout.ts` - Timeout pattern

### Tests (30 tests total)
- [ ] Sequential workflow tests (5 tests)
- [ ] Parallel execution tests (5 tests)
- [ ] Conditional routing tests (4 tests)
- [ ] Subgraph composition tests (4 tests)
- [ ] Retry pattern tests (4 tests)
- [ ] Error handler tests (4 tests)
- [ ] Timeout pattern tests (4 tests)

### Documentation
- [ ] API documentation (GRAPH_BUILDERS.md)
- [ ] Pattern examples
- [ ] Integration with Phase 2.1 state utilities

### Examples
- [ ] Sequential workflow example
- [ ] Parallel execution example
- [ ] Error handling example

---

## Success Criteria

- [ ] All utilities are thin wrappers around LangGraph
- [ ] Full TypeScript support with type inference
- [ ] 30 tests passing (total: 161 tests)
- [ ] Complete documentation
- [ ] Working examples
- [ ] No breaking changes to existing code
- [ ] Composable utilities that work together

---

## Next Steps

After Phase 2.2, we'll move to Phase 2.3: Memory & Persistence Helpers.

