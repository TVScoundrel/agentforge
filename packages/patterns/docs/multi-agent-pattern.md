# Multi-Agent Coordination Pattern Guide

> Comprehensive guide to the Multi-Agent Coordination pattern in `@agentforge/patterns`

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [When to Use](#when-to-use)
- [Architecture](#architecture)
- [Core Concepts](#core-concepts)
- [Routing Strategies](#routing-strategies)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)

## Overview

The Multi-Agent Coordination pattern enables multiple specialized agents to work together on complex tasks. A supervisor agent coordinates task distribution to worker agents based on their capabilities, and an aggregator combines the results.

### Key Components

1. **Supervisor**: Routes tasks to appropriate workers
2. **Workers**: Execute specialized tasks
3. **Aggregator**: Combines results from multiple workers
4. **Routing Strategy**: Determines how tasks are assigned

### Pattern Flow

```
Input → Supervisor → Worker(s) → Aggregator → Output
         ↓                ↓
    Routing Logic    Specialized
                     Execution
```

## Quick Start

### Using MultiAgentSystemBuilder (Recommended)

The builder pattern allows you to dynamically register workers before compiling the system:

```typescript
import { MultiAgentSystemBuilder } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

const llm = new ChatOpenAI({ modelName: 'gpt-4' });

// Create builder
const builder = new MultiAgentSystemBuilder({
  supervisor: {
    model: llm,
    strategy: 'skill-based',
  },
  aggregator: {
    model: llm,
  },
});

// Register workers dynamically
builder.registerWorkers([
  {
    id: 'math_specialist',
    name: 'Math Specialist',
    description: 'Solves mathematical problems',
    capabilities: {
      skills: ['mathematics', 'calculations', 'algebra'],
      tools: ['calculator'],
      available: true,
    },
    model: llm,    tools: [calculatorTool],
  },
  {
    id: 'researcher',
    name: 'Researcher',
    description: 'Conducts research and gathers information',
    capabilities: {
      skills: ['research', 'web_search', 'data_collection'],
      tools: ['search', 'fetch'],
      available: true,
    },
    model: llm,    tools: [searchTool, fetchTool],
  },
]);

// Build the system
const system = builder.build();

// Use the system
const result = await system.invoke({
  input: 'What is the square root of 144?',
});

console.log(result.response);
```

### Using createMultiAgentSystem (Static Workers)

For systems with a fixed set of workers, you can use the factory function:

```typescript
import { createMultiAgentSystem } from '@agentforge/patterns';

const system = createMultiAgentSystem({
  supervisor: {
    model: llm,    strategy: 'skill-based',
  },
  workers: [
    {
      id: 'math_specialist',
      name: 'Math Specialist',
      capabilities: { skills: ['math'], tools: ['calculator'], available: true },
      model: llm,      tools: [calculatorTool],
    },
  ],
  aggregator: { model: llm },
});

const result = await system.invoke({
  input: 'Calculate 123 * 456',
});
```

## When to Use

### ✅ Ideal Use Cases

- **Specialized Tasks**: Tasks requiring different expertise areas
- **Customer Support**: Routing to specialized support teams
- **Research Workflows**: Data collection, analysis, and reporting
- **Data Processing**: Multi-stage processing pipelines
- **Parallel Execution**: Independent tasks that can run concurrently

### ❌ Not Recommended For

- **Simple Tasks**: Single-agent patterns are more efficient
- **Sequential Reasoning**: Use ReAct or Plan-Execute instead
- **Identical Workers**: No benefit from specialization
- **Real-time Critical**: Coordination adds latency

## Architecture

### State Management

The pattern uses `MultiAgentState` with 10 channels:

```typescript
{
  input: string;                    // Original task
  messages: BaseMessage[];          // Conversation history
  workers: WorkerAgent[];           // Available workers
  currentTask: TaskAssignment | null; // Current task assignment
  workerResults: TaskResult[];      // Results from workers
  aggregatedResult: any | null;     // Combined results
  response: string;                 // Final response
  status: 'routing' | 'executing' | 'aggregating' | 'completed';
  iterations: number;               // Coordination iterations
  metadata: Record<string, any>;    // Additional metadata
}
```

### Node Types

#### 1. Supervisor Node

Routes tasks to appropriate workers based on the routing strategy.

```typescript
const supervisorNode = createSupervisorNode({
  model: ChatOpenAI,
  routingStrategy: 'skill-based',
  systemPrompt: 'Custom supervisor instructions',
});
```

#### 2. Worker Node

Executes specialized tasks using provided tools.

```typescript
const workerNode = createWorkerNode({
  workerId: 'specialist',
  tools: [tool1, tool2],
  systemPrompt: 'Worker-specific instructions',
});
```

#### 3. Aggregator Node

Combines results from multiple workers.

```typescript
const aggregatorNode = createAggregatorNode({
  model: ChatOpenAI,
  systemPrompt: 'Combine results into coherent response',
});
```

## Core Concepts

### Workers

Workers are specialized agents with specific capabilities:

```typescript
interface WorkerAgent {
  id: string;                    // Unique identifier
  name: string;                  // Human-readable name
  description: string;           // Worker description
  capabilities: string[];        // Skills/capabilities
  status: 'idle' | 'busy' | 'error';
  currentLoad: number;           // Current workload (0-1)
}
```

### Task Assignment

Tasks are assigned to workers with metadata:

```typescript
interface TaskAssignment {
  taskId: string;
  description: string;
  assignedTo: string;            // Worker ID
  priority: 'low' | 'medium' | 'high';
  dependencies: string[];        // Task dependencies
  metadata: Record<string, any>;
}
```

### Task Results

Workers return structured results:

```typescript
interface TaskResult {
  taskId: string;
  workerId: string;
  status: 'completed' | 'failed' | 'pending';
  result: any;
  error?: string;
  executionTime: number;
  metadata: Record<string, any>;
}
```

## Routing Strategies

### 1. LLM-Based Routing

Uses an LLM to analyze the task and select the best worker.

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    model: llm,    routingStrategy: 'llm-based',
    systemPrompt: `Analyze the task and route to the most appropriate worker:
      - Worker A: handles X
      - Worker B: handles Y
      - Worker C: handles Z`,
  },
  // ...
});
```

**Pros**:
- Most flexible and intelligent
- Handles complex, ambiguous tasks
- Adapts to context

**Cons**:
- Slower (requires LLM call)
- Less predictable
- Higher cost

**Best for**: Complex tasks with varied requirements

### 2. Skill-Based Routing

Matches task requirements to worker capabilities.

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    model: llm,    routingStrategy: 'skill-based',
  },
  // ...
});
```

**Pros**:
- Fast and efficient
- Predictable routing
- No LLM overhead

**Cons**:
- Requires well-defined capabilities
- Less flexible

**Best for**: Well-defined task categories

### 3. Round-Robin Routing

Distributes tasks evenly across all workers.

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    model: llm,    routingStrategy: 'round-robin',
  },
  // ...
});
```

**Pros**:
- Simple load balancing
- Fair distribution
- Very fast

**Cons**:
- Ignores worker specialization
- May route to wrong worker

**Best for**: Similar workers, load distribution

### 4. Rule-Based Routing

Uses custom rules to determine routing.

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    model: llm,    routingStrategy: {
      type: 'rule-based',
      rules: [
        {
          condition: (state) => state.input.includes('technical'),
          workerId: 'tech_support',
        },
        {
          condition: (state) => state.input.includes('billing'),
          workerId: 'billing_support',
        },
      ],
      defaultWorkerId: 'general_support',
    },
  },
  // ...
});
```

