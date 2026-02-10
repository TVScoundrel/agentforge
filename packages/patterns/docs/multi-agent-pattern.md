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
    name: 'math_specialist',
    description: 'Solves mathematical problems',
    capabilities: ['mathematics', 'calculations', 'algebra'],
    model: llm,    tools: [calculatorTool],
  },
  {
    name: 'researcher',
    description: 'Conducts research and gathers information',
    capabilities: ['research', 'web_search', 'data_collection'],
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
      capabilities: { skills: ['math'], tools: ['calculator'], available: true, currentWorkload: 0 },
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

The pattern uses `MultiAgentState` with the following channels:

```typescript
{
  input: string;                           // Original user input/query
  messages: AgentMessage[];                // Inter-agent messages
  workers: Record<string, WorkerCapabilities>; // Available workers and their capabilities
  currentAgent?: string;                   // Currently active agent ID
  routingHistory: RoutingDecision[];       // History of routing decisions
  activeAssignments: TaskAssignment[];     // Currently active task assignments
  completedTasks: TaskResult[];            // Completed task results
  handoffs: HandoffRequest[];              // Agent handoff requests
  status: MultiAgentStatus;                // 'initializing' | 'routing' | 'executing' | 'coordinating' | 'aggregating' | 'completed' | 'failed'
  iteration: number;                       // Current iteration count
  maxIterations: number;                   // Maximum iterations allowed
  response?: string;                       // Final aggregated response
  error?: string;                          // Error message if execution failed
}
```

### Node Types

#### 1. Supervisor Node

Routes tasks to appropriate workers based on the routing strategy.

```typescript
const supervisorNode = createSupervisorNode({
  model: new ChatOpenAI({ model: 'gpt-4' }),
  strategy: 'skill-based',
  systemPrompt: 'Custom supervisor instructions',
});
```

#### 2. Worker Node

Executes specialized tasks using provided tools.

```typescript
const workerNode = createWorkerNode({
  id: 'specialist',
  capabilities: {
    skills: ['analysis', 'processing'],
    tools: ['tool1', 'tool2'],
    available: true,
    currentWorkload: 0,
  },
  tools: [tool1, tool2],
  systemPrompt: 'Worker-specific instructions',
});
```

#### 3. Aggregator Node

Combines results from multiple workers.

```typescript
const aggregatorNode = createAggregatorNode({
  model: new ChatOpenAI({ model: 'gpt-4' }),
  systemPrompt: 'Combine results into coherent response',
});
```

## Core Concepts

### Workers

Workers are specialized agents with specific capabilities:

```typescript
interface WorkerCapabilities {
  skills: string[];              // List of agent skills
  tools: string[];               // List of tool names available to agent
  available: boolean;            // Whether agent is available
  currentWorkload: number;       // Current number of active tasks
}
```

### Task Assignment

Tasks are assigned to workers with metadata:

```typescript
interface TaskAssignment {
  id: string;                    // Unique assignment identifier
  workerId: string;              // Worker identifier assigned to task
  task: string;                  // Description of the task
  priority: number;              // Task priority (1-10, higher is more urgent)
  assignedAt: number;            // Timestamp when task was assigned
  deadline?: number;             // Optional task deadline timestamp
}
```

### Task Results

Workers return structured results:

```typescript
interface TaskResult {
  assignmentId: string;          // Assignment identifier
  workerId: string;              // Worker that completed the task
  success: boolean;              // Whether the task succeeded
  result: string;                // Task result or output
  error?: string;                // Error message if task failed
  completedAt: number;           // Timestamp when task was completed
  metadata?: Record<string, any>; // Execution metadata
}
```

## Routing Strategies

### 1. LLM-Based Routing

Uses an LLM to analyze the task and select the best worker.

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    model: llm,
    strategy: 'llm-based',
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

### Parallel Routing

**NEW in v0.6.3**: The LLM-based routing strategy now supports routing to **multiple agents in parallel** for comprehensive answers.

#### How It Works

When using `llm-based` routing, the supervisor can select multiple workers to execute simultaneously:

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    model: llm,
    strategy: 'llm-based',
    systemPrompt: `Route queries to appropriate workers.

    **PARALLEL ROUTING**: Select MULTIPLE workers when the query benefits from
    multiple perspectives or data sources.

    Common parallel routing scenarios:
    - Code + Documentation: "How does authentication work?"
    - Code + Security: "Are there security issues in the auth module?"
    - Legal + HR: "What are compliance requirements for employee data?"

    For parallel routing, return:
    {
      "targetAgents": ["worker_id_1", "worker_id_2"],
      "reasoning": "explanation",
      "confidence": 0.9,
      "strategy": "llm-based"
    }

    For single routing, return:
    {
      "targetAgent": "worker_id",
      "reasoning": "explanation",
      "confidence": 0.9,
      "strategy": "llm-based"
    }`,
  },
  workers: [
    {
      id: 'code',
      name: 'Code Agent',
      description: 'Analyzes codebase',
      capabilities: { skills: ['code-analysis', 'debugging'], tools: [], available: true },
      model: llm,
      tools: [codeSearchTool],
    },
    {
      id: 'security',
      name: 'Security Agent',
      description: 'Performs security audits',
      capabilities: { skills: ['security', 'vulnerability-scanning'], tools: [], available: true },
      model: llm,
      tools: [securityScanTool],
    },
  ],
  aggregator: { model: llm },
});

