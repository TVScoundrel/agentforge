# Phase 3: Agent Patterns - Detailed Design

**Duration**: 7 days
**Status**: 📋 Planning
**Goal**: Implement production-ready agent patterns as reusable utilities

**Last Updated**: 2025-12-24
**Based On**: LangChain 1.0 & LangGraph 1.0 (October 2025 releases)

---

## Overview

Phase 3 focuses on implementing common agent patterns as reusable, type-safe utilities that work seamlessly with our existing tool registry and LangGraph utilities. We'll implement 4 core patterns based on proven research and LangChain's latest implementations.

### Key Changes in LangChain/LangGraph 1.0 (October 2025)

- **`create_react_agent` moved** from `langgraph.prebuilt` to `langchain.agents.create_agent`
- **LangChain 1.0** focuses on high-level agent abstractions with middleware support
- **LangGraph 1.0** provides low-level graph control with durable state and HITL patterns
- Our patterns will be built on **LangGraph** for maximum flexibility and control

---

## Architecture Principles

1. **Composable**: Patterns should work with our existing utilities (tools, state, workflows)
2. **Type-Safe**: Full TypeScript support with LangGraph's `Annotation` + optional Zod validation
3. **Configurable**: Flexible configuration for different use cases
4. **Observable**: Integration with our observability utilities
5. **Testable**: Comprehensive test coverage for each pattern

---

## State Management Approach

**We use LangGraph's `Annotation.Root()` for state definition** (via our `createStateAnnotation()` wrapper from Phase 2.1).

### Why This Hybrid Approach?

- **LangGraph's `Annotation`**: Provides the core state management (channels, reducers, TypeScript types)
- **Optional Zod Schemas**: Add runtime validation, better error messages, and documentation
- **Our Wrapper**: Simplifies the API while maintaining full LangGraph compatibility

### Example: State Definition

```typescript
import { createStateAnnotation } from '@agentforge/core';
import { z } from 'zod';

// Define state using LangGraph's Annotation (via our wrapper)
const AgentState = createStateAnnotation({
  messages: {
    schema: z.array(MessageSchema),  // ← Optional: Runtime validation
    reducer: (left, right) => [...left, ...right],  // ← LangGraph reducer
    default: () => [],
    description: 'Chat message history'
  },
  context: {
    schema: z.record(z.any()),  // ← Optional: Runtime validation
    default: () => ({}),
    description: 'Agent context'
  }
});

// This returns Annotation.Root() under the hood
// Works perfectly with LangGraph's StateGraph
const workflow = new StateGraph(AgentState)
  .addNode('myNode', (state) => ({ messages: ['hello'] }))
  .compile();
```

**Key Point**: The Zod schemas are **optional**. You can omit them and still get full LangGraph functionality. They're there when you need runtime validation or better DX.

---

## Phase 3.1: ReAct Pattern (2 days)

### Overview
The Reasoning and Action (ReAct) pattern is the most common agent pattern. It uses a thought-action-observation loop where the agent:
1. **Thinks** about what to do next
2. **Acts** by calling a tool or responding
3. **Observes** the result
4. Repeats until task is complete

### Implementation Tasks