**Pros**:
- Deterministic routing
- Custom business logic
- Very fast

**Cons**:
- Requires manual rule definition
- Less flexible

**Best for**: Well-defined routing rules

### 5. Load-Balanced Routing

Routes to the least busy worker.

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    model: llm,    routingStrategy: 'load-balanced',
  },
  // ...
});
```

**Pros**:
- Optimizes resource utilization
- Prevents worker overload
- Good for high throughput

**Cons**:
- Ignores worker specialization
- Requires load tracking

**Best for**: High-throughput scenarios

## API Reference

### MultiAgentSystemBuilder (Recommended)

Builder class for creating multi-agent systems with dynamic worker registration.

```typescript
class MultiAgentSystemBuilder {
  constructor(config: Omit<MultiAgentSystemConfig, 'workers'>);
  registerWorkers(workers: WorkerConfig[]): void;
  build(): CompiledStateGraph;
}
```

**Constructor Parameters**:

```typescript
interface MultiAgentSystemConfig {
  supervisor: SupervisorConfig;
  aggregator?: AggregatorConfig;
  maxIterations?: number;
  verbose?: boolean;
}

interface SupervisorConfig {
  model: BaseChatModel;
  strategy: RoutingStrategy;
  systemPrompt?: string;
  tools?: Tool[];           // Optional tools for supervisor to use during routing
  maxToolRetries?: number;  // Max tool calls before routing (default: 3)
}

