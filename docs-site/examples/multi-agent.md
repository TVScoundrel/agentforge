# Multi-Agent System Example

A multi-agent system where specialized agents work together to accomplish complex tasks.

## Overview

The Multi-Agent pattern:
1. **Supervisor** - Routes tasks to appropriate workers
2. **Specialized Workers** - Each handles specific tasks
3. **Routing Strategy** - Determines task assignment
4. **Aggregation** - Combines results

## Complete Example

```typescript
import { MultiAgentSystemBuilder } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import { searchTool, calculatorTool, fileWriterTool } from '@agentforge/tools';

const llm = new ChatOpenAI({ model: 'gpt-4' });

// Create builder
const builder = new MultiAgentSystemBuilder({
  supervisor: {
    llm,
    strategy: 'skill-based',
  },
  aggregator: {
    llm,
    systemPrompt: 'Combine results into a comprehensive report',
  },
  maxIterations: 10,
});

// Register specialized workers
builder.registerWorkers([
  {
    id: 'researcher',
    name: 'Research Specialist',
    description: 'Conducts research and gathers information',
    capabilities: {
      skills: ['research', 'web_search', 'data_collection'],
      tools: ['search'],
      available: true,
    },
    llm,
    tools: [searchTool],
    systemPrompt: 'You are a research specialist. Find accurate information.',
  },
  {
    id: 'analyst',
    name: 'Data Analyst',
    description: 'Analyzes data and identifies patterns',
    capabilities: {
      skills: ['analysis', 'statistics', 'calculations'],
      tools: ['calculator'],
      available: true,
    },
    llm,
    tools: [calculatorTool],
    systemPrompt: 'You are a data analyst. Analyze and interpret data.',
  },
  {
    id: 'writer',
    name: 'Content Writer',
    description: 'Creates professional reports and documents',
    capabilities: {
      skills: ['writing', 'documentation', 'reporting'],
      tools: ['file_writer'],
      available: true,
    },
    llm,
    tools: [fileWriterTool],
    systemPrompt: 'You are a professional writer. Create clear, engaging content.',
  },
]);

// Build and use the system
const system = builder.build();

const result = await system.invoke({
  input: 'Create a market analysis report for AI startups in 2024',
});

console.log('Final Report:', result.response);
```

## Output Example

```
[Supervisor] Routing iteration 1/10
[Supervisor] Routing to researcher: Best skill match with score 3 (skills: research, web_search, data_collection)

[Worker: researcher] Executing task...
[Worker: researcher] Task completed

[Supervisor] Routing iteration 2/10
[Supervisor] Routing to analyst: Best skill match with score 2 (skills: analysis, statistics, calculations)

[Worker: analyst] Executing task...
[Worker: analyst] Task completed

[Supervisor] Routing iteration 3/10
[Supervisor] Routing to writer: Best skill match with score 2 (skills: writing, documentation, reporting)

[Worker: writer] Executing task...
[Worker: writer] Task completed

[Supervisor] All tasks completed, moving to aggregation
[Aggregator] Combining results from 3 workers

📄 Final Report: [Comprehensive market analysis with data and insights]
```

## Routing Strategies

### Skill-Based Routing

Routes tasks based on matching worker skills:

```typescript
const builder = new MultiAgentSystemBuilder({
  supervisor: {
    llm,
    strategy: 'skill-based', // Routes by matching skills
  },
  aggregator: { llm },
});
```

### Round-Robin Routing

Distributes tasks evenly across workers:

```typescript
const builder = new MultiAgentSystemBuilder({
  supervisor: {
    llm,
    strategy: 'round-robin', // Distributes evenly
  },
  aggregator: { llm },
});
```

### LLM-Based Routing

Let the LLM decide which worker to route to:

```typescript
const builder = new MultiAgentSystemBuilder({
  supervisor: {
    llm,
    strategy: 'llm-based', // LLM decides routing
    systemPrompt: 'Route tasks based on worker expertise and current workload',
  },
  aggregator: { llm },
});
```

## When to Use Multi-Agent

Best for:
- Complex workflows
- Specialized tasks
- Parallel processing
- Large-scale projects
- Team collaboration simulation

## Key Features

- ✅ **Specialization** - Each agent has expertise
- ✅ **Coordination** - Smart task routing
- ✅ **Scalability** - Add more agents easily
- ✅ **Flexibility** - Sequential, parallel, or custom workflows
- ✅ **Efficiency** - Parallel execution when possible

## Agent Communication

```typescript
// Agents can share context
const system = createMultiAgentSystem({
  agents: { researcher, analyst, writer },
  coordinator: new ChatOpenAI({ model: 'gpt-4' }),
  workflow: 'sequential',
  
  // Shared memory across agents
  sharedMemory: true,
  
  // Communication protocol
  communication: {
    format: 'structured',
    includeMetadata: true
  }
});
```

## Monitoring

```typescript
import { MetricsCollector } from '@agentforge/core/monitoring';

const metrics = new MetricsCollector();

const system = createMultiAgentSystem({
  agents: { researcher, analyst, writer },
  coordinator: new ChatOpenAI({ model: 'gpt-4' }),
  workflow: 'sequential',
  
  // Monitor agent performance
  onAgentComplete: (agentName, result, duration) => {
    metrics.histogram(`agent.${agentName}.duration`, duration);
    metrics.increment(`agent.${agentName}.invocations`);
  }
});
```

## Next Steps

- [Custom Patterns](/tutorials/advanced-patterns) - Create your own patterns
- [Production Deployment](/tutorials/production-deployment) - Deploy multi-agent systems

