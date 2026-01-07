# Multi-Agent System Example

A multi-agent system where specialized agents work together to accomplish complex tasks.

## Overview

The Multi-Agent pattern:
1. **Coordinator** - Routes tasks to appropriate agents
2. **Specialized Agents** - Each handles specific tasks
3. **Communication** - Agents share information
4. **Aggregation** - Combine results

## Complete Example

```typescript
import { 
  createMultiAgentSystem,
  createReActAgent,
  createReflectionAgent 
} from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import { webSearch, calculator, fileWriter } from '@agentforge/tools';

// Create specialized agents
const researchAgent = createReActAgent({
  llm: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [webSearch],
  systemPrompt: 'You are a research specialist. Find accurate information.'
});

const analysisAgent = createReActAgent({
  llm: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [calculator],
  systemPrompt: 'You are a data analyst. Analyze and interpret data.'
});

const writerAgent = createReflectionAgent({
  llm: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [fileWriter],
  systemPrompt: 'You are a professional writer. Create clear, engaging content.',
  maxReflections: 2
});

// Create multi-agent system
const system = createMultiAgentSystem({
  agents: {
    researcher: researchAgent,
    analyst: analysisAgent,
    writer: writerAgent
  },
  
  coordinator: new ChatOpenAI({ model: 'gpt-4' }),
  
  workflow: 'sequential', // or 'parallel' or 'custom'
  
  maxRounds: 5
});

// Use the system
const result = await system.invoke({
  messages: [{
    role: 'user',
    content: 'Create a market analysis report for AI startups in 2024'
  }]
});

console.log('Final Report:', result.messages[result.messages.length - 1].content);
```

## Output Example

```
🎯 Coordinator: Routing to researcher agent...

🔍 Researcher: Searching for AI startup data...
✅ Found: 150+ AI startups, $50B funding, key trends

🎯 Coordinator: Routing to analyst agent...

📊 Analyst: Analyzing market data...
✅ Growth rate: 45% YoY, Top sectors: Healthcare, Finance

🎯 Coordinator: Routing to writer agent...

✍️ Writer: Creating report (Draft 1)...
🤔 Writer: Reflecting on draft...
✍️ Writer: Creating improved version...
✅ Final report complete

📄 Final Report: [Comprehensive market analysis with data and insights]
```

## Parallel Workflow

```typescript
const system = createMultiAgentSystem({
  agents: {
    researcher1: researchAgent,
    researcher2: researchAgent,
    researcher3: researchAgent
  },
  coordinator: new ChatOpenAI({ model: 'gpt-4' }),
  workflow: 'parallel' // Execute in parallel
});

// All agents work simultaneously
const result = await system.invoke({
  messages: [{
    role: 'user',
    content: 'Research AI, blockchain, and quantum computing trends'
  }]
});
```

## Custom Workflow

```typescript
const system = createMultiAgentSystem({
  agents: {
    researcher: researchAgent,
    analyst: analysisAgent,
    writer: writerAgent
  },
  coordinator: new ChatOpenAI({ model: 'gpt-4' }),
  workflow: 'custom',
  
  // Define custom workflow
  workflowGraph: (builder) => {
    builder
      .addNode('research', 'researcher')
      .addNode('analyze', 'analyst')
      .addNode('write', 'writer')
      .addEdge('research', 'analyze')
      .addEdge('analyze', 'write')
      .addConditionalEdge('write', (state) => {
        // Rerun research if quality is low
        return state.quality > 0.8 ? 'end' : 'research';
      });
  }
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

