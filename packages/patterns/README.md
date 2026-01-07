# @agentforge/patterns

Agent patterns (ReAct, Plan-Execute, Reflection, Multi-Agent) for the AgentForge framework.

## Status

✅ **Phase 3 Complete** - All Core Patterns Implemented

**100+ tests passing** | **Full TypeScript support** | **Comprehensive documentation**

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

### ✅ Reflection Pattern (Phase 3.3)

The Reflection pattern implements iterative self-improvement through generation, critique, and revision:
1. **Generate** - Create initial response
2. **Reflect** - Critique the response
3. **Revise** - Improve based on critique
4. **Repeat** - Continue until quality threshold met

**Features**:
- **Iterative Improvement** - Multiple revision cycles
- **Self-Critique** - Agent evaluates its own output
- **Quality Focus** - Optimizes for output quality
- **Flexible Criteria** - Custom reflection criteria
- **Configurable Iterations** - Control refinement depth

### ✅ Multi-Agent Pattern (Phase 3.4)

The Multi-Agent pattern coordinates multiple specialized agents for complex tasks:
1. **Supervisor** - Routes tasks to appropriate workers
2. **Workers** - Execute specialized tasks
3. **Aggregator** - Combines results from workers
4. **Routing** - Intelligent task distribution

**Features**:
- **Specialized Agents** - Workers with distinct capabilities
- **Flexible Routing** - LLM-based, skill-based, rule-based, round-robin, load-balanced
- **Parallel Execution** - Workers can run concurrently
- **Result Aggregation** - Combine outputs intelligently
- **Scalable Coordination** - Add workers dynamically

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

### Reflection Agent

Iterative self-improvement:

```typescript
import { createReflectionAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

// Create the agent
const agent = createReflectionAgent({
  generator: {
    llm: new ChatOpenAI({ model: 'gpt-4' }),
    systemPrompt: 'You are a professional writer. Create high-quality content.',
  },
  reflector: {
    llm: new ChatOpenAI({ model: 'gpt-4' }),
    systemPrompt: 'Critique the content for clarity, engagement, and professionalism.',
  },
  maxIterations: 3,
  verbose: true,
});

// Use the agent
const result = await agent.invoke({
  messages: [{ role: 'user', content: 'Write a blog post about AI' }],
});

console.log(result.reflections); // All critiques
console.log(result.response); // Final refined response
```

### Multi-Agent System

Coordinate specialized agents:

```typescript
import { MultiAgentSystemBuilder } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

const llm = new ChatOpenAI({ model: 'gpt-4' });

// Create builder
const builder = new MultiAgentSystemBuilder({
  supervisor: {
    llm,
    strategy: 'skill-based', // or 'llm-based', 'round-robin', etc.
  },
  aggregator: { llm },
});

// Register specialized workers
builder.registerWorkers([
  {
    id: 'tech_support',
    name: 'Tech Support',
    description: 'Handles technical issues',
    capabilities: {
      skills: ['technical', 'troubleshooting', 'debugging'],
      tools: ['diagnostic', 'troubleshoot'],
      available: true,
    },
    llm,
    tools: [diagnosticTool, troubleshootTool],
  },
  {
    id: 'billing_support',
    name: 'Billing Support',
    description: 'Handles billing inquiries',
    capabilities: {
      skills: ['billing', 'payments', 'refunds'],
      tools: ['account_check', 'refund_process'],
      available: true,
    },
    llm,
    tools: [checkAccountTool, processRefundTool],
  },
]);

// Build and use the system
const system = builder.build();

const result = await system.invoke({
  input: 'My app keeps crashing and I need a refund',
});

console.log(result.response); // Aggregated response
```

## Documentation

### Guides
- [ReAct Agent Guide](./docs/react-agent-guide.md) - Comprehensive ReAct usage guide
- [Plan-Execute Pattern Guide](./docs/plan-execute-pattern.md) - Comprehensive Plan-Execute guide
- [Reflection Pattern Guide](./docs/reflection-pattern.md) - Comprehensive Reflection guide
- [Multi-Agent Pattern Guide](./docs/multi-agent-pattern.md) - Comprehensive Multi-Agent guide
- [Pattern Comparison Guide](./docs/pattern-comparison.md) - Choose the right pattern

