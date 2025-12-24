# LangGraph Quick Reference

Quick reference for AgentForge's LangGraph state utilities.

## Installation

```bash
npm install @agentforge/core @langchain/langgraph zod
```

## Basic Usage

```typescript
import { StateGraph } from '@langchain/langgraph';
import { createStateAnnotation } from '@agentforge/core';
import { z } from 'zod';

// 1. Define state
const State = createStateAnnotation({
  messages: {
    schema: z.array(z.string()),
    reducer: (left, right) => [...left, ...right],
    default: () => []
  }
});

// 2. Create workflow
const workflow = new StateGraph(State)
  .addNode('myNode', (state) => ({ messages: ['hello'] }))
  .compile();

// 3. Run
const result = await workflow.invoke({ messages: [] });
```

## State Channel Types

### Simple Channel (Last Value)

```typescript
{
  userId: {
    schema: z.string(),
    description: 'User ID'
  }
}
```

### Reducer Channel (Accumulate)

```typescript
{
  messages: {
    schema: z.array(z.string()),
    reducer: (left, right) => [...left, ...right],
    default: () => []
  }
}
```

### No Schema (Any Value)

```typescript
{
  metadata: {
    default: () => ({})
  }
}
```

## Common Reducers

### Array Concatenation

```typescript
reducer: (left: T[], right: T[]) => [...left, ...right]
```

### Number Addition

```typescript
reducer: (left: number, right: number) => left + right
```

### Object Merge

```typescript
reducer: (left: Record<string, any>, right: Record<string, any>) => ({
  ...left,
  ...right
})
```

### Max/Min

```typescript
reducer: (left: number, right: number) => Math.max(left, right)
reducer: (left: number, right: number) => Math.min(left, right)
```

### Counter Map

```typescript
reducer: (left: Record<string, number>, right: Record<string, number>) => {
  const merged = { ...left };
  for (const [key, value] of Object.entries(right)) {
    merged[key] = (merged[key] || 0) + value;
  }
  return merged;
}
```

## Validation

```typescript
import { validateState } from '@agentforge/core';

const config = {
  count: { schema: z.number() }
};

try {
  const validated = validateState(state, config);
  // Use validated state
} catch (error) {
  // Handle validation error
}
```

## State Merging

```typescript
import { mergeState } from '@agentforge/core';

const config = {
  messages: {
    reducer: (left: string[], right: string[]) => [...left, ...right]
  }
};

const merged = mergeState(
  { messages: ['a'] },
  { messages: ['b'] },
  config
);
// Result: { messages: ['a', 'b'] }
```

## Type Inference

```typescript
const State = createStateAnnotation({
  count: { schema: z.number() }
});

// Get the state type
type MyState = typeof State.State;

// Use in node functions
const myNode = (state: MyState) => {
  // state.count is typed as number
  return { count: state.count + 1 };
};
```

## Common Patterns

### Message Accumulation

```typescript
const State = createStateAnnotation({
  messages: {
    schema: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string()
    })),
    reducer: (left, right) => [...left, ...right],
    default: () => []
  }
});
```

### Event Tracking

```typescript
const State = createStateAnnotation({
  events: {
    schema: z.array(z.object({
      type: z.string(),
      timestamp: z.number(),
      data: z.any()
    })),
    reducer: (left, right) => [...left, ...right],
    default: () => []
  }
});
```

### Step Counter

```typescript
const State = createStateAnnotation({
  stepCount: {
    schema: z.number().int().nonnegative(),
    reducer: (left, right) => left + right,
    default: () => 0
  }
});
```

### Context Accumulation

```typescript
const State = createStateAnnotation({
  context: {
    schema: z.record(z.string(), z.any()),
    reducer: (left, right) => ({ ...left, ...right }),
    default: () => ({})
  }
});
```

## Error Handling

```typescript
import { z } from 'zod';

const myNode = (state: State) => {
  try {
    // Validate input
    const validated = validateState(state, config);
    
    // Process
    const result = processData(validated);
    
    return { data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation failed:', error.errors);
      return { error: 'Invalid state' };
    }
    throw error;
  }
};
```

## See Also

- [Full Documentation](./LANGGRAPH_INTEGRATION.md)
- [Examples](../examples/langgraph-state.ts)
- [LangGraph Docs](https://langchain-ai.github.io/langgraphjs/)

