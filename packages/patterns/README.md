# @agentforge/patterns

> Production-ready agent patterns for the AgentForge framework

[![npm version](https://img.shields.io/npm/v/@agentforge/patterns)](https://www.npmjs.com/package/@agentforge/patterns)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](../../LICENSE)

## 🎉 Status: Production Ready & Published

**All 4 patterns complete** | **143 tests passing** | **Full TypeScript support** | **Comprehensive documentation**

## 🤖 Agent Patterns

### ✅ ReAct Pattern (Reasoning and Action)

The ReAct pattern implements a thought-action-observation loop for exploratory tasks:

1. **Think** - Reason about what to do next
2. **Act** - Execute a tool or provide final answer
3. **Observe** - Process the result
4. **Repeat** - Continue until task complete

**Best for**: Research, exploration, problem-solving, multi-step reasoning

**Features**:
- Type-safe state with Zod schemas
- Fluent builder API (`ReActAgentBuilder`)
- Configurable max iterations and timeouts
- Comprehensive error handling
- **55 tests** - Full coverage

### ✅ Plan-Execute Pattern

The Plan-Execute pattern separates planning from execution for complex, structured tasks:

1. **Plan** - Create a multi-step plan
2. **Execute** - Execute each step (sequential or parallel)
3. **Replan** (optional) - Adjust based on results
4. **Finish** - Synthesize final response

**Best for**: Complex workflows, data analysis, structured problem-solving

**Features**:
- Structured multi-step planning
- Sequential & parallel execution
- Dependency management
- Adaptive replanning
- Progress tracking
- **35+ tests** - Comprehensive coverage

### ✅ Reflection Pattern

The Reflection pattern implements iterative self-improvement through critique and revision:

1. **Generate** - Create initial response
2. **Reflect** - Critique the output
3. **Revise** - Improve based on critique
4. **Repeat** - Continue until quality threshold met

**Best for**: Content generation, code review, quality optimization

**Features**:
- Iterative improvement cycles
- Self-critique capabilities
- Quality-focused optimization
- Flexible reflection criteria
- Configurable iteration limits
- **30+ tests** - Full coverage

### ✅ Multi-Agent Pattern

The Multi-Agent pattern coordinates multiple specialized agents for complex tasks:

1. **Supervisor** - Routes tasks to workers
2. **Workers** - Execute specialized tasks
3. **Aggregator** - Combines results
4. **Routing** - Intelligent task distribution

**Best for**: Customer support, complex workflows, specialized task distribution

**Features**:
- Specialized worker agents
- Flexible routing strategies (LLM-based, skill-based, rule-based, round-robin, load-balanced)
- Parallel execution support
- Intelligent result aggregation
- Dynamic worker registration
- **22+ tests** - Comprehensive coverage

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

### 📖 Pattern Guides (GitHub Pages)
- 🤖 **[ReAct Pattern Guide](https://tvscoundrel.github.io/agentforge/guide/patterns/react)** - Comprehensive ReAct usage guide
- 📋 **[Plan-Execute Pattern Guide](https://tvscoundrel.github.io/agentforge/guide/patterns/plan-execute)** - Comprehensive Plan-Execute guide
- 🔄 **[Reflection Pattern Guide](https://tvscoundrel.github.io/agentforge/guide/patterns/reflection)** - Comprehensive Reflection guide
- 👥 **[Multi-Agent Pattern Guide](https://tvscoundrel.github.io/agentforge/guide/patterns/multi-agent)** - Comprehensive Multi-Agent guide

### 💡 Examples (GitHub Pages)
- **[ReAct Examples](https://tvscoundrel.github.io/agentforge/examples/react-agent)** - ReAct pattern examples
- **[Plan-Execute Examples](https://tvscoundrel.github.io/agentforge/examples/plan-execute)** - Plan-Execute pattern examples
- **[Reflection Examples](https://tvscoundrel.github.io/agentforge/examples/reflection)** - Reflection pattern examples
- **[Multi-Agent Examples](https://tvscoundrel.github.io/agentforge/examples/multi-agent)** - Multi-Agent pattern examples

### 📂 Source Documentation
For contributors and advanced users, detailed implementation docs are available in the repository:
- [Pattern Comparison](./docs/pattern-comparison.md) - Detailed pattern comparison
- [ReAct Implementation](./docs/react-pattern.md) - ReAct implementation details
- [Plan-Execute Implementation](./docs/plan-execute-pattern.md) - Plan-Execute implementation details
- [Reflection Implementation](./docs/reflection-pattern.md) - Reflection implementation details
- [Multi-Agent Implementation](./docs/multi-agent-pattern.md) - Multi-Agent implementation details

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
    model: BaseChatModel,          // LLM for routing decisions
    strategy: RoutingStrategy,     // Routing strategy
    systemPrompt?: string,         // Custom supervisor prompt
  },
  workers: WorkerConfig[],        // Worker configurations
  aggregator: {
    model: BaseChatModel,          // LLM for aggregation
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

📚 **[Pattern Comparison Guide](https://tvscoundrel.github.io/agentforge/guide/patterns/comparison)** - Detailed guidance on choosing the right pattern

## Documentation

- 📖 **[Full Documentation](https://tvscoundrel.github.io/agentforge/)**
- 🚀 **[Quick Start](https://tvscoundrel.github.io/agentforge/guide/quick-start)**
- 🤖 **[ReAct Pattern Guide](https://tvscoundrel.github.io/agentforge/guide/patterns/react)**
- 📋 **[Plan-Execute Pattern Guide](https://tvscoundrel.github.io/agentforge/guide/patterns/plan-execute)**
- 🔄 **[Reflection Pattern Guide](https://tvscoundrel.github.io/agentforge/guide/patterns/reflection)**
- 👥 **[Multi-Agent Pattern Guide](https://tvscoundrel.github.io/agentforge/guide/patterns/multi-agent)**
- 💡 **[Examples](https://tvscoundrel.github.io/agentforge/examples/react-agent)**

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

## 🔗 Links

- [GitHub Repository](https://github.com/TVScoundrel/agentforge)
- [npm Package](https://www.npmjs.com/package/@agentforge/patterns)
- [Changelog](https://tvscoundrel.github.io/agentforge/changelog.html) - See what's new before upgrading
- [Report Issues](https://github.com/TVScoundrel/agentforge/issues)

## License

MIT © 2026 Tom Van Schoor