// Query that triggers parallel routing
const result = await system.invoke({
  input: 'Are there any security vulnerabilities in our authentication module?',
});

// The supervisor routes to BOTH code and security agents in parallel
// Both agents execute simultaneously
// The aggregator combines their results into a comprehensive response
```

#### Schema Support

The `RoutingDecisionSchema` supports both single and parallel routing:

```typescript
{
  targetAgent: string | null,      // For single agent routing
  targetAgents: string[] | null,   // For parallel agent routing (NEW)
  reasoning: string,
  confidence: number,
  strategy: string,
  timestamp: number,
}
```

**Validation**: Either `targetAgent` OR `targetAgents` must be provided (not both).

#### Benefits of Parallel Routing

1. **Comprehensive Answers**: Combine insights from multiple specialists
2. **Faster Execution**: Agents run simultaneously instead of sequentially
3. **Better Coverage**: Get both code-level and conceptual perspectives
4. **Intelligent Aggregation**: LLM combines results into coherent response

#### Example Output

```
Query: "Are there security vulnerabilities in our auth module?"

[Supervisor] Routing to 2 agents in parallel [code, security]

[Worker:code] Analyzing codebase...
[Worker:security] Running security scan...

[Aggregator] Combining results from 2 workers...

Response: "Security assessment combining code analysis and vulnerability scan:
- Code Agent found: Weak password hashing (MD5), missing rate limiting
- Security Agent found: No MFA support, session tokens don't expire
- Recommendations: Upgrade to bcrypt, add rate limiting, implement MFA..."
```

#### When to Use Parallel Routing

✅ **Use parallel routing when:**
- Query needs multiple perspectives (code + docs, legal + HR)
- Different data sources should be consulted (codebase + documentation)
- Comprehensive analysis requires multiple specialists
- Speed matters (parallel > sequential)

❌ **Don't use parallel routing when:**
- Query clearly maps to single specialist
- Workers would duplicate work
- Results need to be processed sequentially
- Resource constraints limit parallelism

### 2. Skill-Based Routing

Matches task requirements to worker capabilities.

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    model: llm,
    strategy: 'skill-based',
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
    model: llm,
    strategy: 'round-robin',
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
    strategy: 'rule-based',
    routingFn: async (state) => {
      if (state.input.includes('technical')) {
        return { targetAgent: 'tech_support', reasoning: 'Technical query detected' };
      }
      if (state.input.includes('billing')) {
        return { targetAgent: 'billing_support', reasoning: 'Billing query detected' };
      }
      return { targetAgent: 'general_support', reasoning: 'Default routing' };
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
    model: llm,
    strategy: 'load-balanced',
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
  registerWorkers(workers: Array<{
    name: string;
    description?: string;
    capabilities: string[];
    tools?: any[];
    systemPrompt?: string;
    model?: any;
  }>): this;
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
}

interface AggregatorConfig {
  model: BaseChatModel;
  systemPrompt?: string;
}
```

**Methods**:

#### registerWorkers(workers: RegisterWorkerInput[])

Registers workers with the system. Must be called before `build()`. The builder converts the simplified input format to the internal `WorkerConfig` format.

```typescript
interface RegisterWorkerInput {
  name: string;                    // Worker identifier (becomes 'id' internally)
  description?: string;            // Optional description
  capabilities: string[];          // Array of skill names (converted to WorkerCapabilities)
  tools?: Tool[];                  // Optional tools array
  systemPrompt?: string;           // Optional system prompt
  model?: BaseChatModel;           // Optional model (uses supervisor model if not provided)
}

// Internal WorkerConfig (for reference)
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
    name: 'worker1',
    description: 'First worker',
    capabilities: ['skill1'],
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
    strategy: RoutingStrategy;
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
    strategy: 'skill-based',
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
  strategy: RoutingStrategy;
  systemPrompt?: string;
}
```

**Example**:

```typescript
const supervisor = createSupervisorNode({
  model: new ChatOpenAI({ modelName: 'gpt-4' }),
  strategy: 'llm-based',
  systemPrompt: 'Route tasks to appropriate specialists',
});
```

### createWorkerNode()

