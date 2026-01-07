# State Management

State is the data that flows through your agent as it processes tasks. AgentForge provides type-safe state management built on LangGraph's annotation system with Zod validation.

::: tip Related Concepts
- **[Memory & Persistence](/guide/concepts/memory)** - Learn how to persist state across sessions
- **[Agent Patterns](/guide/concepts/patterns)** - See how state is used in different patterns
- **[Advanced Patterns](/tutorials/advanced-patterns)** - Complex state management patterns
:::

## What is State?

State is a collection of **channels** (key-value pairs) that represent your agent's current context:

```typescript
{
  messages: ['Hello', 'How can I help?'],
  context: { user: 'Alice', sessionId: '123' },
  stepCount: 2
}
```

Each channel can have:
- **Schema** - Zod schema for validation
- **Reducer** - Function to merge updates
- **Default** - Initial value
- **Description** - Documentation

## Creating State

### Basic State Definition

```typescript
import { createStateAnnotation } from '@agentforge/core';
import { z } from 'zod';

const AgentState = createStateAnnotation({
  messages: {
    schema: z.array(z.string()),
    reducer: (left, right) => [...left, ...right], // Append messages
    default: () => [],
    description: 'Chat message history',
  },
  context: {
    schema: z.record(z.any()),
    default: () => ({}),
    description: 'Agent context data',
  },
  stepCount: {
    schema: z.number(),
    reducer: (left, right) => left + right, // Sum step counts
    default: () => 0,
    description: 'Number of processing steps',
  },
});

// Type inference works!
type State = typeof AgentState.State;
```

### Using with LangGraph

```typescript
import { StateGraph } from '@langchain/langgraph';

const workflow = new StateGraph(AgentState)
  .addNode('process', (state: State) => {
    return {
      messages: ['Processed input'],
      stepCount: 1,
    };
  })
  .addNode('respond', (state: State) => {
    return {
      messages: ['Generated response'],
      stepCount: 1,
    };
  })
  .addEdge('__start__', 'process')
  .addEdge('process', 'respond')
  .addEdge('respond', '__end__');

const app = workflow.compile();

const result = await app.invoke({
  messages: ['Hello'],
  context: {},
  stepCount: 0,
});

console.log(result.messages); // ['Hello', 'Processed input', 'Generated response']
console.log(result.stepCount); // 2
```

## State Channels

### Simple Channels (Last Value)

Channels without reducers use "last value wins" semantics:

```typescript
const State = createStateAnnotation({
  currentUser: {
    schema: z.string(),
    default: () => 'anonymous',
    description: 'Current user ID',
  },
  temperature: {
    schema: z.number(),
    default: () => 0.7,
    description: 'LLM temperature',
  },
});

// Updates replace the previous value
node1: (state) => ({ currentUser: 'alice' })  // currentUser = 'alice'
node2: (state) => ({ currentUser: 'bob' })    // currentUser = 'bob' (replaced)
```

### Channels with Reducers

Channels with reducers merge updates using custom logic:

```typescript
const State = createStateAnnotation({
  // Append to array
  messages: {
    schema: z.array(z.string()),
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  },
  
  // Sum numbers
  totalCost: {
    schema: z.number(),
    reducer: (left, right) => left + right,
    default: () => 0,
  },
  
  // Merge objects
  metadata: {
    schema: z.record(z.any()),
    reducer: (left, right) => ({ ...left, ...right }),
    default: () => ({}),
  },
  
  // Custom logic
  errors: {
    schema: z.array(z.string()),
    reducer: (left, right) => {
      // Keep only unique errors
      return Array.from(new Set([...left, ...right]));
    },
    default: () => [],
  },
});
```

## State Validation

### Runtime Validation

Validate state at runtime using Zod schemas:

```typescript
import { validateState } from '@agentforge/core';

const stateConfig = {
  messages: {
    schema: z.array(z.string().min(1)),
    default: () => [],
  },
  count: {
    schema: z.number().positive(),
    default: () => 0,
  },
};

try {
  const validated = validateState(
    { messages: ['hello'], count: 5 },
    stateConfig
  );
  console.log('✓ State is valid');
} catch (error) {
  console.error('✗ Validation failed:', error);
}
```

### Automatic Validation

Validation happens automatically when using `createStateAnnotation`:

```typescript
const State = createStateAnnotation({
  email: {
    schema: z.string().email(),
    default: () => '',
  },
});

// This will throw if email is invalid
const result = await app.invoke({
  email: 'invalid-email', // ❌ Validation error!
});
```

## State Updates

### Partial Updates

Nodes can return partial state updates:

```typescript
const workflow = new StateGraph(AgentState)
  .addNode('node1', (state) => {
    // Only update messages, leave other channels unchanged
    return { messages: ['New message'] };
  })
  .addNode('node2', (state) => {
    // Update multiple channels
    return {
      messages: ['Another message'],
      stepCount: 1,
    };
  });
```

