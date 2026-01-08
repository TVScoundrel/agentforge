# Phase 2: LangGraph Integration & Agent Utilities

**Status**: 🚧 In Progress  
**Start Date**: December 24, 2025  
**Duration**: 7 days  
**Philosophy**: **Leverage LangGraph/LangChain fully - don't reinvent the wheel!**

---

## Core Principle

**AgentForge is NOT a replacement for LangGraph/LangChain.**

Instead, we provide:
- ✅ Type-safe, ergonomic wrappers around LangGraph
- ✅ Integration with our tool registry
- ✅ Utilities that make LangGraph easier to use in TypeScript
- ✅ Opinionated patterns and best practices
- ❌ NOT a competing agent framework
- ❌ NOT reimplementing state management
- ❌ NOT reimplementing graph execution

---

## What LangGraph Already Provides

LangGraph (via @langchain/langgraph) already has:
- ✅ StateGraph for building agent workflows
- ✅ Checkpointers for persistence (memory, postgres, redis, etc.)
- ✅ State management with reducers
- ✅ Streaming support
- ✅ Interrupts and human-in-the-loop
- ✅ Time travel debugging
- ✅ Subgraphs
- ✅ LangSmith integration

**We will use ALL of these directly!**

---

## What We Add (Phase 2)

### 2.1 LangGraph State Utilities (2 days)

**Goal**: Make LangGraph state management more TypeScript-friendly

#### Features
1. **Typed State Helpers**
   ```typescript
   import { createState, StateAnnotation } from '@agentforge/core';
   
   // Type-safe state definition
   const AgentState = createState({
     messages: StateAnnotation.array<Message>(),
     context: StateAnnotation.object<Context>(),
     toolResults: StateAnnotation.array<ToolResult>(),
   });
   
   type AgentStateType = typeof AgentState.State;
   ```

2. **Zod Schema Validation**
   ```typescript
   import { validateState } from '@agentforge/core';
   
   const stateSchema = z.object({
     messages: z.array(MessageSchema),
     context: ContextSchema,
   });
   
   // Automatic validation on state updates
   const validatedState = validateState(state, stateSchema);
   ```

3. **State Reducer Utilities**
   ```typescript
   import { createReducer } from '@agentforge/core';
   
   const messagesReducer = createReducer<Message[]>({
     append: (state, messages) => [...state, ...messages],
     replace: (state, messages) => messages,
     clear: () => [],
   });
   ```

#### Deliverables
- `src/langgraph/state.ts` - State utilities
- `tests/langgraph/state.test.ts` - 15 tests
- Examples

---

### 2.2 Agent Builder with LangGraph (2 days)

**Goal**: Fluent builder for creating LangGraph agents with our tool registry

#### Features
1. **Agent Builder**
   ```typescript
   import { agentBuilder } from '@agentforge/core';
   import { StateGraph } from '@langchain/langgraph';
   
   const agent = agentBuilder()
     .name('research-agent')
     .state(AgentState)
     .tools(registry) // Use our tool registry!
     .model(chatModel)
     .checkpointer(MemorySaver) // LangGraph checkpointer
     .node('research', researchNode)
     .node('summarize', summarizeNode)
     .edge('research', 'summarize')
     .build(); // Returns compiled StateGraph
   ```

2. **Tool Registry Integration**
   ```typescript
   // Automatically bind tools from registry
   const agent = agentBuilder()
     .tools(registry.getByCategory(ToolCategory.WEB))
     .build();
   ```

3. **Checkpointer Helpers**
   ```typescript
   import { createCheckpointer } from '@agentforge/core';
   
   const checkpointer = createCheckpointer({
     type: 'memory', // or 'postgres', 'redis'
     config: { ... },
   });
   ```

#### Deliverables
- `src/langgraph/builder.ts` - Agent builder
- `src/langgraph/checkpointer.ts` - Checkpointer helpers
- `tests/langgraph/builder.test.ts` - 20 tests
- Examples

---

### 2.3 Memory & Persistence Helpers (1 day)

**Goal**: Simplify LangGraph memory/persistence configuration

#### Features
1. **Checkpointer Factory**
   ```typescript
   import { createMemoryCheckpointer, createPostgresCheckpointer } from '@agentforge/core';
   
   // Development
   const devCheckpointer = createMemoryCheckpointer();
   
   // Production
   const prodCheckpointer = createPostgresCheckpointer({
     connectionString: process.env.DATABASE_URL,
   });
   ```

2. **Thread Management**
   ```typescript
   import { ThreadManager } from '@agentforge/core';
   
   const threads = new ThreadManager(checkpointer);
   await threads.create('user-123');
   await threads.list('user-123');
   await threads.delete('thread-456');
   ```

#### Deliverables
- `src/langgraph/memory.ts` - Memory utilities
- `tests/langgraph/memory.test.ts` - 10 tests

---

### 2.4 Observability & Error Handling (1 day)

**Goal**: Better observability and error handling for LangGraph agents