Creates a worker node for custom workflows.

```typescript
function createWorkerNode(config: WorkerConfig): NodeFunction
```

**Parameters**:

```typescript
interface WorkerConfig {
  id: string;
  capabilities: WorkerCapabilities;
  model?: BaseChatModel;
  tools?: Tool[];
  systemPrompt?: string;
}

interface WorkerCapabilities {
  skills: string[];
  tools: string[];
  available: boolean;
  currentWorkload?: number;
}
```

**Example**:

```typescript
const worker = createWorkerNode({
  id: 'specialist',
  capabilities: {
    skills: ['analysis', 'processing'],
    tools: ['tool1', 'tool2'],
    available: true,
  },
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
    name: 'math_expert',
    description: 'Solves mathematical problems',
    capabilities: ['mathematics', 'calculations', 'arithmetic'],
    model: llm,    tools: [calculatorTool],
  },
  {
    name: 'weather_expert',
    description: 'Provides weather information',
    capabilities: ['weather', 'forecasts', 'meteorology'],
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
      capabilities: {
        skills: ['technical', 'troubleshooting', 'debugging'],
        tools: ['diagnostic', 'troubleshoot'],
        available: true,
      },
      model: llm,      tools: [diagnosticTool, troubleshootTool],
    },
    {
      id: 'billing_support',
      capabilities: {
        skills: ['billing', 'payments', 'refunds'],
        tools: ['account_check', 'refund_process'],
        available: true,
      },
      model: llm,      tools: [checkAccountTool, processRefundTool],
    },
    {
      id: 'general_support',
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
    name: 'data_collector',
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

const system = builder.build();

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
  model: llm,
  strategy: 'rule-based',
  routingFn: async (state) => {
    if (state.iteration === 0) {
      return { targetAgent: 'validator', reasoning: 'First iteration - validate input' };
    }
    if (state.iteration === 1) {
      return { targetAgent: 'processor', reasoning: 'Second iteration - process data' };
    }
    return { targetAgent: '__end__', reasoning: 'Complete' };
  },
});

const validator = createWorkerNode({
  id: 'validator',
  capabilities: {
    skills: ['validation'],
    tools: ['validateTool'],
    available: true,
    currentWorkload: 0,
  },
  tools: [validateTool],
});

const processor = createWorkerNode({
  id: 'processor',
  capabilities: {
    skills: ['processing'],
    tools: ['processTool'],
    available: true,
    currentWorkload: 0,
  },
  tools: [processTool],
});

const aggregator = createAggregatorNode({ model: llm });

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
  id: 'specialist',
  capabilities: {
    skills: ['specialized_task'],
    tools: ['tool'],
    available: true,
  },
  tools: [tool],
  systemPrompt: 'Handle errors gracefully and provide fallback responses',
});

// Check results
if (result.completedTasks.some(t => !t.success)) {
  console.error('Some tasks failed');
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
const system = createMultiAgentSystem({
  supervisor: {
    strategy: 'rule-based',
    routingFn: async (state) => {
      // Custom logic
      if (state.input.length > 100) {
        return { targetAgent: 'detailed_worker', reasoning: 'Long input requires detailed analysis' };
      }
      if (state.iteration > 5) {
        return { targetAgent: 'fallback_worker', reasoning: 'Too many iterations, using fallback' };
      }
      return { targetAgent: 'default_worker', reasoning: 'Standard routing' };
    },
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
// Maintain a separate priority registry
const workerPriorities: Record<string, number> = {
  'high_priority_worker': 10,
  'medium_priority_worker': 5,
  'low_priority_worker': 1,
};

const system = createMultiAgentSystem({
  supervisor: {
    strategy: 'rule-based',
    routingFn: async (state) => {
      const availableWorkers = Object.entries(state.workers)
        .filter(([_, caps]) => caps.available)
        .map(([id]) => ({ id, priority: workerPriorities[id] || 0 }))
        .sort((a, b) => b.priority - a.priority);

      return {
        targetAgent: availableWorkers[0].id,
        reasoning: `Highest priority worker (priority: ${availableWorkers[0].priority})`
      };
    },
  },
  // ...
});
```

### Result Caching

Cache worker results for efficiency:

```typescript
const cache = new Map<string, TaskResult>();

const cachedWorkerNode = async (state: MultiAgentStateType) => {
  const currentAssignment = state.activeAssignments[0];
  const cacheKey = `${currentAssignment?.taskId}`;

  if (cache.has(cacheKey)) {
    console.log('[Cache] Hit');
    return { completedTasks: [cache.get(cacheKey)!] };
  }

  const result = await workerNode(state);
  if (result.completedTasks && result.completedTasks.length > 0) {
    cache.set(cacheKey, result.completedTasks[0]);
  }
  return result;
};
```