### Conditional Updates

Update state based on conditions:

```typescript
const processNode = (state: State) => {
  if (state.messages.length > 10) {
    return {
      messages: ['Conversation too long'],
      context: { ...state.context, truncated: true },
    };
  }

  return {
    messages: ['Processing...'],
    stepCount: 1,
  };
};
```

### Merging State

Manually merge state updates:

```typescript
import { mergeState } from '@agentforge/core';

const currentState = {
  messages: ['a', 'b'],
  count: 5,
};

const update = {
  messages: ['c'],
  count: 3,
};

const merged = mergeState(currentState, update, stateConfig);
// Result: { messages: ['a', 'b', 'c'], count: 8 }
```

## Common Patterns

### Pattern 1: Message History

```typescript
const ChatState = createStateAnnotation({
  messages: {
    schema: z.array(z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })),
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  },
});
```

### Pattern 2: Accumulating Results

```typescript
const ResearchState = createStateAnnotation({
  query: {
    schema: z.string(),
    default: () => '',
  },
  sources: {
    schema: z.array(z.object({
      url: z.string(),
      title: z.string(),
      content: z.string(),
    })),
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  },
  summary: {
    schema: z.string(),
    default: () => '',
  },
});
```

### Pattern 3: Error Tracking

```typescript
const RobustState = createStateAnnotation({
  errors: {
    schema: z.array(z.object({
      node: z.string(),
      message: z.string(),
      timestamp: z.number(),
    })),
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  },
  retryCount: {
    schema: z.number(),
    reducer: (left, right) => left + right,
    default: () => 0,
  },
});
```

### Pattern 4: Metadata Tracking

```typescript
const TrackedState = createStateAnnotation({
  metadata: {
    schema: z.record(z.any()),
    reducer: (left, right) => ({ ...left, ...right }),
    default: () => ({
      startTime: Date.now(),
      version: '1.0.0',
    }),
  },
});
```

## Best Practices

### 1. Use Descriptive Channel Names

```typescript
// ✅ Good - clear and specific
const State = createStateAnnotation({
  userMessages: { ... },
  assistantResponses: { ... },
  searchResults: { ... },
});

// ❌ Bad - vague names
const State = createStateAnnotation({
  data: { ... },
  stuff: { ... },
  temp: { ... },
});
```

### 2. Provide Defaults

Always provide default values for channels:

```typescript
// ✅ Good - has defaults
const State = createStateAnnotation({
  messages: {
    schema: z.array(z.string()),
    default: () => [],
  },
});

// ❌ Bad - no default (may cause errors)
const State = createStateAnnotation({
  messages: {
    schema: z.array(z.string()),
  },
});
```

### 3. Choose Appropriate Reducers

Match reducers to your data semantics:

```typescript
// ✅ Good - append for messages
messages: {
  reducer: (left, right) => [...left, ...right],
}

// ✅ Good - sum for counts
totalCost: {
  reducer: (left, right) => left + right,
}

// ✅ Good - merge for objects
metadata: {
  reducer: (left, right) => ({ ...left, ...right }),
}

// ❌ Bad - wrong reducer for messages
messages: {
  reducer: (left, right) => right, // Loses history!
}
```

### 4. Validate Critical Data

Use Zod schemas for important channels:

```typescript
const State = createStateAnnotation({
  // ✅ Good - validates email format
  userEmail: {
    schema: z.string().email(),
    default: () => '',
  },

  // ✅ Good - validates positive numbers
  price: {
    schema: z.number().positive(),
    default: () => 0,
  },

  // ✅ Good - validates enum values
  status: {
    schema: z.enum(['pending', 'processing', 'complete']),
    default: () => 'pending',
  },
});
```

### 5. Document Your Channels

Add descriptions to help other developers:

```typescript
const State = createStateAnnotation({
  messages: {
    schema: z.array(z.string()),
    reducer: (left, right) => [...left, ...right],
    default: () => [],
    description: 'Conversation history between user and assistant',
  },
  context: {
    schema: z.record(z.any()),
    default: () => ({}),
    description: 'Additional context data like user preferences, session info',
  },
});
```

## Type Safety

AgentForge provides full TypeScript support:

```typescript
const State = createStateAnnotation({
  count: {
    schema: z.number(),
    default: () => 0,
  },
});

type StateType = typeof State.State;

const myNode = (state: StateType) => {
  // ✅ TypeScript knows count is a number
  const doubled = state.count * 2;

  // ❌ TypeScript error - count is not a string
  // const upper = state.count.toUpperCase();

  return { count: doubled };
};
```

## Next Steps

- [Memory & Persistence](/guide/concepts/memory) - Persisting state across sessions
- [Agent Patterns](/guide/concepts/patterns) - Using state in different patterns
- [API Reference](/api/core#state-management) - Complete state API
- [Advanced Patterns](/tutorials/advanced-patterns) - Complex state management patterns


