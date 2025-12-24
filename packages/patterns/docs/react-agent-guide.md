# ReAct Agent Usage Guide

## Overview

The ReAct (Reasoning and Action) pattern implements a thought-action-observation loop where the agent:
1. **Thinks** about what to do next
2. **Acts** by calling a tool or responding
3. **Observes** the result
4. **Repeats** until the task is complete

## Quick Start

### Basic Usage

```typescript
import { ReActAgentBuilder } from '@agentforge/core';
import { ChatOpenAI } from '@langchain/openai';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

// Create a tool
const calculatorTool = toolBuilder()
  .name('calculator')
  .description('Perform arithmetic operations')
  .category(ToolCategory.UTILITY)
  .schema(
    z.object({
      operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
      a: z.number(),
      b: z.number(),
    })
  )
  .implement(async ({ operation, a, b }) => {
    switch (operation) {
      case 'add': return a + b;
      case 'subtract': return a - b;
      case 'multiply': return a * b;
      case 'divide': return a / b;
    }
  })
  .build();

// Create the agent
const agent = new ReActAgentBuilder()
  .withLLM(new ChatOpenAI({ model: 'gpt-4' }))
  .withTools([calculatorTool])
  .build();

// Use the agent
const result = await agent.invoke({
  messages: [{ role: 'user', content: 'What is 15 * 7?' }],
});

console.log(result.response); // "The result is 105"
```

## Builder API

### Required Configuration

#### `withLLM(llm: BaseChatModel)`
Set the language model for reasoning.

```typescript
import { ChatOpenAI } from '@langchain/openai';

builder.withLLM(new ChatOpenAI({ 
  model: 'gpt-4',
  temperature: 0 
}));
```

#### `withTools(tools: Tool[] | ToolRegistry)`
Set the tools available to the agent.

```typescript
// Using an array
builder.withTools([tool1, tool2, tool3]);

// Using a registry
const registry = new ToolRegistry();
registry.register(tool1);
registry.register(tool2);
builder.withTools(registry);
```

### Optional Configuration

#### `withSystemPrompt(prompt: string)`
Customize the system prompt (default: standard ReAct prompt).

```typescript
builder.withSystemPrompt(
  'You are a helpful assistant that thinks step by step. ' +
  'Use tools when needed to answer questions accurately.'
);
```

#### `withMaxIterations(max: number)`
Set maximum thought-action loops (default: 10).

```typescript
builder.withMaxIterations(15);
```

#### `withReturnIntermediateSteps(value: boolean)`
Include reasoning steps in output (default: false).

```typescript
builder.withReturnIntermediateSteps(true);
```

#### `withStopCondition(fn: (state) => boolean)`
Custom termination logic.

```typescript
builder.withStopCondition((state) => {
  // Stop if we've used more than 5 tool calls
  return state.actions.length > 5;
});
```

#### `withVerbose(value: boolean)`
Enable verbose logging (default: false).

```typescript
builder.withVerbose(true);
```

#### `withNodeNames(names: { agent?: string; tools?: string })`
Customize node names in the graph.

```typescript
builder.withNodeNames({
  agent: 'reasoning-node',
  tools: 'action-node'
});
```

## Advanced Usage

### Using Tool Registry

```typescript
import { ToolRegistry, ToolCategory } from '@agentforge/core';

const registry = new ToolRegistry();

// Register multiple tools
registry.register(calculatorTool);
registry.register(searchTool);
registry.register(weatherTool);

// Query tools by category
const utilityTools = registry.getByCategory(ToolCategory.UTILITY);

// Create agent with registry
const agent = new ReActAgentBuilder()
  .withLLM(llm)
  .withTools(registry)
  .build();
```

### Custom Stop Conditions

```typescript
const agent = new ReActAgentBuilder()
  .withLLM(llm)
  .withTools(tools)
  .withStopCondition((state) => {
    // Stop if we've reached a conclusion
    if (state.response) return true;
    
    // Stop if we've exceeded iteration limit
    if (state.iteration >= 10) return true;
    
    // Stop if we've encountered too many errors
    const errors = state.observations.filter(o => o.error);
    if (errors.length > 3) return true;
    
    return false;
  })
  .build();
```

## Factory Function

Alternative to the builder pattern:

```typescript
import { createReActAgent } from '@agentforge/core';

const agent = createReActAgent({
  llm: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [calculatorTool],
  systemPrompt: 'Custom prompt',
  maxIterations: 10,
});
```

## Next Steps

- See [Integration Tests](../tests/langgraph/patterns/react/integration.test.ts) for more examples
- See [Builder Tests](../tests/langgraph/patterns/react/builder.test.ts) for API usage
- See [Phase 3.1.4 Summary](./phase-3.1.4-summary.md) for implementation details

