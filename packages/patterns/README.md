# @agentforge/patterns

Agent patterns (ReAct, Plan-Execute, Reflection) for the AgentForge framework.

## Status

🚧 **Phase 3 In Progress** - ReAct & Plan-Execute Patterns Complete

**65+ tests passing** | **Full TypeScript support** | **Comprehensive documentation**

## Features

### ✅ ReAct Pattern (Phase 3.1)

The ReAct (Reasoning and Action) pattern implements a thought-action-observation loop where the agent:
1. **Thinks** about what to do next
2. **Acts** by calling a tool or responding
3. **Observes** the result
4. **Repeats** until the task is complete

**Components**:
- **State Management** - Type-safe state with Zod schemas (10 tests)
- **Node Implementations** - Reasoning, action, and observation nodes (9 tests)
- **Agent Factory** - `createReActAgent()` function (10 tests)
- **Fluent Builder** - `ReActAgentBuilder` with method chaining (19 tests)
- **Integration Tests** - End-to-end scenarios (7 tests)

### ✅ Plan-Execute Pattern (Phase 3.2)

The Plan-Execute pattern separates planning from execution for better performance on complex tasks:
1. **Plan** - Create a structured, multi-step plan
2. **Execute** - Execute each step of the plan
3. **Replan** (optional) - Adjust the plan based on results
4. **Finish** - Synthesize results into final response

**Features**:
- **Structured Planning** - Multi-step plan generation
- **Sequential & Parallel Execution** - Execute steps in order or parallel
- **Dependency Management** - Handle step dependencies
- **Adaptive Replanning** - Adjust plan based on results
- **Progress Tracking** - Monitor execution progress

### 📋 Coming Soon

**Phase 3.3: Reflection Pattern**
- Self-critique and improvement
- Iterative refinement
- Quality assessment

**Phase 3.3: Reflection Pattern**
- Self-critique and improvement
- Iterative refinement
- Quality assessment

**Phase 3.4: Multi-Agent Pattern**
- Agent coordination
- Task delegation
- Collaborative problem solving

## Installation

```bash
pnpm add @agentforge/patterns @agentforge/core
```

## Quick Start

### ReAct Agent

Simple reasoning and action loop:

```typescript
import { ReActAgentBuilder } from '@agentforge/patterns';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { ChatOpenAI } from '@langchain/openai';
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
  .withMaxIterations(10)
  .build();

// Use the agent
const result = await agent.invoke({
  messages: [{ role: 'user', content: 'What is 15 * 7?' }],
});

console.log(result.response); // "The result is 105"
```

### Plan-Execute Agent

Structured planning and execution:

```typescript
import { createPlanExecuteAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

// Create tools
const searchTool = {
  name: 'search',
  description: 'Search for information',
  schema: z.object({ query: z.string() }),
  execute: async ({ query }) => {
    // Search implementation
    return { results: [...] };
  },
};

const analyzeTool = {
  name: 'analyze',
  description: 'Analyze data',
  schema: z.object({ data: z.any() }),
  execute: async ({ data }) => {
    // Analysis implementation
    return { insights: [...] };
  },
};

// Create the agent
const agent = createPlanExecuteAgent({
  planner: {
    llm: new ChatOpenAI({ model: 'gpt-4' }),
    maxSteps: 5,
  },
  executor: {
    tools: [searchTool, analyzeTool],
    parallel: true, // Enable parallel execution
  },
  replanner: {
    llm: new ChatOpenAI({ model: 'gpt-4' }),
    replanThreshold: 0.7, // Replan if confidence < 0.7
  },
});

// Use the agent
const result = await agent.invoke({
  input: 'Research AI developments and analyze trends',
});

console.log(result.plan); // The generated plan
console.log(result.pastSteps); // Executed steps
console.log(result.response); // Final synthesized response
```

## Documentation

### Guides
- [ReAct Agent Guide](./docs/react-agent-guide.md) - Comprehensive ReAct usage guide
- [Plan-Execute Pattern Guide](./docs/plan-execute-pattern.md) - Comprehensive Plan-Execute guide

### Implementation Details
- [Phase 3.1 Summary](./docs/phase-3.1.4-summary.md) - ReAct implementation details

### Examples
- [ReAct Examples](./examples/react/) - ReAct pattern examples
- [Plan-Execute Examples](./examples/plan-execute/) - Plan-Execute pattern examples

## API Reference

### ReAct Pattern

```typescript
import {
  ReActAgentBuilder,
  createReActAgent,
  createReActAgentBuilder,
} from '@agentforge/patterns';
```

**Builder API**:
- `withLLM(llm)` - Set the language model (required)
- `withTools(tools)` - Set tools array or registry (required)
- `withSystemPrompt(prompt)` - Set system prompt (optional)
- `withMaxIterations(max)` - Set max iterations (optional, default: 10)
- `withReturnIntermediateSteps(value)` - Include reasoning steps (optional)
- `withStopCondition(fn)` - Custom termination logic (optional)
- `withVerbose(value)` - Enable verbose logging (optional)
- `withNodeNames(names)` - Customize node names (optional)
- `build()` - Build the agent

### Plan-Execute Pattern

```typescript
import {
  createPlanExecuteAgent,
  createPlannerNode,
  createExecutorNode,
  createReplannerNode,
  createFinisherNode,
} from '@agentforge/patterns';
```

**Main API**:
- `createPlanExecuteAgent(config)` - Create a complete Plan-Execute agent

**Configuration**:
```typescript
{
  planner: {
    llm: BaseChatModel,           // LLM for planning
    systemPrompt?: string,         // Custom planning prompt
    maxSteps?: number,             // Max steps in plan (default: 10)
    includeToolDescriptions?: boolean,
  },
  executor: {
    tools: Tool[],                 // Available tools
    llm?: BaseChatModel,           // Optional LLM for sub-tasks
    parallel?: boolean,            // Enable parallel execution
    stepTimeout?: number,          // Timeout per step (ms)
    maxParallelSteps?: number,     // Max concurrent steps
  },
  replanner?: {
    llm: BaseChatModel,            // LLM for replanning
    replanThreshold?: number,      // Confidence threshold (0-1)
    systemPrompt?: string,         // Custom replanning prompt
  },
  maxIterations?: number,          // Max planning iterations
  returnIntermediateSteps?: boolean,
  verbose?: boolean,
}
```

**Node Creators** (for custom workflows):
- `createPlannerNode(config)` - Create planner node
- `createExecutorNode(config)` - Create executor node
- `createReplannerNode(config)` - Create replanner node
- `createFinisherNode()` - Create finisher node

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm typecheck
```

## License

MIT