#### Features
1. **LangSmith Integration Helpers**
   ```typescript
   import { configureLangSmith } from '@agentforge/core';

   configureLangSmith({
     apiKey: process.env.LANGSMITH_API_KEY,
     projectName: 'my-agent',
     tracingEnabled: true,
   });
   ```

2. **Error Handling Utilities**
   ```typescript
   import { withRetry, withErrorHandling } from '@agentforge/core';

   const node = withRetry(
     withErrorHandling(myNode, {
       onError: (error) => console.error(error),
       fallback: (state) => ({ ...state, error: true }),
     }),
     { maxRetries: 3, backoff: 'exponential' }
   );
   ```

3. **Logging Utilities**
   ```typescript
   import { createLogger } from '@agentforge/core';

   const logger = createLogger('research-agent');
   logger.info('Starting research', { query });
   logger.error('Research failed', { error });
   ```

#### Deliverables
- `src/langgraph/observability.ts` - Observability utilities
- `src/langgraph/errors.ts` - Error handling
- `tests/langgraph/observability.test.ts` - 10 tests

---

### 2.5 Testing & Documentation (1 day)

#### Deliverables
- [ ] Comprehensive unit tests (55 tests total)
- [ ] Integration tests with LangGraph
- [ ] 3 example agents:
  - Simple ReAct agent
  - Multi-step research agent
  - Agent with memory/persistence
- [ ] API documentation
- [ ] Migration guide from raw LangGraph

---

## Dependencies

We will add these peer dependencies:

```json
{
  "peerDependencies": {
    "@langchain/core": "^1.1.8",
    "@langchain/langgraph": "^0.2.0",
    "zod": "^3.0.0"
  }
}
```

**Note**: We use LangGraph as a peer dependency, not reimplementing it!

---

## File Structure

```
packages/core/src/langgraph/
├── state.ts           # State utilities
├── builder.ts         # Agent builder
├── checkpointer.ts    # Checkpointer helpers
├── memory.ts          # Memory utilities
├── observability.ts   # LangSmith, logging
├── errors.ts          # Error handling
└── index.ts           # Public exports

packages/core/tests/langgraph/
├── state.test.ts      # 15 tests
├── builder.test.ts    # 20 tests
├── memory.test.ts     # 10 tests
└── observability.test.ts # 10 tests

packages/core/examples/
├── simple-agent.ts         # Basic LangGraph agent
├── research-agent.ts       # Multi-step agent
└── persistent-agent.ts     # Agent with memory
```

---

## Success Criteria

- [ ] All utilities are thin wrappers around LangGraph
- [ ] Tool registry integrates seamlessly with LangGraph
- [ ] Type safety is maintained throughout
- [ ] 55+ tests passing
- [ ] Documentation is complete
- [ ] Examples demonstrate real-world usage
- [ ] No reimplementation of LangGraph features

---

## Anti-Patterns to Avoid

❌ **Don't** create our own state management system
✅ **Do** provide type-safe wrappers for LangGraph state

❌ **Don't** create our own graph execution engine
✅ **Do** provide fluent builders for LangGraph StateGraph

❌ **Don't** create our own checkpointer implementations
✅ **Do** provide factory functions for LangGraph checkpointers

❌ **Don't** create our own streaming system
✅ **Do** use LangGraph's streaming directly

---

## Example: Before & After

### Before (Raw LangGraph)
```typescript
import { StateGraph, Annotation } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph';

const StateAnnotation = Annotation.Root({
  messages: Annotation<Message[]>({
    reducer: (state, update) => [...state, ...update],
  }),
});

const graph = new StateGraph(StateAnnotation);
graph.addNode('agent', agentNode);
graph.addNode('tools', toolsNode);
graph.addEdge('agent', 'tools');
graph.addEdge('tools', 'agent');

const checkpointer = new MemorySaver();
const app = graph.compile({ checkpointer });
```

### After (AgentForge)
```typescript
import { agentBuilder, createState, StateAnnotation } from '@agentforge/core';

const AgentState = createState({
  messages: StateAnnotation.array<Message>(),
});

const agent = agentBuilder()
  .name('my-agent')
  .state(AgentState)
  .tools(registry)
  .model(chatModel)
  .memory('memory') // Automatic checkpointer
  .node('agent', agentNode)
  .node('tools', toolsNode)
  .edge('agent', 'tools')
  .edge('tools', 'agent')
  .build(); // Returns compiled LangGraph StateGraph
```

**Key difference**: More ergonomic, type-safe, integrated with our tools, but still using LangGraph under the hood!

---

## Timeline

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | State utilities | state.ts + 15 tests |
| 2 | State utilities (cont.) | Examples + docs |
| 3 | Agent builder | builder.ts + 10 tests |
| 4 | Agent builder (cont.) | checkpointer.ts + 10 tests |
| 5 | Memory & observability | memory.ts + errors.ts + 20 tests |
| 6 | Testing & examples | 3 examples + integration tests |
| 7 | Documentation | API docs + migration guide |

---

## Next Phase Preview

**Phase 3** will build on this to provide:
- Pre-built agent patterns (ReAct, Planner-Executor, etc.)
- Multi-agent orchestration helpers
- Advanced memory strategies
- All still using LangGraph under the hood!


