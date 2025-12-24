# LangGraph Integration

AgentForge provides type-safe utilities for working with LangGraph's state management system.

## Overview

LangGraph is a powerful framework for building stateful, multi-actor applications with LLMs. AgentForge enhances LangGraph with:

- **Type-safe state annotations** - Better TypeScript inference and IDE support
- **Zod schema validation** - Runtime validation of state values
- **Reducer utilities** - Helper functions for state merging
- **Documentation support** - Describe your state channels

## Installation

```bash
npm install @agentforge/core @langchain/langgraph zod
```

## Quick Start

```typescript
import { StateGraph } from '@langchain/langgraph';
import { z } from 'zod';
import { createStateAnnotation } from '@agentforge/core';

// Define state with Zod schemas and reducers
const AgentState = createStateAnnotation({
  messages: {
    schema: z.array(z.string()),
    reducer: (left, right) => [...left, ...right],
    default: () => [],
    description: 'Chat messages'
  },
  context: {
    schema: z.record(z.any()),
    default: () => ({}),
    description: 'Agent context'
  }
});

// Type inference works!
type State = typeof AgentState.State;

// Use with LangGraph
const workflow = new StateGraph(AgentState)
  .addNode('myNode', (state: State) => {
    return { messages: ['Hello!'] };
  })
  .compile();
```

## State Channel Configuration

Each state channel can be configured with:

```typescript
interface StateChannelConfig<T, U = T> {
  // Optional Zod schema for runtime validation
  schema?: ZodType<T>;
  
  // Optional reducer for aggregating updates
  reducer?: (left: T, right: U) => T;
  
  // Optional default value factory
  default?: () => T;
  
  // Description for documentation
  description?: string;
}
```

### Simple Channels

Simple channels store the most recent value:

```typescript
const State = createStateAnnotation({
  userId: {
    schema: z.string(),
    description: 'Current user ID'
  },
  count: {
    schema: z.number(),
    default: () => 0
  }
});
```

### Reducer Channels

Reducer channels aggregate updates:

```typescript
const State = createStateAnnotation({
  messages: {
    schema: z.array(z.string()),
    reducer: (left, right) => [...left, ...right],
    default: () => [],
    description: 'Accumulated messages'
  },
  sum: {
    schema: z.number(),
    reducer: (left, right) => left + right,
    default: () => 0,
    description: 'Running sum'
  }
});
```

## Validation

Validate state against Zod schemas:

```typescript
import { validateState } from '@agentforge/core';

const config = {
  count: { schema: z.number() },
  name: { schema: z.string() }
};

// Valid state
const state = { count: 42, name: 'Alice' };
const validated = validateState(state, config); // ✓ Passes

// Invalid state
const badState = { count: 'not a number', name: 'Bob' };
validateState(badState, config); // ✗ Throws ZodError
```

## State Merging

Merge state updates using configured reducers:

```typescript
import { mergeState } from '@agentforge/core';

const config = {
  messages: {
    reducer: (left: string[], right: string[]) => [...left, ...right]
  },
  count: {} // Simple replacement
};

const current = { messages: ['a'], count: 1 };
const update = { messages: ['b'], count: 2 };

const merged = mergeState(current, update, config);
// Result: { messages: ['a', 'b'], count: 2 }
```

## Complete Example

See [examples/langgraph-state.ts](../examples/langgraph-state.ts) for a complete working example.

## Design Philosophy

AgentForge's LangGraph integration follows these principles:

1. **Thin wrappers** - We enhance LangGraph's API, not replace it
2. **Type safety** - Leverage TypeScript for better developer experience
3. **Runtime validation** - Use Zod for catching errors early
4. **Composability** - Works seamlessly with existing LangGraph code

## API Reference

### `createStateAnnotation(config)`

Creates a LangGraph `AnnotationRoot` with enhanced type safety and validation.

**Parameters:**
- `config` - Object mapping state keys to `StateChannelConfig`

**Returns:**
- `AnnotationRoot<StateDefinition>` - LangGraph annotation

### `validateState(state, config)`

Validates state against Zod schemas.

**Parameters:**
- `state` - State object to validate
- `config` - State channel configuration

**Returns:**
- Validated state object

**Throws:**
- `ZodError` if validation fails

### `mergeState(currentState, update, config)`

Merges state updates using configured reducers.

**Parameters:**
- `currentState` - Current state
- `update` - State update
- `config` - State channel configuration

**Returns:**
- Merged state object

