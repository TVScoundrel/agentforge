# Plan-Execute Pattern - Quick Reference

## Basic Usage

```typescript
import { createPlanExecuteAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

const agent = createPlanExecuteAgent({
  planner: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    maxSteps: 5,
  },
  executor: {
    tools: [tool1, tool2],
  },
});

const result = await agent.invoke({ input: 'Your task here' });
```

## Configuration Options

### Planner Config

```typescript
planner: {
  model: BaseChatModel,              // Required: LLM for planning
  systemPrompt?: string,            // Custom planning prompt
  maxSteps?: number,                // Max steps (default: 7)
  includeToolDescriptions?: boolean, // Include tool info
}
```

### Executor Config

```typescript
executor: {
  tools: Tool[],                    // Required: Available tools
  model?: BaseChatModel,            // Optional LLM for sub-tasks
  parallel?: boolean,               // Enable parallel execution
  stepTimeout?: number,             // Timeout per step (ms)
  enableDeduplication?: boolean,    // Prevent duplicate tool calls
}
```

### Replanner Config

```typescript
replanner?: {
  model: BaseChatModel,               // Required: LLM for replanning
  replanThreshold?: number,         // Confidence threshold (0-1)
  systemPrompt?: string,            // Custom replanning prompt
}
```

## Common Patterns

### Sequential Execution

```typescript
const agent = createPlanExecuteAgent({
  planner: { model: llm, maxSteps: 5 },
  executor: {
    tools,
    parallel: false, // Sequential
  },
});
```

### Parallel Execution

```typescript
const agent = createPlanExecuteAgent({
  planner: {
    model: llm,
    maxSteps: 10,
    systemPrompt: 'Identify independent steps for parallel execution',
  },
  executor: {
    tools,
    parallel: true,
    stepTimeout: 30000, // Timeout per step
  },
});
```

### With Replanning

```typescript
const agent = createPlanExecuteAgent({
  planner: { model: llm, maxSteps: 5 },
  executor: { tools },
  replanner: {
    model: llm,
    replanThreshold: 0.7, // Replan if confidence < 0.7
  },
});
```

### Research Task

```typescript
const agent = createPlanExecuteAgent({
  planner: {
    model: llm,
    maxSteps: 8,
    systemPrompt: `Create a research plan:
      1. Identify information sources
      2. Gather data (parallel)
      3. Validate sources
      4. Synthesize findings`,
  },
  executor: {
    tools: [searchTool, validateTool, synthesizeTool],
    parallel: true,
  },
  replanner: { model: llm, replanThreshold: 0.8 },
});
```

### Data Pipeline

```typescript
const agent = createPlanExecuteAgent({
  planner: {
    model: llm,
    maxSteps: 10,
    systemPrompt: `Create a data pipeline:
      1. Extract from sources (parallel)
      2. Transform data
      3. Validate quality
      4. Load to destination`,
  },
  executor: {
    tools: [extractTool, transformTool, validateTool, loadTool],
    parallel: true,
    stepTimeout: 10000,
  },
});
```

## Custom Workflow

```typescript
import {
  createPlannerNode,
  createExecutorNode,
  createFinisherNode,
  PlanExecuteState,
} from '@agentforge/patterns';
import { StateGraph, END } from '@langchain/langgraph';

const plannerNode = createPlannerNode({ model: llm, maxSteps: 5 });
const executorNode = createExecutorNode({ tools });
const finisherNode = createFinisherNode();

const workflow = new StateGraph(PlanExecuteState)
  .addNode('plan', plannerNode)
  .addNode('execute', executorNode)
  .addNode('finish', finisherNode)
  .addEdge('__start__', 'plan')
  .addEdge('plan', 'execute')
  .addEdge('execute', 'finish')
  .addEdge('finish', END);

const agent = workflow.compile();
```

## Result Structure

```typescript
interface Result {
  input: string;                    // Original query
  plan?: Plan;                      // Generated plan
  pastSteps: CompletedStep[];       // Executed steps
  response?: string;                // Final response
  status: ExecutionStatus;          // Execution status
  iteration: number;                // Planning iterations
  error?: string;                   // Error if failed
}
```

## Accessing Results

```typescript
const result = await agent.invoke({ input: query });

// The plan
console.log(result.plan);
// { steps: [...], goal: '...' }

// Executed steps
console.log(result.pastSteps);
// [{ step, result, success, error?, timestamp }, ...]

// Final response
console.log(result.response);
// "Based on the analysis..."

// Check status
if (result.status === 'completed') {
  console.log('Success!');
}
```

## Error Handling

```typescript
try {
  const result = await agent.invoke({ input: query });
  
  if (result.status === 'failed') {
    console.error('Execution failed:', result.error);

    // Check which step failed
    const failedStep = result.pastSteps.find(s => !s.success);
    console.error('Failed at:', failedStep);
  }
} catch (error) {
  console.error('Agent error:', error);
}
```

## Streaming

```typescript
for await (const event of await agent.stream({ input: query })) {
  if (event.plan) {
    console.log('Plan:', event.plan);
  }
  if (event.pastSteps) {
    const latest = event.pastSteps[event.pastSteps.length - 1];
    console.log('Step completed:', latest);
  }
  if (event.response) {
    console.log('Final:', event.response);
  }
}
```

## Best Practices

### Planning

```typescript
// ✅ DO: Create specific, actionable steps
systemPrompt: `Each step must:
- Have clear description
- Specify tool to use
- List dependencies
- Be independently executable`

// ❌ DON'T: Create vague steps
systemPrompt: 'Create a plan'
```

### Tools

```typescript
// ✅ DO: Match tool granularity to steps
const fetchUserTool = {
  metadata: {
    name: 'fetch-user',
    description: 'Fetch user data by ID',
    category: ToolCategory.DATABASE,
  },
  schema: z.object({ userId: z.string() }),
  invoke: async ({ userId }) => { /* implementation */ }
};

// ❌ DON'T: Create overly complex tools
const doEverythingTool = {
  metadata: {
    name: 'process-all',
    description: 'Fetch, validate, transform, and save',
    category: ToolCategory.UTILITY,
  },
  schema: z.object({ data: z.any() }),
  invoke: async ({ data }) => { /* too many responsibilities */ }
};
```

### Error Handling

```typescript
// ✅ DO: Handle errors gracefully
const tool = {
  invoke: async (args) => {
    try {
      return await operation(args);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        canRetry: true,
      };
    }
  },
};

// Enable replanning for errors
replanner: {
  model: llm,
  replanThreshold: 0.5,
}
```

## Troubleshooting

### Plan is too vague
```typescript
planner: {
  model: llm,
  includeToolDescriptions: true,
  systemPrompt: 'Create specific plans using available tools',
}
```

### Execution is slow
```typescript
executor: {
  tools,
  parallel: true,
  stepTimeout: 5000,
}
```

### Too many replanning iterations
```typescript
replanner: {
  llm,
  replanThreshold: 0.5, // Lower = less replanning
}
maxIterations: 3,
```

## Resources

- [Full Documentation](./plan-execute-pattern.md)
- [Examples](../examples/plan-execute/)
- [API Reference](../src/plan-execute/README.md)