interface AggregatorConfig {
  model: BaseChatModel;
  systemPrompt?: string;
}
```

**Methods**:

#### registerWorkers(workers: WorkerConfig[])

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

#### build(): CompiledStateGraph

Compiles the system into an executable graph. After calling `build()`, the system is immutable and workers cannot be added.

**Example**:

```typescript
const builder = new MultiAgentSystemBuilder({
  supervisor: { model: llm, strategy: 'skill-based' },
  aggregator: { model: llm },
  maxIterations: 10,
  verbose: true,
});

builder.registerWorkers([
  {
    id: 'worker1',
    name: 'Worker 1',
    description: 'First worker',
    capabilities: { skills: ['skill1'], tools: ['tool1'], available: true },
    model: llm,    tools: [tool1],
  },
]);

const system = builder.build();
```

### createMultiAgentSystem()

Creates a complete multi-agent coordination system with a fixed set of workers.

```typescript
function createMultiAgentSystem(config: MultiAgentSystemConfig): CompiledStateGraph
```

**Parameters**:

```typescript
interface MultiAgentConfig {
  supervisor: {
    model: BaseChatModel;
    routingStrategy: RoutingStrategy;
    systemPrompt?: string;
  };
  workers: WorkerConfig[];
  aggregator: {
    model: BaseChatModel;
    systemPrompt?: string;
  };
  maxIterations?: number;
  verbose?: boolean;
}
```

**Returns**: Compiled LangGraph workflow

**Example**:

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    model: new ChatOpenAI({ modelName: 'gpt-4' }),
    routingStrategy: 'skill-based',
  },
  workers: [],
  aggregator: {
    model: new ChatOpenAI({ modelName: 'gpt-4' }),
  },
  maxIterations: 10,
  verbose: true,
});
```

### registerWorkers() (Deprecated)

> ⚠️ **DEPRECATED**: This function only updates worker capabilities in the state, but does not add worker nodes to the graph. Use `MultiAgentSystemBuilder` instead for proper dynamic worker registration.

Registers workers with the multi-agent system. This function has a fundamental limitation: it can only update the worker capabilities in the state, but cannot add new nodes to the compiled graph (LangGraph graphs are immutable after compilation).

```typescript
function registerWorkers(
  system: CompiledStateGraph,
  workers: WorkerConfig[]
): void
```

**Limitations**:
- ❌ Does NOT add worker nodes to the graph
- ❌ Only updates worker capabilities in state
- ❌ Workers must already exist as nodes in the graph
- ✅ Can update capabilities of existing workers

**Recommended Alternative**: Use `MultiAgentSystemBuilder` instead:

```typescript
// ❌ Old way (deprecated)
const system = createMultiAgentSystem({ workers: [] });
registerWorkers(system, [worker1, worker2]); // Only updates state, no nodes added!

// ✅ New way (recommended)
const builder = new MultiAgentSystemBuilder({ supervisor, aggregator });
builder.registerWorkers([worker1, worker2]); // Properly adds nodes
const system = builder.build();
```

**Parameters**:

```typescript
interface WorkerConfig {
  name: string;
  description: string;
  capabilities: string[];
  tools: Tool[];
  systemPrompt?: string;
}
```

**Example** (for updating existing workers only):

```typescript
registerWorkers(system, [
  {
    name: 'researcher',
    description: 'Conducts research and gathers information',
    capabilities: ['research', 'data_collection'],
    tools: [searchTool, fetchTool],
    systemPrompt: 'You are a research specialist.',
  },
  {
    name: 'analyst',
    description: 'Analyzes data and identifies patterns',
    capabilities: ['analysis', 'statistics'],
    tools: [analyzeTool, validateTool],
    systemPrompt: 'You are a data analyst.',
  },
]);
```

### createSupervisorNode()

Creates a supervisor node for custom workflows.

```typescript
function createSupervisorNode(config: SupervisorConfig): NodeFunction
```

**Parameters**:

```typescript
interface SupervisorConfig {
  model: BaseChatModel;
  routingStrategy: RoutingStrategy;
  systemPrompt?: string;
  tools?: Tool[];           // Optional tools for supervisor to use during routing
  maxToolRetries?: number;  // Max tool calls before routing (default: 3)
}
```

