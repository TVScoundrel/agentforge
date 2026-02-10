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
import { ReActAgentBuilder } from '@agentforge/patterns';
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

#### `withCheckpointer(checkpointer: BaseCheckpointSaver | true)`
Enable state persistence for conversation continuity and human-in-the-loop workflows.

**For standalone agents:**
```typescript
import { MemorySaver } from '@langchain/langgraph';

const agent = new ReActAgentBuilder()
  .withModel(model)
  .withTools(tools)
  .withCheckpointer(new MemorySaver())
  .build();

// Use with thread_id for conversation continuity
const result = await agent.invoke(
  { messages: [{ role: 'user', content: 'Hello' }] },
  { configurable: { thread_id: 'conversation-123' } }
);
```

**For nested agents in multi-agent systems:**
```typescript
// Worker agent using parent's checkpointer with separate namespace
const workerAgent = new ReActAgentBuilder()
  .withModel(model)
  .withTools([askHumanTool, ...otherTools])
  .withCheckpointer(true)  // Use parent's checkpointer
  .build();

// When used in a multi-agent system, this agent will:
// - Use the parent graph's checkpointer
// - Store state in a separate namespace (e.g., thread_abc:worker:hr)
// - Support interrupts (askHuman tool) without causing infinite loops
```

**Use cases:**
- **Conversation continuity**: Resume conversations across sessions
- **Human-in-the-loop**: Use `askHuman` tool to request user input
- **Multi-agent systems**: Enable worker agents to interrupt and resume independently

**Important:** When using `checkpointer: true` in nested graphs, the parent graph must provide a checkpointer and pass a unique `thread_id` in the config.

#### `withVerbose(value: boolean)`
Enable verbose logging (default: false).

```typescript
builder.withVerbose(true);
```

#### `withNodeNames(names: { reasoning?: string; action?: string; observation?: string })`
Customize node names in the graph.

```typescript
builder.withNodeNames({
  reasoning: 'reasoning-node',
  action: 'action-node',
  observation: 'observation-node'
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
import { createReActAgent } from '@agentforge/patterns';

const agent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [calculatorTool],
  systemPrompt: 'Custom prompt',
  maxIterations: 10,
});
```

## Next Steps

- See [Integration Tests](../tests/langgraph/patterns/react/integration.test.ts) for more examples
- See [Builder Tests](../tests/langgraph/patterns/react/builder.test.ts) for API usage
