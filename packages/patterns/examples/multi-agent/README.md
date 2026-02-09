# Multi-Agent Coordination Pattern Examples

This directory contains comprehensive examples demonstrating the Multi-Agent Coordination pattern implementation in `@agentforge/patterns`.

## What is the Multi-Agent Coordination Pattern?

The Multi-Agent Coordination pattern enables multiple specialized agents to work together on complex tasks:
1. **Supervisor** - Routes tasks to appropriate workers
2. **Workers** - Execute specialized tasks
3. **Aggregator** - Combines results from multiple workers
4. **Routing** - Intelligent task distribution

This pattern is particularly useful when you have distinct specialized capabilities and need coordinated execution.

## Examples Overview

### 01-basic-coordination.ts
**Basic multi-agent coordination**

Demonstrates:
- Creating a multi-agent system
- Registering specialized workers
- Round-robin task routing
- Basic coordination workflow

**Use case**: Simple task distribution across specialized agents

```bash
npx tsx packages/patterns/examples/multi-agent/01-basic-coordination.ts
```

### 02-research-team.ts
**Research team with specialized workers**

Demonstrates:
- Data Collector agent for information gathering
- Analyst agent for data analysis
- Writer agent for report generation
- Skill-based routing
- Multi-step research workflow

**Use case**: Complex research tasks requiring multiple specialists

```bash
npx tsx packages/patterns/examples/multi-agent/02-research-team.ts
```

### 03-customer-support.ts
**Customer support with intelligent routing**

Demonstrates:
- Technical Support agent
- Billing Support agent
- General Support agent
- LLM-based intelligent routing
- Context-aware task assignment

**Use case**: Customer service automation with specialized support teams

```bash
npx tsx packages/patterns/examples/multi-agent/03-customer-support.ts
```

### 04-custom-workflow.ts
**Custom multi-agent workflow**

Demonstrates:
- Building custom workflows with individual nodes
- Rule-based routing logic
- Custom quality check nodes
- Manual workflow construction
- Fine-grained control over coordination

**Use case**: Complex workflows requiring custom coordination logic

```bash
npx tsx packages/patterns/examples/multi-agent/04-custom-workflow.ts
```

### 05-supervisor-with-askhuman.ts
**Tool-enabled supervisor with askHuman**

Demonstrates:
- Supervisor using tools during routing decisions
- askHuman tool for gathering clarification
- Handling ambiguous user requests
- Tool call retry logic
- Smart routing based on clarified intent

**Use case**: Interactive systems where user intent may be unclear

```bash
npx tsx packages/patterns/examples/multi-agent/05-supervisor-with-askhuman.ts
```

## Pattern Overview

### Basic Usage

```typescript
import { MultiAgentSystemBuilder } from '@agentforge/patterns';

// Create the builder
const builder = new MultiAgentSystemBuilder({
  supervisor: {
    model: ChatOpenAI,
    strategy: 'skill-based',
  },
  aggregator: {
    model: ChatOpenAI,
  },
});

// Register workers
builder.registerWorkers([
  {
    name: 'specialist1',
    capabilities: ['skill1', 'skill2'],
    tools: [tool1, tool2],
  },
  {
    name: 'specialist2',
    capabilities: ['skill3', 'skill4'],
    tools: [tool3, tool4],
  },
]);

// Build the system
const system = builder.build();

// Execute
const result = await system.invoke({ input: 'task description' });
```

### Routing Strategies

#### 1. LLM-Based Routing
```typescript
routingStrategy: 'llm-based'
```
- Uses LLM to analyze task and select best worker
- Most flexible and intelligent
- Best for complex, varied tasks

#### 2. Skill-Based Routing
```typescript
routingStrategy: 'skill-based'
```
- Matches task requirements to worker capabilities
- Efficient and predictable
- Best for well-defined capabilities

#### 3. Round-Robin Routing
```typescript
routingStrategy: 'round-robin'
```
- Distributes tasks evenly across workers
- Simple load balancing
- Best for similar workers

#### 4. Rule-Based Routing
```typescript
routingStrategy: {
  type: 'rule-based',
  rules: [
    { condition: (state) => ..., workerId: 'worker1' },
  ],
}
```
- Custom routing logic
- Deterministic routing
- Best for specific business rules

#### 5. Load-Balanced Routing
```typescript
routingStrategy: 'load-balanced'
```
- Routes to least busy worker
- Optimizes resource utilization
- Best for high-throughput scenarios

### Configuration Options

#### Basic Configuration
```typescript
const system = createMultiAgentSystem({
  supervisor: {
    model: ChatOpenAI,              // LLM for routing decisions
    routingStrategy: 'skill-based', // Routing strategy
    systemPrompt: string,          // Custom supervisor prompt
  },
  workers: WorkerConfig[],        // Worker configurations
  aggregator: {
    model: ChatOpenAI,              // LLM for aggregation
    systemPrompt: string,          // Custom aggregator prompt
  },
  maxIterations: 10,              // Max coordination iterations
  verbose: true,                  // Enable logging
});
```

#### Worker Configuration
```typescript
{
  name: string,                   // Unique worker identifier
  description: string,            // Worker description
  capabilities: string[],         // Worker capabilities/skills
  tools: Tool[],                  // Available tools
  systemPrompt: string,           // Worker-specific prompt
}
```

#### Tool-Enabled Supervisor (Advanced)
```typescript
const system = createMultiAgentSystem({
  supervisor: {
    model: ChatOpenAI,
    strategy: 'llm-based',
    tools: [askHumanTool],        // Tools supervisor can use
    maxToolRetries: 3,             // Max tool calls before routing
    systemPrompt: string,
  },
  workers: [...],
});
```

The supervisor can use tools (like `askHuman`) to gather additional information before making routing decisions. This is useful for:
- Clarifying ambiguous user requests
- Fetching context needed for routing
- Validating information before routing

See example `05-supervisor-with-askhuman.ts` for a complete demonstration.

## When to Use This Pattern

### ✅ Good Use Cases
- Tasks requiring multiple specialized skills
- Customer support with different departments
- Research tasks with distinct phases
- Data processing pipelines
- Complex workflows with parallel execution

### ❌ Not Ideal For
- Simple single-agent tasks
- Tasks requiring deep sequential reasoning
- When all workers have identical capabilities
- Real-time latency-critical applications

## Comparison with Other Patterns

| Pattern | Best For | Coordination | Complexity |
|---------|----------|--------------|------------|
| **Multi-Agent** | Specialized tasks | High | High |
| ReAct | Tool-based reasoning | None | Low |
| Plan-Execute | Structured planning | Medium | Medium |
| Reflection | Quality improvement | None | Medium |

## Tips and Best Practices

1. **Define Clear Capabilities**: Give each worker distinct, well-defined capabilities
2. **Choose Appropriate Routing**: Match routing strategy to your use case
3. **Monitor Performance**: Use verbose mode to understand routing decisions
4. **Handle Failures**: Implement error handling for worker failures
5. **Optimize Prompts**: Customize system prompts for better coordination
6. **Test Routing**: Verify routing logic with various inputs
7. **Balance Load**: Use load-balanced routing for high-throughput scenarios

## Next Steps

- Explore the [Multi-Agent Pattern Guide](../../docs/multi-agent-pattern.md)
- Check out the [Pattern Comparison Guide](../../docs/pattern-comparison.md)
- Review the [API Documentation](../../docs/README.md)