**Example**:

```typescript
const supervisor = createSupervisorNode({
  model: new ChatOpenAI({ modelName: 'gpt-4' }),
  routingStrategy: 'llm-based',
  systemPrompt: 'Route tasks to appropriate specialists',
});
```

### createWorkerNode()

Creates a worker node for custom workflows.

```typescript
function createWorkerNode(config: WorkerNodeConfig): NodeFunction
```

**Parameters**:

```typescript
interface WorkerNodeConfig {
  workerId: string;
  tools: Tool[];
  systemPrompt?: string;
}
```

**Example**:

```typescript
const worker = createWorkerNode({
  workerId: 'specialist',
  tools: [tool1, tool2],
  systemPrompt: 'You are a specialist in X',
});
```

### createAggregatorNode()

Creates an aggregator node for custom workflows.

```typescript
function createAggregatorNode(config: AggregatorConfig): NodeFunction
```

**Parameters**:

```typescript
interface AggregatorConfig {
  model: BaseChatModel;
  systemPrompt?: string;
}
```

**Example**:

```typescript
const aggregator = createAggregatorNode({
  model: new ChatOpenAI({ modelName: 'gpt-4' }),
  systemPrompt: 'Combine results into a coherent response',
});
```

## Examples

### Example 1: Basic Coordination with Builder

```typescript
import { MultiAgentSystemBuilder } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

const llm = new ChatOpenAI({ modelName: 'gpt-4' });

// Create builder
const builder = new MultiAgentSystemBuilder({
  supervisor: {
    model: llm,    strategy: 'skill-based',
  },
  aggregator: { model: llm },
});

// Register workers
builder.registerWorkers([
  {
    id: 'math_expert',
    name: 'Math Expert',
    description: 'Solves mathematical problems',
    capabilities: {
      skills: ['mathematics', 'calculations', 'arithmetic'],
      tools: ['calculator'],
      available: true,
    },
    model: llm,    tools: [calculatorTool],
  },
  {
    id: 'weather_expert',
    name: 'Weather Expert',
    description: 'Provides weather information',
    capabilities: {
      skills: ['weather', 'forecasts', 'meteorology'],
      tools: ['weather_api'],
      available: true,
    },
    model: llm,    tools: [weatherTool],
  },
]);

// Build and execute
const system = builder.build();

const result = await system.invoke({
  input: 'What is 25 * 4 and what is the weather in Paris?',
});

console.log(result.response);
```

### Example 2: Customer Support with Static Workers

For systems with a fixed set of workers, you can use `createMultiAgentSystem`:

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    model: llm,    strategy: 'llm-based',
    systemPrompt: `Route customer inquiries:
      - Technical issues → tech_support
      - Billing questions → billing_support
      - General questions → general_support`,
  },
  workers: [
    {
      id: 'tech_support',
      name: 'Tech Support',
      description: 'Handles technical issues',
      capabilities: {
        skills: ['technical', 'troubleshooting', 'debugging'],
        tools: ['diagnostic', 'troubleshoot'],
        available: true,
      },
      model: llm,      tools: [diagnosticTool, troubleshootTool],
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
      model: llm,      tools: [checkAccountTool, processRefundTool],
    },
    {
      id: 'general_support',
      name: 'General Support',
      description: 'Handles general questions',
      capabilities: {
        skills: ['general', 'faq', 'information'],
        tools: ['faq_search', 'ticket_create'],
        available: true,
      },
      model: llm,      tools: [faqSearchTool, createTicketTool],
    },
  ],
  aggregator: {
    model: llm,    systemPrompt: 'Provide helpful, empathetic customer support',
  },
});

const result = await system.invoke({
  input: 'My app keeps crashing when I upload files',
});
```

### Example 3: Research Team with Builder

```typescript
const builder = new MultiAgentSystemBuilder({
  supervisor: {
    model: llm,    strategy: 'skill-based',
  },
  aggregator: {
    model: llm,    systemPrompt: 'Synthesize research findings into comprehensive report',
  },
  maxIterations: 10,
});

builder.registerWorkers([
  {
    id: 'data_collector',
    name: 'Data Collector',
    description: 'Gathers information from sources',
    capabilities: ['search', 'data_collection'],
    tools: [searchTool, fetchDataTool],
  },
  {
    name: 'analyst',
    description: 'Analyzes data and identifies patterns',
    capabilities: ['analysis', 'statistics'],
    tools: [analyzeTool, validateTool],
  },
  {
    name: 'writer',
    description: 'Creates reports and documentation',
    capabilities: ['writing', 'reporting'],
    tools: [generateReportTool, citeTool],
  },
]);