### Implementation Details
- [Phase 3.1 Summary](./docs/phase-3.1.4-summary.md) - ReAct implementation details

### Examples
- [ReAct Examples](./examples/react/) - ReAct pattern examples
- [Plan-Execute Examples](./examples/plan-execute/) - Plan-Execute pattern examples
- [Reflection Examples](./examples/reflection/) - Reflection pattern examples
- [Multi-Agent Examples](./examples/multi-agent/) - Multi-Agent pattern examples

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

### Reflection Pattern

```typescript
import {
  createReflectionAgent,
  createGeneratorNode,
  createReflectorNode,
  createReviserNode,
} from '@agentforge/patterns';
```

**Main API**:
- `createReflectionAgent(config)` - Create a complete Reflection agent

**Configuration**:
```typescript
{
  generator: {
    llm: BaseChatModel,           // LLM for generation
    systemPrompt?: string,         // Custom generation prompt
  },
  reflector: {
    llm: BaseChatModel,            // LLM for reflection
    systemPrompt?: string,         // Custom reflection prompt
    criteria?: string[],           // Reflection criteria
  },
  maxIterations?: number,          // Max reflection cycles (default: 3)
  qualityThreshold?: number,       // Quality score threshold (0-1)
  returnIntermediateSteps?: boolean,
  verbose?: boolean,
}
```

**Node Creators** (for custom workflows):
- `createGeneratorNode(config)` - Create generator node
- `createReflectorNode(config)` - Create reflector node
- `createReviserNode(config)` - Create reviser node

### Multi-Agent Pattern

```typescript
import {
  createMultiAgentSystem,
  registerWorkers,
  createSupervisorNode,
  createWorkerNode,
  createAggregatorNode,
} from '@agentforge/patterns';
```

**Main API**:
- `createMultiAgentSystem(config)` - Create a complete Multi-Agent system
- `registerWorkers(system, workers)` - Register workers with the system

**Configuration**:
```typescript
{
  supervisor: {
    llm: BaseChatModel,           // LLM for routing decisions
    routingStrategy: RoutingStrategy, // Routing strategy
    systemPrompt?: string,         // Custom supervisor prompt
  },
  workers: WorkerConfig[],        // Worker configurations
  aggregator: {
    llm: BaseChatModel,            // LLM for aggregation
    systemPrompt?: string,         // Custom aggregator prompt
  },
  maxIterations?: number,          // Max coordination iterations
  verbose?: boolean,
}
```

**Routing Strategies**:
- `'llm-based'` - LLM analyzes task and selects worker
- `'skill-based'` - Match task to worker capabilities
- `'round-robin'` - Distribute tasks evenly
- `'load-balanced'` - Route to least busy worker
- Custom rule-based routing

**Worker Configuration**:
```typescript
{
  name: string,                   // Unique worker identifier
  description: string,            // Worker description
  capabilities: string[],         // Worker capabilities/skills
  tools: Tool[],                  // Available tools
  systemPrompt?: string,          // Worker-specific prompt
}
```

**Node Creators** (for custom workflows):
- `createSupervisorNode(config)` - Create supervisor node
- `createWorkerNode(config)` - Create worker node
- `createAggregatorNode(config)` - Create aggregator node

## Pattern Selection Guide

| Pattern | Best For | Key Strength | Main Limitation |
|---------|----------|--------------|-----------------|
| **ReAct** | Exploration, flexibility | Dynamic adaptation | Sequential only |
| **Plan-Execute** | Structured workflows | Parallel execution | Requires planning |
| **Reflection** | Quality-critical outputs | Iterative improvement | Slow, expensive |
| **Multi-Agent** | Specialized tasks | Coordinated expertise | High complexity |

See the [Pattern Comparison Guide](./docs/pattern-comparison.md) for detailed guidance.

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

