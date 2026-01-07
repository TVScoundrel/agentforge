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

Coordinate multiple specialized agents.

### createMultiAgentSystem()

```typescript
import { createMultiAgentSystem } from '@agentforge/patterns';

const system = createMultiAgentSystem({
  agents: {
    researcher: createReActAgent({ /* ... */ }),
    writer: createReflectionAgent({ /* ... */ }),
    reviewer: createReActAgent({ /* ... */ })
  },
  coordinator: new ChatOpenAI({ model: 'gpt-4' }),
  workflow: 'sequential' // or 'parallel' or 'custom'
});

const result = await system.invoke({
  messages: [{ role: 'user', content: 'Create a research report' }]
});
```

#### Options

```typescript
interface MultiAgentSystemOptions {
  agents: Record<string, Agent>;   // Named agents
  coordinator: BaseChatModel;      // Coordinator LLM
  workflow: WorkflowType;          // Execution workflow
  maxRounds?: number;              // Max coordination rounds
  checkpointSaver?: CheckpointSaver;
  middleware?: Middleware[];
}

type WorkflowType = 'sequential' | 'parallel' | 'custom';
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

All exports include full TypeScript definitions. See the [source code](https://github.com/agentforge/agentforge/tree/main/packages/patterns/src) for complete type information.