const result = await system.invoke({
  input: 'Research AI impact on healthcare and create a summary report',
});
```

### Example 4: Custom Workflow

```typescript
import { StateGraph, END } from '@langchain/langgraph';
import {
  MultiAgentState,
  createSupervisorNode,
  createWorkerNode,
  createAggregatorNode,
} from '@agentforge/patterns';

// Create nodes
const supervisor = createSupervisorNode({
  model: llm,  routingStrategy: {
    type: 'rule-based',
    rules: [
      { condition: (s) => s.iterations === 0, workerId: 'validator' },
      { condition: (s) => s.iterations === 1, workerId: 'processor' },
    ],
  },
});

const validator = createWorkerNode({
  workerId: 'validator',
  tools: [validateTool],
});

const processor = createWorkerNode({
  workerId: 'processor',
  tools: [processTool],
});

const aggregator = createAggregatorNode({ llm });

// Build workflow
const workflow = new StateGraph({ channels: MultiAgentState })
  .addNode('supervisor', supervisor)
  .addNode('validator', validator)
  .addNode('processor', processor)
  .addNode('aggregator', aggregator)
  .addEdge('__start__', 'supervisor')
  .addConditionalEdges('supervisor', routingLogic)
  .addEdge('validator', 'supervisor')
  .addEdge('processor', 'aggregator')
  .addEdge('aggregator', END);

const agent = workflow.compile();
```

## Best Practices

### 1. Define Clear Capabilities

Give each worker distinct, well-defined capabilities:

```typescript
// ✅ Good: Specific capabilities
capabilities: ['technical_support', 'hardware_diagnostics', 'software_troubleshooting']

// ❌ Bad: Vague capabilities
capabilities: ['support', 'help']
```

### 2. Choose Appropriate Routing

Match routing strategy to your use case:

- **LLM-based**: Complex, varied tasks
- **Skill-based**: Well-defined categories
- **Round-robin**: Load distribution
- **Rule-based**: Specific business rules
- **Load-balanced**: High throughput

### 3. Optimize System Prompts

Provide clear instructions for each component:

```typescript
// Supervisor prompt
systemPrompt: `You are a supervisor coordinating specialists.
  Route tasks based on:
  - Technical issues → tech_support
  - Billing questions → billing_support
  Analyze the request carefully before routing.`

// Worker prompt
systemPrompt: `You are a technical support specialist.
  Diagnose issues systematically.
  Provide clear, step-by-step solutions.
  Escalate if unable to resolve.`

// Aggregator prompt
systemPrompt: `Combine worker results into a coherent response.
  Maintain professional tone.
  Ensure all aspects of the query are addressed.`
```

### 4. Handle Errors Gracefully

Implement error handling for worker failures:

```typescript
const workerNode = createWorkerNode({
  workerId: 'specialist',
  tools: [tool],
  systemPrompt: 'Handle errors gracefully and provide fallback responses',
});

// Check results
if (result.workerResults.some(r => r.status === 'failed')) {
  console.error('Some workers failed');
  // Implement retry or fallback logic
}
```

### 5. Monitor Performance

Use verbose mode during development:

```typescript
const system = createMultiAgentSystem({
  // ...
  verbose: true, // Enable detailed logging
});
```

### 6. Limit Iterations

Prevent infinite loops:

```typescript
const system = createMultiAgentSystem({
  // ...
  maxIterations: 10, // Reasonable limit
});
```

### 7. Test Routing Logic

Verify routing with various inputs:

```typescript
const testCases = [
  { input: 'technical issue', expectedWorker: 'tech_support' },
  { input: 'billing question', expectedWorker: 'billing_support' },
];

for (const test of testCases) {
  const result = await system.invoke({ input: test.input });
  // Verify correct routing
}
```

## Advanced Usage

### Custom Routing Strategy

Implement custom routing logic:

```typescript
interface CustomRoutingStrategy {
  type: 'custom';
  route: (state: MultiAgentStateType) => string;
}

const customStrategy: CustomRoutingStrategy = {
  type: 'custom',
  route: (state) => {
    // Custom logic
    if (state.input.length > 100) return 'detailed_worker';
    if (state.iterations > 5) return 'fallback_worker';
    return 'default_worker';
  },
};

