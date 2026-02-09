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
  returnIntermediateSteps?: boolean;  // Note: Not yet implemented
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
  input: 'Write a blog post about AI'
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
import { webSearch, calculator } from '@agentforge/tools';

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
    name: 'researcher',
    description: 'Conducts research',
    capabilities: ['research', 'web-search'],
    tools: [webSearch],  // Real export from @agentforge/tools
    systemPrompt: 'You are a research specialist.',
    model: llm,
  },
  {
    name: 'analyst',
    description: 'Analyzes data',
    capabilities: ['analysis', 'statistics'],
    tools: [calculator],  // Real export from @agentforge/tools
    systemPrompt: 'You are a data analyst.',
    model: llm,
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

**registerWorkers(workers: Array<{ name, description?, capabilities, tools?, systemPrompt?, model? }>)**

Registers workers with the system. Must be called before `build()`. The builder converts the simplified input format to the internal `WorkerConfig` format.

```typescript
// Input format for registerWorkers
interface RegisterWorkerInput {
  name: string;                    // Worker identifier (becomes 'id' internally)
  description?: string;            // Optional description
  capabilities: string[];          // Array of skill names
  tools?: any[];                   // Optional tools array
  systemPrompt?: string;           // Optional system prompt
  model?: BaseChatModel;           // Optional model (uses supervisor model if not provided)
}

// Internal WorkerConfig format (created by builder)
interface WorkerConfig {
  id: string;                      // Worker identifier
  capabilities: WorkerCapabilities; // Structured capabilities
  model?: BaseChatModel;           // Language model
  tools?: Tool[];                  // Available tools
  systemPrompt?: string;           // System prompt
  executeFn?: (state, config?) => Promise<Partial<MultiAgentStateType>>;
  agent?: CompiledStateGraph;      // ReAct agent or nested multi-agent system
  verbose?: boolean;
}

interface WorkerCapabilities {
  skills: string[];                // List of skills
  tools: string[];                 // List of tool names
  available: boolean;              // Availability status
  currentWorkload: number;         // Current workload count
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
      capabilities: {
        skills: ['research', 'web-search'],
        tools: ['web-search'],  // Real tool from @agentforge/tools
        available: true,
        currentWorkload: 0
      },
      model: llm,
      tools: [webSearch],  // Use webSearch from @agentforge/tools
      systemPrompt: 'You are a research specialist.'
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

### Building Custom Patterns

Build your own pattern using LangGraph's `StateGraph` directly:

```typescript
import { z } from 'zod';
import { StateGraph, END } from '@langchain/langgraph';
import { createStateAnnotation } from '@agentforge/core';
import { ChatOpenAI } from '@langchain/openai';

// Define your custom state
const CustomStateConfig = {
  input: {
    schema: z.string(),
    description: 'User input'
  },
  customField: {
    schema: z.string().optional(),
    description: 'Custom field'
  },
  response: {
    schema: z.string().optional(),
    description: 'Final response'
  }
};

const CustomState = createStateAnnotation(CustomStateConfig);

// Create nodes
const startNode = async (state: typeof CustomState.State) => {
  return { customField: 'Processing...' };
};

const processNode = async (state: typeof CustomState.State) => {
  const model = new ChatOpenAI({ model: 'gpt-4' });
  const result = await model.invoke(state.input);
  return { response: result.content };
};

// Build the graph
const graph = new StateGraph(CustomState)
  .addNode('start', startNode)
  .addNode('process', processNode)
  .addEdge('__start__', 'start')
  .addEdge('start', 'process')
  .addEdge('process', END);

const customAgent = graph.compile();

// Use it
const result = await customAgent.invoke({ input: 'Your task' });
```

## Shared Interfaces

### CompiledStateGraph

All pattern creation functions return a LangGraph `CompiledStateGraph`:

```typescript
import type { CompiledStateGraph } from '@langchain/langgraph';

// All patterns return this type
const agent: CompiledStateGraph = createReActAgent({ ... });
const system: CompiledStateGraph = createMultiAgentSystem({ ... });

// Invoke with pattern-specific state
// ReAct uses { messages: [...] }
const result = await agent.invoke({
  messages: [{ role: 'user', content: 'Your task' }]
});

// Stream events
for await (const event of agent.stream({
  messages: [{ role: 'user', content: 'Your task' }]
})) {
  console.log(event);
}
```

### Pattern State Types

Each pattern has its own state type with specific fields:

```typescript
import type {
  ReActStateType,
  PlanExecuteStateType,
  ReflectionStateType,
  MultiAgentStateType
} from '@agentforge/patterns';

// ReAct state - tracks reasoning and actions
const reactState: ReActStateType = {
  messages: [],           // Conversation messages
  thoughts: [],           // Reasoning steps
  actions: [],            // Tool calls made
  observations: [],       // Tool results
  scratchpad: [],         // Intermediate reasoning
  iteration: 0,           // Current iteration count
  shouldContinue: true,   // Whether to continue loop
  response: undefined     // Final response
};

// Plan-Execute state - tracks planning and execution
const planExecuteState: PlanExecuteStateType = {
  input: 'User query',
  plan: undefined,        // Current plan (Plan type)
  pastSteps: [],          // Completed steps (CompletedStep[])
  currentStepIndex: undefined,
  status: 'planning',     // 'planning' | 'executing' | 'replanning' | 'completed' | 'failed'
  response: undefined,
  error: undefined,
  iteration: 0,
  maxIterations: 5
};

// Reflection state - tracks iterative improvement
const reflectionState: ReflectionStateType = {
  input: 'Content to improve',
  currentResponse: undefined,  // Current draft/response
  reflections: [],             // Reflection[] - critiques
  revisions: [],               // Revision[] - improvement history
  iteration: 0,
  status: 'generating',        // 'generating' | 'reflecting' | 'revising' | 'completed' | 'failed'
  qualityCriteria: undefined,  // Optional quality criteria
  maxIterations: 3,
  response: undefined,
  error: undefined
};

// Multi-Agent state - tracks agent coordination
const multiAgentState: MultiAgentStateType = {
  input: 'Task description',
  messages: [],                // AgentMessage[] - inter-agent messages
  workers: {},                 // Record<string, WorkerCapabilities>
  currentAgent: undefined,     // Currently active agent ID
  routingHistory: [],          // RoutingDecision[] - routing decisions
  activeAssignments: [],       // TaskAssignment[] - active tasks
  completedTasks: [],          // TaskResult[] - completed tasks
  handoffs: [],                // HandoffRequest[] - agent handoffs
  status: 'initializing',      // 'initializing' | 'routing' | 'executing' | 'aggregating' | 'completed' | 'failed'
  iteration: 0,
  maxIterations: 10,
  response: undefined,
  error: undefined
};
```

## Utilities

### Deduplication Utilities

```typescript
import {
  generateToolCallCacheKey,
  createPatternLogger,
  buildDeduplicationMetrics,
  calculateDeduplicationSavings,
  type DeduplicationMetrics
} from '@agentforge/patterns';

// Generate cache key for tool calls
const cacheKey = generateToolCallCacheKey(toolName, args);

// Create logger for patterns
const logger = createPatternLogger('my-pattern');

// Build deduplication metrics
const metrics: DeduplicationMetrics = buildDeduplicationMetrics(
  totalCalls,
  uniqueCalls,
  cachedCalls
);

// Calculate savings
const savings = calculateDeduplicationSavings(metrics);
```

## Examples

See the [Examples](/examples/react-agent) section for complete working examples of each pattern.

## Type Definitions

All exports include full TypeScript definitions. See the [source code](https://github.com/TVScoundrel/agentforge/tree/main/packages/patterns/src) for complete type information.