#### 3.1.1 ReAct State Definition
- [ ] Define `ReActState` using `createStateAnnotation()` (wraps LangGraph's `Annotation.Root()`)
  - `messages`: conversation history (with optional Zod validation)
  - `thoughts`: reasoning steps (with optional Zod validation)
  - `actions`: tool calls made (with optional Zod validation)
  - `observations`: tool results (with optional Zod validation)
  - `scratchpad`: intermediate reasoning (with optional Zod validation)
- [ ] Create Zod schemas for each state channel
- [ ] Unit tests (5 tests)

**Example**:
```typescript
const ReActState = createStateAnnotation({
  messages: {
    schema: z.array(MessageSchema),
    reducer: (left, right) => [...left, ...right],
    default: () => []
  },
  thoughts: {
    schema: z.array(z.string()),
    reducer: (left, right) => [...left, ...right],
    default: () => []
  },
  actions: {
    schema: z.array(ToolCallSchema),
    reducer: (left, right) => [...left, ...right],
    default: () => []
  }
});
```

#### 3.1.2 ReAct Agent Builder
- [ ] `createReActAgent(config)` - Main factory function
  - `llm`: Language model to use
  - `tools`: Tool registry or tool list
  - `systemPrompt`: Optional system prompt
  - `maxIterations`: Max thought-action loops (default: 10)
  - `returnIntermediateSteps`: Include reasoning in output
- [ ] `ReActAgentBuilder` - Fluent builder API
- [ ] Prompt templates for ReAct pattern
- [ ] Unit tests (10 tests)

**Example**:
```typescript
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

const agent = createReActAgent({
  llm: new ChatOpenAI({ model: 'gpt-4' }),
  tools: toolRegistry,  // From Phase 1
  systemPrompt: 'You are a helpful assistant.',
  maxIterations: 10,
  returnIntermediateSteps: true
});

// Returns a compiled LangGraph StateGraph
const result = await agent.invoke({
  messages: [{ role: 'user', content: 'What is the weather?' }]
});
```

#### 3.1.3 ReAct Nodes
- [ ] `reasoningNode` - Generate thought and action
- [ ] `actionNode` - Execute tool calls
- [ ] `observationNode` - Process tool results
- [ ] `shouldContinue` - Conditional routing logic
- [ ] Unit tests (8 tests)

#### 3.1.4 Integration & Examples
- [ ] Integration with tool registry
- [ ] Integration with observability
- [ ] Example: Simple Q&A agent
- [ ] Example: Research agent with search
- [ ] Integration tests (7 tests)

**Total Tests**: 30 tests

---

## Phase 3.2: Plan-and-Execute Pattern (2 days)

### Overview
Plan-and-Execute separates planning from execution for better performance:
1. **Planner**: Creates a multi-step plan
2. **Executor**: Executes each step
3. **Re-planner**: Adjusts plan based on results

### Implementation Tasks

#### 3.2.1 Plan-and-Execute State
- [ ] Define `PlanExecuteState` using `createStateAnnotation()`
  - `input`: Original user query
  - `plan`: List of steps to execute
  - `pastSteps`: Completed steps with results
  - `currentStep`: Step being executed
  - `response`: Final response
- [ ] Create Zod schemas for plan steps
- [ ] Unit tests (5 tests)

**Example**:
```typescript
const PlanExecuteState = createStateAnnotation({
  input: {
    schema: z.string(),
    default: () => ''
  },
  plan: {
    schema: z.array(PlanStepSchema),
    default: () => []
  },
  pastSteps: {
    schema: z.array(CompletedStepSchema),
    reducer: (left, right) => [...left, ...right],
    default: () => []
  },
  currentStep: {
    schema: z.number().optional()
  },
  response: {
    schema: z.string().optional()
  }
});
```

#### 3.2.2 Planner Implementation
- [ ] `createPlanner(config)` - Create planning node
  - `llm`: Model for planning
  - `systemPrompt`: Planning instructions
  - `maxSteps`: Max plan steps
- [ ] Plan parsing and validation
- [ ] Unit tests (8 tests)

#### 3.2.3 Executor Implementation
- [ ] `createExecutor(config)` - Create execution node
  - `tools`: Available tools
  - `llm`: Optional LLM for sub-tasks
  - `parallel`: Enable parallel execution
- [ ] Step execution logic
- [ ] Result aggregation
- [ ] Unit tests (10 tests)

#### 3.2.4 Re-planning Logic
- [ ] `createReplanner(config)` - Re-planning node
- [ ] Conditional routing (continue/replan/finish)
- [ ] Unit tests (7 tests)

#### 3.2.5 Integration & Examples
- [ ] `createPlanExecuteAgent(config)` - Main factory
- [ ] Example: Multi-step research task
- [ ] Example: Data analysis workflow
- [ ] Integration tests (10 tests)

**Example**:
```typescript
import { createPlanExecuteAgent } from '@agentforge/patterns';

const agent = createPlanExecuteAgent({
  planner: {
    llm: new ChatOpenAI({ model: 'gpt-4' }),
    systemPrompt: 'Create a step-by-step plan to solve the task.',
    maxSteps: 5
  },
  executor: {
    tools: toolRegistry,
    parallel: false  // Execute steps sequentially
  },
  replanner: {
    llm: new ChatOpenAI({ model: 'gpt-4' }),
    replanThreshold: 0.7  // Replan if confidence < 70%
  }
});

const result = await agent.invoke({
  input: 'Research and summarize the latest AI trends'
});
```

**Total Tests**: 40 tests

---

## Phase 3.3: Reflection Pattern (2 days)

### Overview
Reflection improves output quality through self-critique:
1. **Generator**: Creates initial response
2. **Reflector**: Critiques the response
3. **Reviser**: Improves based on feedback
4. Repeats for N iterations

### Implementation Tasks

#### 3.3.1 Reflection State
- [ ] Define `ReflectionState` using `createStateAnnotation()`
  - `input`: Original query
  - `draft`: Current draft response
  - `reflections`: List of critiques
  - `iterations`: Number of reflection loops
- [ ] Create Zod schemas for reflections
- [ ] Unit tests (5 tests)

**Example**:
```typescript
const ReflectionState = createStateAnnotation({
  input: {
    schema: z.string(),
    default: () => ''
  },
  draft: {
    schema: z.string(),
    default: () => ''
  },
  reflections: {
    schema: z.array(ReflectionSchema),
    reducer: (left, right) => [...left, ...right],
    default: () => []
  },
  iterations: {
    schema: z.number(),
    reducer: (left, right) => left + right,
    default: () => 0
  }
});
```

#### 3.3.2 Generator Node
- [ ] `createGenerator(config)` - Initial response generator
- [ ] Prompt templates
- [ ] Unit tests (6 tests)

#### 3.3.3 Reflector Node
- [ ] `createReflector(config)` - Critique generator
  - `criteria`: Evaluation criteria
  - `grounded`: Use external data for grounding
- [ ] Reflection prompt templates
- [ ] Unit tests (8 tests)

#### 3.3.4 Reviser Node
- [ ] `createReviser(config)` - Response improver
- [ ] Revision strategies
- [ ] Unit tests (7 tests)

#### 3.3.5 Integration & Examples
- [ ] `createReflectionAgent(config)` - Main factory
  - `maxIterations`: Max reflection loops
  - `stopCondition`: Custom stop logic
- [ ] Example: Essay writing with reflection
- [ ] Example: Code generation with critique
- [ ] Integration tests (9 tests)

**Example**:
```typescript
import { createReflectionAgent } from '@agentforge/patterns';

const agent = createReflectionAgent({
  generator: {
    llm: new ChatOpenAI({ model: 'gpt-4' }),
    systemPrompt: 'Generate a high-quality response.'
  },
  reflector: {
    llm: new ChatOpenAI({ model: 'gpt-4' }),
    systemPrompt: 'Critique the response for accuracy and clarity.',
    criteria: ['accuracy', 'clarity', 'completeness']
  },
  reviser: {
    llm: new ChatOpenAI({ model: 'gpt-4' }),
    systemPrompt: 'Improve the response based on feedback.'
  },
  maxIterations: 3,
  stopCondition: (state) => state.reflections.every(r => r.score > 0.8)
});

const result = await agent.invoke({
  input: 'Write a technical blog post about LangGraph'
});
```

**Total Tests**: 35 tests

---

## Phase 3.4: Multi-Agent Coordination (1 day)

### Overview
Multi-agent patterns enable collaboration between specialized agents:
1. **Supervisor**: Routes tasks to specialized agents
2. **Workers**: Specialized agents for specific tasks
3. **Handoff**: Transfer control between agents

### Implementation Tasks

#### 3.4.1 Multi-Agent State
- [ ] Define `MultiAgentState` using `createStateAnnotation()`
  - `messages`: Shared message history
  - `currentAgent`: Active agent
  - `agentOutputs`: Results from each agent
  - `nextAgent`: Agent to route to
- [ ] Create Zod schemas for agent outputs
- [ ] Unit tests (5 tests)

**Example**:
```typescript
const MultiAgentState = createStateAnnotation({
  messages: {
    schema: z.array(MessageSchema),
    reducer: (left, right) => [...left, ...right],
    default: () => []
  },
  currentAgent: {
    schema: z.string().optional()
  },
  agentOutputs: {
    schema: z.record(z.any()),
    reducer: (left, right) => ({ ...left, ...right }),
    default: () => ({})
  },
  nextAgent: {
    schema: z.string().optional()
  }
});
```

#### 3.4.2 Supervisor Pattern
- [ ] `createSupervisor(config)` - Supervisor agent
  - `agents`: Map of available agents
  - `routingStrategy`: How to route tasks
- [ ] Routing logic
- [ ] Unit tests (8 tests)

#### 3.4.3 Worker Agents
- [ ] `createWorkerAgent(config)` - Specialized agent
  - `name`: Agent identifier
  - `description`: What the agent does
  - `tools`: Agent-specific tools
- [ ] Handoff utilities
- [ ] Unit tests (7 tests)

#### 3.4.4 Integration & Examples
- [ ] `createMultiAgentSystem(config)` - Main factory
- [ ] Example: Research team (researcher + writer + reviewer)
- [ ] Example: Customer support (triage + specialist + escalation)
- [ ] Integration tests (10 tests)

**Example**:
```typescript
import { createMultiAgentSystem } from '@agentforge/patterns';

const system = createMultiAgentSystem({
  supervisor: {
    llm: new ChatOpenAI({ model: 'gpt-4' }),
    routingStrategy: 'llm-based'  // or 'rule-based'
  },
  agents: {
    researcher: {
      llm: new ChatOpenAI({ model: 'gpt-4' }),
      tools: [searchTool, scrapeTool],
      description: 'Finds and gathers information from the web'
    },
    writer: {
      llm: new ChatOpenAI({ model: 'gpt-4' }),
      tools: [],
      description: 'Writes clear, engaging content'
    },
    reviewer: {
      llm: new ChatOpenAI({ model: 'gpt-4' }),
      tools: [],
      description: 'Reviews content for quality and accuracy'
    }
  }
});

const result = await system.invoke({
  messages: [{ role: 'user', content: 'Research and write about quantum computing' }]
});
```

**Total Tests**: 30 tests

---

## Testing Strategy

### Unit Tests
- Each component tested in isolation
- Mock LLM responses for deterministic tests
- Edge cases and error handling

### Integration Tests
- End-to-end pattern execution
- Integration with tool registry
- Integration with observability
- Real LLM calls (optional, env-gated)

### Performance Tests
- Measure iteration counts
- Track token usage
- Benchmark against baselines

**Total Phase 3 Tests**: 135 tests (30 + 40 + 35 + 30)

---

## Complete Example: Composing Patterns

Here's how you can **compose multiple patterns** together:

```typescript
import {
  createReActAgent,
  createReflectionAgent,
  createMultiAgentSystem
} from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

// 1. Create a ReAct agent with reflection
const researchAgent = createReActAgent({
  llm: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [searchTool, scrapeTool],
  systemPrompt: 'You are a thorough researcher.',
  maxIterations: 5
});

// 2. Wrap it in reflection for quality improvement
const reflectiveResearcher = createReflectionAgent({
  generator: {
    agent: researchAgent  // Use the ReAct agent as the generator
  },
  reflector: {
    llm: new ChatOpenAI({ model: 'gpt-4' }),
    criteria: ['accuracy', 'completeness', 'citations']
  },
  maxIterations: 2
});

// 3. Combine multiple agents in a multi-agent system
const researchTeam = createMultiAgentSystem({
  supervisor: {
    llm: new ChatOpenAI({ model: 'gpt-4' })
  },
  agents: {
    researcher: reflectiveResearcher,  // Our composed agent
    writer: createReActAgent({
      llm: new ChatOpenAI({ model: 'gpt-4' }),
      tools: [],
      systemPrompt: 'You write clear, engaging content.'
    }),
    reviewer: createReflectionAgent({
      generator: { llm: new ChatOpenAI({ model: 'gpt-4' }) },
      reflector: {
        llm: new ChatOpenAI({ model: 'gpt-4' }),
        criteria: ['clarity', 'grammar', 'structure']
      }
    })
  }
});

// 4. Execute the composed system
const result = await researchTeam.invoke({
  messages: [{
    role: 'user',
    content: 'Research quantum computing and write a blog post'
  }]
});
```

**Key Takeaway**: All patterns return compiled LangGraph `StateGraph` instances, so they can be:
- **Composed** together (agents within agents)
- **Extended** with custom nodes
- **Monitored** with our observability utilities
- **Persisted** with checkpointers

---

## Documentation Requirements

### API Documentation
- [ ] Complete API reference for each pattern
- [ ] Configuration options
- [ ] Return types and state schemas

### Guides
- [ ] Pattern comparison guide
- [ ] When to use each pattern
- [ ] Performance characteristics
- [ ] Best practices

### Examples
- [ ] At least 2 examples per pattern
- [ ] Real-world use cases
- [ ] Integration with existing utilities

---

## Success Criteria

### Functionality
- ✅ All 4 patterns implemented
- ✅ 135+ tests passing
- ✅ Full TypeScript support
- ✅ Integration with Phase 1 & 2 utilities

### Performance
- ✅ ReAct: <10 iterations for simple tasks
- ✅ Plan-Execute: 30% faster than ReAct for multi-step tasks
- ✅ Reflection: Measurable quality improvement
- ✅ Multi-Agent: Efficient task routing

### Documentation
- ✅ Complete API docs
- ✅ Pattern comparison guide
- ✅ 8+ working examples
- ✅ Migration guide from raw LangGraph

---

## Dependencies

### Required
- Phase 1: Tool Registry (for tool integration)
- Phase 2.1: State Management (for state definitions)
- Phase 2.2: Workflow Builders (for graph construction)
- Phase 2.4: Observability (for tracing and metrics)

### Optional
- LangSmith for tracing (recommended)
- Real LLM API keys for integration tests

---

## Deliverables

### Code
- `packages/core/src/patterns/react/` - ReAct pattern
- `packages/core/src/patterns/plan-execute/` - Plan-Execute pattern
- `packages/core/src/patterns/reflection/` - Reflection pattern
- `packages/core/src/patterns/multi-agent/` - Multi-Agent pattern
- `packages/core/src/patterns/index.ts` - Main exports

### Tests
- `packages/core/tests/patterns/react/` - ReAct tests
- `packages/core/tests/patterns/plan-execute/` - Plan-Execute tests
- `packages/core/tests/patterns/reflection/` - Reflection tests
- `packages/core/tests/patterns/multi-agent/` - Multi-Agent tests

### Documentation
- `docs/patterns/react.md` - ReAct guide
- `docs/patterns/plan-execute.md` - Plan-Execute guide
- `docs/patterns/reflection.md` - Reflection guide
- `docs/patterns/multi-agent.md` - Multi-Agent guide
- `docs/patterns/comparison.md` - Pattern comparison
- `docs/PHASE_3_COMPLETE.md` - Completion report

### Examples
- `packages/core/examples/patterns/react-qa.ts`
- `packages/core/examples/patterns/react-research.ts`
- `packages/core/examples/patterns/plan-execute-research.ts`
- `packages/core/examples/patterns/plan-execute-analysis.ts`
- `packages/core/examples/patterns/reflection-essay.ts`
- `packages/core/examples/patterns/reflection-code.ts`
- `packages/core/examples/patterns/multi-agent-research.ts`
- `packages/core/examples/patterns/multi-agent-support.ts`

---

## Timeline

| Sub-Phase | Duration | Tests | Deliverables |
|-----------|----------|-------|--------------|
| 3.1 ReAct | 2 days | 30 | ReAct pattern + examples |
| 3.2 Plan-Execute | 2 days | 40 | Plan-Execute pattern + examples |
| 3.3 Reflection | 2 days | 35 | Reflection pattern + examples |
| 3.4 Multi-Agent | 1 day | 30 | Multi-Agent pattern + examples |
| **Total** | **7 days** | **135** | **4 patterns, 8+ examples** |

---

## Notes

### Design Philosophy
- **Leverage LangGraph 1.0**: Use LangGraph's StateGraph with durable state and HITL
- **Composable**: Patterns should work together (e.g., ReAct + Reflection)
- **Configurable**: Sensible defaults, but highly customizable
- **Observable**: Built-in tracing and metrics
- **Production-Ready**: Persistence, error handling, and human-in-the-loop support

### Future Enhancements (Post-Phase 3)
- Tree of Thoughts pattern
- LLMCompiler pattern (parallel tool execution from LangChain blog Feb 2024)
- ReWOO pattern (reasoning without observation from LangChain blog Feb 2024)
- LATS pattern (Language Agent Tree Search from LangChain blog Feb 2024)
- Custom pattern builder API
- Integration with LangChain 1.0's middleware system

### References
- LangChain 1.0 & LangGraph 1.0 Release (October 2025)
- Plan-and-Execute Agents (LangChain Blog, Feb 2024)
- Reflection Agents (LangChain Blog, Feb 2024)
- LangGraph Workflow Updates (June 2025)