const system = createMultiAgentSystem({
  supervisor: {
    model: llm,    routingStrategy: customStrategy,
  },
  // ...
});
```

### Parallel Worker Execution

Execute multiple workers in parallel:

```typescript
const parallelWorkflow = new StateGraph({ channels: MultiAgentState })
  .addNode('supervisor', supervisorNode)
  .addNode('worker1', worker1Node)
  .addNode('worker2', worker2Node)
  .addNode('worker3', worker3Node)
  .addNode('aggregator', aggregatorNode)
  .addEdge('__start__', 'supervisor')
  // Parallel execution
  .addConditionalEdges('supervisor', (state) => {
    return ['worker1', 'worker2', 'worker3'];
  })
  .addEdge('worker1', 'aggregator')
  .addEdge('worker2', 'aggregator')
  .addEdge('worker3', 'aggregator')
  .addEdge('aggregator', END);
```

### Dynamic Worker Registration

Use `MultiAgentSystemBuilder` for dynamic worker registration:

```typescript
const builder = new MultiAgentSystemBuilder({
  supervisor: { model: llm, strategy: 'skill-based' },
  aggregator: { model: llm },
});

// Register initial workers
builder.registerWorkers([worker1Config, worker2Config]);

// Add more workers before building
builder.registerWorkers([worker3Config]);

// Build the system (after this, no more workers can be added)
const system = builder.build();
```

**Important**: Workers must be registered BEFORE calling `build()`. Once the system is compiled, it's immutable and workers cannot be added.

### Worker Priority

Implement priority-based routing:

```typescript
interface PriorityWorker extends WorkerConfig {
  priority: number;
}

const priorityStrategy = {
  type: 'custom' as const,
  route: (state: MultiAgentStateType) => {
    const workers = state.workers as PriorityWorker[];
    const sorted = workers.sort((a, b) => b.priority - a.priority);
    return sorted[0].id;
  },
};
```

### Result Caching

Cache worker results for efficiency:

```typescript
const cache = new Map<string, TaskResult>();

const cachedWorkerNode = async (state: MultiAgentStateType) => {
  const cacheKey = `${state.currentTask?.taskId}`;

  if (cache.has(cacheKey)) {
    console.log('[Cache] Hit');
    return { workerResults: [cache.get(cacheKey)!] };
  }

  const result = await workerNode(state);
  cache.set(cacheKey, result.workerResults[0]);
  return result;
};
```

### Conditional Aggregation

Aggregate only when conditions are met:

```typescript
const conditionalAggregator = async (state: MultiAgentStateType) => {
  const allCompleted = state.workerResults?.every(r => r.status === 'completed');
  const hasMinResults = (state.workerResults?.length ?? 0) >= 3;

  if (!allCompleted || !hasMinResults) {
    return { status: 'routing' }; // Continue routing
  }

  return await aggregatorNode(state);
};
```

### Worker Health Monitoring

Monitor worker health and route accordingly:

```typescript
interface HealthyWorker extends WorkerAgent {
  health: 'healthy' | 'degraded' | 'unhealthy';
  errorRate: number;
}

const healthAwareRouting = {
  type: 'custom' as const,
  route: (state: MultiAgentStateType) => {
    const workers = state.workers as HealthyWorker[];
    const healthy = workers.filter(w => w.health === 'healthy');

    if (healthy.length === 0) {
      throw new Error('No healthy workers available');
    }

    // Route to healthiest worker
    return healthy.sort((a, b) => a.errorRate - b.errorRate)[0].id;
  },
};
```

### Tool-Enabled Supervisor

Enable the supervisor to use tools during routing decisions. This is particularly useful when the supervisor needs to gather additional information before making routing decisions.

#### Overview

When tools are provided to the supervisor, it can call them during the routing process to:
- Ask the user for clarification on ambiguous requests
- Fetch additional context needed for routing decisions
- Validate information before routing to a worker

The supervisor will execute tool calls and incorporate the results into its decision-making process before selecting a worker.

#### Configuration

```typescript
import { createMultiAgentSystem } from '@agentforge/patterns';
import { createAskHumanTool } from '@agentforge/core';
import { ChatOpenAI } from '@langchain/openai';

const llm = new ChatOpenAI({ modelName: 'gpt-4' });

// Create askHuman tool for clarification
const askHumanTool = createAskHumanTool();

