# @agentforge/patterns

Pre-built agent patterns for common use cases.

## Installation

```bash
pnpm add @agentforge/patterns
```

## ReAct Pattern

Reasoning and Acting in cycles - the agent thinks, acts, observes, and repeats.

### createReActAgent()

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

const agent = createReActAgent({
  llm: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [tool1, tool2],
  maxIterations: 5,
  systemPrompt: 'You are a helpful assistant.'
});

const result = await agent.invoke({
  messages: [{ role: 'user', content: 'Hello' }]
});
```

#### Options

```typescript
interface ReActAgentOptions {
  llm: BaseChatModel;              // LLM instance
  tools: Tool[];                   // Available tools
  maxIterations?: number;          // Max reasoning cycles (default: 10)
  systemPrompt?: string;           // System prompt
  checkpointSaver?: CheckpointSaver; // State persistence
  middleware?: Middleware[];       // Middleware stack
}
```

## Plan-Execute Pattern

Plan first, then execute steps sequentially.

### createPlanExecuteAgent()

```typescript
import { createPlanExecuteAgent } from '@agentforge/patterns';

const agent = createPlanExecuteAgent({
  llm: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [tool1, tool2],
  plannerPrompt: 'Create a detailed plan to solve the task.',
  executorPrompt: 'Execute the current step.'
});

const result = await agent.invoke({
  messages: [{ role: 'user', content: 'Research and summarize AI trends' }]
});
```

#### Options

```typescript
interface PlanExecuteAgentOptions {
  llm: BaseChatModel;
  tools: Tool[];
  plannerPrompt?: string;          // Planner system prompt
  executorPrompt?: string;         // Executor system prompt
  maxSteps?: number;               // Max execution steps (default: 10)
  checkpointSaver?: CheckpointSaver;
  middleware?: Middleware[];
}
```

## Reflection Pattern

Self-critique and improvement through reflection.

### createReflectionAgent()

```typescript
import { createReflectionAgent } from '@agentforge/patterns';

const agent = createReflectionAgent({
  llm: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [tool1, tool2],
  maxReflections: 3,
  reflectionPrompt: 'Critique your previous response and improve it.'
});

const result = await agent.invoke({
  messages: [{ role: 'user', content: 'Write a blog post about AI' }]
});
```

#### Options

```typescript
interface ReflectionAgentOptions {
  llm: BaseChatModel;
  tools: Tool[];
  maxReflections?: number;         // Max reflection cycles (default: 3)
  reflectionPrompt?: string;       // Reflection prompt
  improvementThreshold?: number;   // Quality threshold (0-1)
  checkpointSaver?: CheckpointSaver;
  middleware?: Middleware[];
}
```

## Multi-Agent Pattern

Coordinate multiple specialized agents with a supervisor-worker architecture.

### MultiAgentSystemBuilder (Recommended)

Builder class for creating multi-agent systems with dynamic worker registration.

```typescript
import { MultiAgentSystemBuilder } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

const llm = new ChatOpenAI({ model: 'gpt-4' });

// Create builder
const builder = new MultiAgentSystemBuilder({
  supervisor: {
    llm,
    strategy: 'skill-based', // or 'round-robin', 'llm-based', etc.
  },
  aggregator: {
    llm,
  },
  maxIterations: 10,
  verbose: true,
});

// Register workers
builder.registerWorkers([
  {
    id: 'researcher',
    name: 'Researcher',
    description: 'Conducts research',
    capabilities: {
      skills: ['research', 'web_search'],
      tools: ['search'],
      available: true,
    },
    llm,
    tools: [searchTool],
  },
  {
    id: 'analyst',
    name: 'Analyst',
    description: 'Analyzes data',
    capabilities: {
      skills: ['analysis', 'statistics'],
      tools: ['calculator'],
      available: true,
    },
    llm,
    tools: [calculatorTool],
  },
]);

// Build the system
const system = builder.build();

