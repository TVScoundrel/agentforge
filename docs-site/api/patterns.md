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
  model: new ChatOpenAI({ model: 'gpt-4' }),
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
interface ReActAgentConfig {
  model: BaseChatModel;              // LLM instance
  tools: ToolRegistry | Tool[];    // Available tools (registry or array)
  maxIterations?: number;          // Max reasoning cycles (default: 10)
  systemPrompt?: string;           // System prompt
  returnIntermediateSteps?: boolean; // Return intermediate steps (default: false)
  stopCondition?: (state) => boolean; // Custom stop condition
  checkpointer?: BaseCheckpointSaver; // State persistence for human-in-the-loop
}
```

## Plan-Execute Pattern

Plan first, then execute steps sequentially.

### createPlanExecuteAgent()

```typescript
import { createPlanExecuteAgent } from '@agentforge/patterns';

const agent = createPlanExecuteAgent({
  planner: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    systemPrompt: 'Create a detailed plan to solve the task.',
    maxSteps: 5
  },
  executor: {
    tools: [tool1, tool2],
    parallel: false
  },
  replanner: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    replanThreshold: 0.7
  },
  maxIterations: 10
});

const result = await agent.invoke({
  input: 'Research and summarize AI trends'
});
```

#### Options

```typescript
interface PlanExecuteAgentConfig {
  planner: {
    model: BaseChatModel;
    systemPrompt?: string;
    maxSteps?: number;
    includeToolDescriptions?: boolean;
  };
  executor: {
    tools: Tool[];
    model?: BaseChatModel;
    parallel?: boolean;
    stepTimeout?: number;
  };
  replanner?: {
    model: BaseChatModel;
    replanThreshold?: number;
    systemPrompt?: string;
  };
  maxIterations?: number;
  returnIntermediateSteps?: boolean;
  verbose?: boolean;
  checkpointer?: BaseCheckpointSaver;
}
```

## Reflection Pattern

Self-critique and improvement through reflection.

### createReflectionAgent()

```typescript
import { createReflectionAgent } from '@agentforge/patterns';

const agent = createReflectionAgent({
  generator: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    systemPrompt: 'Generate a high-quality response.'
  },
  reflector: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    systemPrompt: 'Critique the response and suggest improvements.',
    qualityCriteria: {
      minScore: 8,
      criteria: ['accuracy', 'clarity', 'completeness']
    }
  },
  reviser: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    systemPrompt: 'Revise the response based on the critique.'
  },
  maxIterations: 3
});

const result = await agent.invoke({
  messages: [{ role: 'user', content: 'Write a blog post about AI' }]
});
```

#### Options

```typescript
interface ReflectionAgentConfig {
  generator: {
    model: BaseChatModel;
    systemPrompt?: string;
  };
  reflector: {
    model: BaseChatModel;
    systemPrompt?: string;
    qualityCriteria?: {
      minScore?: number;        // 0-10 scale
      criteria?: string[];      // Specific criteria to evaluate
      requireAll?: boolean;     // Whether all criteria must be met
    };
  };
  reviser: {
    model: BaseChatModel;
    systemPrompt?: string;
  };
  maxIterations?: number;
  qualityCriteria?: {
    minScore?: number;
    criteria?: string[];
    requireAll?: boolean;
  };
  verbose?: boolean;
  checkpointer?: BaseCheckpointSaver;
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
    model: llm,
    strategy: 'skill-based', // or 'round-robin', 'llm-based', etc.
  },
  aggregator: {
    model: llm,
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
    model: llm,
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
    model: llm,
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
  model: BaseChatModel;
  strategy: RoutingStrategy;
  systemPrompt?: string;
}

interface AggregatorConfig {
  model: BaseChatModel;
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
  model: BaseChatModel;
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
    model: new ChatOpenAI({ model: 'gpt-4' }),
    strategy: 'skill-based',
  },
  workers: [
    {
      id: 'researcher',
      name: 'Researcher',
      capabilities: { skills: ['research'], tools: ['search'], available: true },
      model: llm,
      tools: [searchTool],
    },
  ],
  aggregator: { model: llm },
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
  model: new ChatOpenAI({ model: 'gpt-4' }),
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