const system = createMultiAgentSystem({
  supervisor: {
    strategy: 'llm-based',
    model: llm,
    tools: [askHumanTool],           // Tools the supervisor can use
    maxToolRetries: 3,                // Max tool calls before routing (default: 3)
    systemPrompt: `You are a supervisor coordinating specialized agents.

When the user's request is ambiguous or lacks necessary details, use the askHuman tool
to gather more information before routing to a worker.

Available workers:
- hr_agent: Handles HR tasks (onboarding, benefits, policies)
- security_agent: Handles security tasks (audits, compliance, access)
- code_agent: Handles code tasks (reviews, refactoring, debugging)`,
  },
  workers: [
    {
      id: 'hr_agent',
      executeFn: hrWorker,
      capabilities: {
        skills: ['hr', 'onboarding', 'benefits'],
        tools: ['slack', 'workday'],
      },
    },
    {
      id: 'security_agent',
      executeFn: securityWorker,
      capabilities: {
        skills: ['security', 'compliance', 'audit'],
        tools: ['scanner', 'analyzer'],
      },
    },
    {
      id: 'code_agent',
      executeFn: codeWorker,
      capabilities: {
        skills: ['code', 'review', 'refactor'],
        tools: ['linter', 'formatter'],
      },
    },
  ],
});
```

#### How It Works

1. **User sends ambiguous request**: "I need help with something"
2. **Supervisor detects ambiguity**: Realizes it needs more information
3. **Supervisor calls askHuman tool**: "What type of help do you need? (HR, Security, or Code)"
4. **User responds**: "Security compliance audit"
5. **Supervisor routes to worker**: Routes to `security_agent` based on clarification
6. **Worker executes task**: Security agent performs the audit

#### Example: Handling Ambiguous Queries

```typescript
// User query is ambiguous
const result = await system.invoke({
  input: 'I need help',
});

// Behind the scenes:
// 1. Supervisor receives: "I need help"
// 2. Supervisor calls askHuman: "What type of help do you need?"
// 3. User responds: "Security compliance"
// 4. Supervisor routes to: security_agent
// 5. Security agent executes task
// 6. Result returned to user

console.log(result.response);
// "Security compliance audit completed. All systems are compliant."
```

#### Tool Execution Flow

```
User Input
    ↓
Supervisor (with tools)
    ↓
Tool Call? ──Yes──→ Execute Tool ──→ Add to conversation ──→ Retry routing
    ↓                                                              ↑
    No                                                             │
    ↓                                                              │
Routing Decision ──────────────────────────────────────────────────┘
    ↓
Worker Execution
    ↓
Result
```

#### Configuration Options

**`tools`**: Array of tools the supervisor can use
- Only works with `llm-based` routing strategy
- Tools are converted to LangChain format automatically
- Common use case: `askHuman` for clarification

**`maxToolRetries`**: Maximum number of tool calls before requiring routing decision
- Default: `3`
- Prevents infinite loops where supervisor keeps calling tools
- After max retries, supervisor must make a routing decision

#### Best Practices

1. **Use for ambiguous queries**: Tool-enabled supervisors are ideal when user intent is unclear
2. **Set appropriate retry limits**: Balance between gathering information and avoiding delays
3. **Provide clear system prompts**: Guide the supervisor on when to use tools vs. route directly
4. **Handle tool failures gracefully**: Ensure supervisor can still route even if tools fail

#### Example: Multiple Tool Calls

```typescript
// Supervisor may call tools multiple times to gather complete information
const result = await system.invoke({
  input: 'I need help with a task',
});