// Use the system
const result = await system.invoke({
  input: 'Research AI trends and analyze the data',
});
```

#### Constructor Options

```typescript
interface MultiAgentSystemConfig {
  supervisor: SupervisorConfig;
  aggregator?: AggregatorConfig;
  maxIterations?: number;  // Default: 10
  verbose?: boolean;       // Default: false
}

interface SupervisorConfig {
  llm: BaseChatModel;
  strategy: RoutingStrategy;
  systemPrompt?: string;
}

interface AggregatorConfig {
  llm: BaseChatModel;
  systemPrompt?: string;
}

type RoutingStrategy =
  | 'skill-based'    // Routes by matching skills
  | 'round-robin'    // Distributes evenly
  | 'load-balanced'  // Routes to least busy
  | 'llm-based'      // LLM decides
  | 'rule-based';    // Custom logic
```

#### Methods

**registerWorkers(workers: WorkerConfig[])**

Registers workers with the system. Must be called before `build()`.

```typescript
interface WorkerConfig {
  id: string;
  name: string;
  description: string;
  capabilities: WorkerCapabilities;
  llm: BaseChatModel;
  tools: StructuredTool[];
  systemPrompt?: string;
}

interface WorkerCapabilities {
  skills: string[];
  tools: string[];
  available: boolean;
}
```

**build(): CompiledStateGraph**

Compiles the system into an executable graph. After calling `build()`, the system is immutable.

### createMultiAgentSystem()

Creates a multi-agent system with a fixed set of workers.

```typescript
import { createMultiAgentSystem } from '@agentforge/patterns';

const system = createMultiAgentSystem({
  supervisor: {
    llm: new ChatOpenAI({ model: 'gpt-4' }),
    strategy: 'skill-based',
  },
  workers: [
    {
      id: 'researcher',
      name: 'Researcher',
      capabilities: { skills: ['research'], tools: ['search'], available: true },
      llm,
      tools: [searchTool],
    },
  ],
  aggregator: { llm },
});

const result = await system.invoke({
  input: 'Research AI trends',
});
```

#### Options

```typescript
interface MultiAgentSystemConfig {
  supervisor: SupervisorConfig;
  workers: WorkerConfig[];         // Fixed set of workers
  aggregator?: AggregatorConfig;
  maxIterations?: number;
  verbose?: boolean;
}
```

## Custom Patterns

### createCustomPattern()

Build your own pattern:

```typescript
import { createCustomPattern } from '@agentforge/patterns';

const customAgent = createCustomPattern({
  llm: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [tool1, tool2],
  graph: (builder) => {
    builder
      .addNode('start', startNode)
      .addNode('process', processNode)
      .addNode('end', endNode)
      .addEdge('start', 'process')
      .addEdge('process', 'end');
  }
});
```

## Shared Interfaces

### Agent

All agents implement the `Agent` interface:

```typescript
interface Agent {
  invoke(input: AgentInput): Promise<AgentOutput>;
  stream(input: AgentInput): AsyncIterator<AgentChunk>;
  batch(inputs: AgentInput[]): Promise<AgentOutput[]>;
}
```

### AgentInput

```typescript
interface AgentInput {
  messages: Message[];
  config?: AgentConfig;
}
```

### AgentOutput

```typescript
interface AgentOutput {
  messages: Message[];
  metadata?: Record<string, any>;
}
```

## Utilities

### Pattern Helpers

```typescript
import { 
  validatePattern,
  optimizePattern,
  debugPattern 
} from '@agentforge/patterns/utils';

// Validate pattern configuration
const isValid = validatePattern(agentConfig);

// Optimize for performance
const optimized = optimizePattern(agent);

// Debug pattern execution
await debugPattern(agent, input);
```

## Examples

See the [Examples](/examples/react-agent) section for complete working examples of each pattern.

## Type Definitions

All exports include full TypeScript definitions. See the [source code](https://github.com/TVScoundrel/agentforge/tree/main/packages/patterns/src) for complete type information.