### Conditional Aggregation

Aggregate only when conditions are met:

```typescript
const conditionalAggregator = async (state: MultiAgentStateType) => {
  const allCompleted = state.completedTasks?.every(t => t.success);
  const hasMinResults = (state.completedTasks?.length ?? 0) >= 3;

  if (!allCompleted || !hasMinResults) {
    return { status: 'routing' }; // Continue routing
  }

  return await aggregatorNode(state);
};
```

### Worker Health Monitoring

Monitor worker health and route accordingly:

```typescript
// Maintain a separate health registry
const workerHealth: Record<string, { health: 'healthy' | 'degraded' | 'unhealthy'; errorRate: number }> = {
  'worker1': { health: 'healthy', errorRate: 0.01 },
  'worker2': { health: 'healthy', errorRate: 0.05 },
  'worker3': { health: 'degraded', errorRate: 0.15 },
};

const system = createMultiAgentSystem({
  supervisor: {
    strategy: 'rule-based',
    routingFn: async (state) => {
      const availableWorkers = Object.entries(state.workers)
        .filter(([id, caps]) => caps.available && workerHealth[id]?.health === 'healthy')
        .map(([id]) => ({ id, errorRate: workerHealth[id].errorRate }))
        .sort((a, b) => a.errorRate - b.errorRate);

      if (availableWorkers.length === 0) {
        throw new Error('No healthy workers available');
      }

      return {
        targetAgent: availableWorkers[0].id,
        reasoning: `Healthiest worker (error rate: ${availableWorkers[0].errorRate})`
      };
    },
  },
  // ...
});
```

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
    model: llm,
    strategy: 'skill-based',
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
    model: llm,
    strategy: 'llm-based',
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
    model: llm,
    strategy: 'skill-based', // Faster than LLM-based
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
  invoke: async (input: any) => {
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

#### Structured Logging

The Multi-Agent pattern uses AgentForge's structured logging system with dedicated loggers:

- `agentforge:patterns:multi-agent:nodes` - Node execution (supervisor, worker, aggregator)
- `agentforge:patterns:multi-agent:routing` - Routing decisions

#### Enable Debug Logging

```bash
# See everything (most verbose)
LOG_LEVEL=debug npm start

# See important events only (recommended for production)
LOG_LEVEL=info npm start
```

#### Example Debug Output

```
[2026-01-24T10:15:33.163Z] [DEBUG] [agentforge:patterns:multi-agent:nodes] Supervisor node executing data={"iteration":1}
[2026-01-24T10:15:33.164Z] [INFO] [agentforge:patterns:multi-agent:routing] Routing decision data={"selectedWorker":"research_agent","reason":"..."}
[2026-01-24T10:15:33.165Z] [DEBUG] [agentforge:patterns:multi-agent:nodes] Worker node executing data={"worker":"research_agent"}
[2026-01-24T10:15:33.166Z] [INFO] [agentforge:patterns:multi-agent:nodes] Worker complete data={"worker":"research_agent","duration":234}
[2026-01-24T10:15:33.167Z] [DEBUG] [agentforge:patterns:multi-agent:nodes] Aggregator node executing
[2026-01-24T10:15:33.168Z] [INFO] [agentforge:patterns:multi-agent:nodes] Aggregation complete data={"resultCount":3,"duration":89}
```

#### Common Debugging Scenarios

**Workers Not Being Called:**
```bash
LOG_LEVEL=debug npm start
```

Look for routing decisions:
```
[INFO] [agentforge:patterns:multi-agent:routing] Routing decision data={"selectedWorker":"none"}
```

If no worker is selected, check supervisor routing logic.

**Slow Performance:**
```bash
LOG_LEVEL=info npm start
```

Check `duration` fields:
```
[INFO] [agentforge:patterns:multi-agent:nodes] Worker complete data={"duration":5234}
```

If duration > 2000ms, investigate which workers are slow.

**Aggregation Issues:**
```bash
LOG_LEVEL=debug npm start
```

Look for aggregation logs:
```
[INFO] [agentforge:patterns:multi-agent:nodes] Aggregation complete data={"resultCount":0}
```

If `resultCount` is 0, check if workers are producing results.

#### Inspect Worker Results

```typescript
const result = await system.invoke({ input: 'task' });

console.log('Completed Tasks:', result.completedTasks);
console.log('Final Response:', result.response);
console.log('Status:', result.status);
```

#### Test Individual Components

```typescript
// Test supervisor alone
const supervisorResult = await supervisorNode(testState);

// Test worker alone
const workerResult = await workerNode(testState);

// Test aggregator alone
const aggregatorResult = await aggregatorNode(testState);
```

For more debugging techniques, see the [Debugging Guide](../../../docs/DEBUGGING_GUIDE.md).

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