// Behind the scenes:
// 1. Supervisor: "What department?" → User: "HR"
// 2. Supervisor: "What specific task?" → User: "Onboarding"
// 3. Supervisor routes to: hr_agent
```

#### Troubleshooting

**Issue**: Supervisor keeps calling tools without routing
- **Cause**: Max retry limit too high or supervisor not making decisions
- **Solution**: Lower `maxToolRetries` or improve system prompt

**Issue**: Tools not being called when needed
- **Cause**: System prompt doesn't encourage tool use
- **Solution**: Update prompt to explicitly mention when to use tools

**Issue**: Tool execution errors
- **Cause**: Tool implementation issues or invalid arguments
- **Solution**: Check tool implementation and ensure proper error handling

#### Backward Compatibility

Tool-enabled supervisors are fully backward compatible:
- Systems without tools continue to work as before
- No changes needed to existing code
- Tools are optional and only used when configured

## Troubleshooting

### Common Issues

#### 1. Workers Not Receiving Tasks

**Problem**: Supervisor not routing to workers

**Solutions**:
- Verify worker capabilities match task requirements
- Check routing strategy configuration
- Enable verbose mode to see routing decisions
- Ensure workers are properly registered

```typescript
// Debug routing
const system = createMultiAgentSystem({
  supervisor: {
    model: llm,    routingStrategy: 'skill-based',
  },
  workers: [],
  aggregator: { model: llm },
  verbose: true, // Enable logging
});
```

#### 2. Infinite Routing Loops

**Problem**: System keeps routing without completing

**Solutions**:
- Set appropriate `maxIterations`
- Implement proper completion conditions
- Check aggregation logic

```typescript
const system = createMultiAgentSystem({
  // ...
  maxIterations: 10, // Prevent infinite loops
});
```

#### 3. Poor Routing Decisions

**Problem**: LLM-based routing selects wrong workers

**Solutions**:
- Improve supervisor system prompt
- Provide clearer worker descriptions
- Use skill-based or rule-based routing instead

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    model: llm,    routingStrategy: 'llm-based',
    systemPrompt: `Detailed routing instructions:
      - For X tasks, use worker A because...
      - For Y tasks, use worker B because...
      Examples:
      - "technical issue" → tech_support
      - "billing question" → billing_support`,
  },
  // ...
});
```

#### 4. Slow Performance

**Problem**: System takes too long to respond

**Solutions**:
- Use faster routing strategies (skill-based, rule-based)
- Reduce LLM calls
- Implement caching
- Use parallel execution

```typescript
// Fast routing
const system = createMultiAgentSystem({
  supervisor: {
    model: llm,    routingStrategy: 'skill-based', // Faster than LLM-based
  },
  // ...
});
```

#### 5. Worker Failures

**Problem**: Workers failing to execute tasks

**Solutions**:
- Implement error handling in tools
- Add retry logic
- Provide fallback workers

```typescript
const robustTool = {
  name: 'tool',
  execute: async (input: any) => {
    try {
      return await actualExecution(input);
    } catch (error) {
      console.error('[Tool] Error:', error);
      return { error: error.message, status: 'failed' };
    }
  },
};
```

### Debugging Tips

1. **Enable Verbose Mode**:
```typescript
const system = createMultiAgentSystem({
  // ...
  verbose: true,
});
```

2. **Log State Transitions**:
```typescript
const loggingNode = async (state: MultiAgentStateType) => {
  console.log('[State]', {
    status: state.status,
    iterations: state.iterations,
    workers: state.workers.length,
    results: state.workerResults?.length,
  });
  return {};
};
```

3. **Inspect Worker Results**:
```typescript
const result = await system.invoke({ input: 'task' });

console.log('Worker Results:', result.workerResults);
console.log('Aggregated Result:', result.aggregatedResult);
console.log('Final Response:', result.response);
```

4. **Test Individual Components**:
```typescript
// Test supervisor alone
const supervisorResult = await supervisorNode(testState);

// Test worker alone
const workerResult = await workerNode(testState);

// Test aggregator alone
const aggregatorResult = await aggregatorNode(testState);
```

## Comparison with Other Patterns

| Feature | Multi-Agent | ReAct | Plan-Execute | Reflection |
|---------|-------------|-------|--------------|------------|
| **Coordination** | High | None | Medium | None |
| **Specialization** | High | Low | Medium | Low |
| **Complexity** | High | Low | Medium | Medium |
| **Latency** | High | Low | Medium | High |
| **Best For** | Specialized tasks | Tool reasoning | Structured planning | Quality improvement |
| **Parallel Execution** | Yes | No | Yes | No |
| **Routing Logic** | Yes | No | No | No |

## Conclusion

The Multi-Agent Coordination pattern is powerful for tasks requiring multiple specialized capabilities. Key takeaways:

1. **Choose the right routing strategy** for your use case
2. **Define clear worker capabilities** for effective routing
3. **Optimize system prompts** for better coordination
4. **Monitor performance** and adjust as needed
5. **Handle errors gracefully** with fallbacks and retries

For more examples, see the [examples directory](../examples/multi-agent/).

## Related Documentation

- [ReAct Pattern Guide](./react-agent-guide.md)
- [Plan-Execute Pattern Guide](./plan-execute-pattern.md)
- [Reflection Pattern Guide](./reflection-pattern.md)
- [Pattern Comparison Guide](./pattern-comparison.md)
- [API Documentation](./README.md)

