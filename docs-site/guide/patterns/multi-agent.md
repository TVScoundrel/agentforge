# Multi-Agent Pattern

The **Multi-Agent** pattern enables multiple specialized agents to collaborate on complex tasks. Each agent has specific expertise and responsibilities, working together through coordination strategies like routing, delegation, or consensus.

## Overview

Multi-agent systems consist of:

1. **Specialized Agents** - Each agent has a specific role or expertise
2. **Coordination Strategy** - How agents communicate and collaborate
3. **Router/Supervisor** - Directs tasks to appropriate agents
4. **Shared State** - Common context and memory

This pattern is inspired by organizational structures and the [AutoGen framework](https://github.com/microsoft/autogen).

## When to Use Multi-Agent

✅ **Good for:**
- Complex tasks requiring diverse expertise
- Tasks with distinct subtasks or domains
- When specialization improves quality
- Collaborative problem-solving
- Scalable, modular systems

❌ **Not ideal for:**
- Simple, single-domain tasks
- When coordination overhead exceeds benefits
- Real-time applications (adds latency)
- When a single agent is sufficient

## Basic Usage

```typescript
import { createMultiAgentSystem } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

const system = createMultiAgentSystem({
  agents: {
    researcher: {
      llm: new ChatOpenAI({ model: 'gpt-4' }),
      tools: [webSearch, wikipediaSearch],
      systemMessage: 'You are a research specialist. Find accurate information.'
    },
    analyst: {
      llm: new ChatOpenAI({ model: 'gpt-4' }),
      tools: [calculator, dataAnalysis],
      systemMessage: 'You are a data analyst. Analyze and interpret data.'
    },
    writer: {
      llm: new ChatOpenAI({ model: 'gpt-4' }),
      tools: [fileWrite],
      systemMessage: 'You are a technical writer. Create clear, structured reports.'
    }
  },
  
  // Coordination strategy
  strategy: 'supervisor',  // supervisor, sequential, or consensus
  
  // Supervisor configuration
  supervisor: {
    llm: new ChatOpenAI({ model: 'gpt-4' }),
    systemMessage: 'Route tasks to the most appropriate agent.'
  }
});

const result = await system.invoke({
  messages: [{
    role: 'user',
    content: 'Research AI trends in 2026, analyze the data, and create a report.'
  }]
});
```

## Coordination Strategies

### 1. Supervisor Pattern

A supervisor agent routes tasks to specialized workers:

```typescript
const system = createMultiAgentSystem({
  agents: {
    coder: { llm, tools: [codeExecutor], role: 'Write code' },
    tester: { llm, tools: [testRunner], role: 'Test code' },
    reviewer: { llm, tools: [], role: 'Review code quality' }
  },
  
  strategy: 'supervisor',
  supervisor: {
    llm: new ChatOpenAI({ model: 'gpt-4' }),
    systemMessage: `You are a project manager.
    
Route tasks to agents:
- coder: For writing code
- tester: For running tests
- reviewer: For code review

Coordinate their work to complete the task.`
  }
});
```

### 2. Sequential Pattern

Agents work in a defined sequence:

```typescript
const system = createMultiAgentSystem({
  agents: {
    planner: { llm, role: 'Create plan' },
    executor: { llm, tools: [webSearch, calculator], role: 'Execute plan' },
    validator: { llm, role: 'Validate results' }
  },
  
  strategy: 'sequential',
  sequence: ['planner', 'executor', 'validator']
});
```

### 3. Consensus Pattern

Agents collaborate to reach agreement:

```typescript
const system = createMultiAgentSystem({
  agents: {
    expert1: { llm, role: 'Domain expert 1' },
    expert2: { llm, role: 'Domain expert 2' },
    expert3: { llm, role: 'Domain expert 3' }
  },
  
  strategy: 'consensus',
  consensusConfig: {
    minAgreement: 0.7,  // 70% agreement required
    maxRounds: 3,  // Max discussion rounds
    votingMethod: 'majority'  // or 'unanimous', 'weighted'
  }
});
```

### 4. Hierarchical Pattern

Multi-level agent organization:

```typescript
const system = createMultiAgentSystem({
  agents: {
    // Top level
    ceo: {
      llm,
      role: 'Strategic decisions',
      subordinates: ['manager1', 'manager2']
    },
    
    // Middle level
    manager1: {
      llm,
      role: 'Manage team 1',
      subordinates: ['worker1', 'worker2']
    },
    manager2: {
      llm,
      role: 'Manage team 2',
      subordinates: ['worker3', 'worker4']
    },
    
    // Workers
    worker1: { llm, tools: [tool1], role: 'Specialist 1' },
    worker2: { llm, tools: [tool2], role: 'Specialist 2' },
    worker3: { llm, tools: [tool3], role: 'Specialist 3' },
    worker4: { llm, tools: [tool4], role: 'Specialist 4' }
  },
  
  strategy: 'hierarchical'
});
```

## Configuration Options

### Core Options

```typescript
interface MultiAgentConfig {
  // Required
  agents: Record<string, AgentConfig>;  // Agent definitions
  strategy: CoordinationStrategy;       // How agents collaborate
  
  // Optional
  supervisor?: SupervisorConfig;        // For supervisor strategy
  sequence?: string[];                  // For sequential strategy
  consensusConfig?: ConsensusConfig;    // For consensus strategy
  sharedMemory?: boolean;               // Share context between agents
  maxRounds?: number;                   // Max coordination rounds
}
```

### Advanced Configuration

```typescript
const system = createMultiAgentSystem({
  agents: {
    researcher: { llm, tools: [webSearch] },
    analyst: { llm, tools: [calculator] },
    writer: { llm, tools: [fileWrite] }
  },
  
  strategy: 'supervisor',
  
  // Shared memory across agents
  sharedMemory: true,
  memoryConfig: {
    type: 'redis',
    ttl: 3600
  },
  
  // Communication protocol
  communication: {
    format: 'structured',  // or 'natural'
    includeContext: true,
    maxMessageLength: 1000
  },
  
  // Performance settings
  maxRounds: 10,
  timeout: 300000,  // 5 minutes
  parallelExecution: true
});
```

## Agent Builder

Use the fluent builder API for complex agent definitions:

```typescript
import { agentBuilder } from '@agentforge/patterns';

const researchAgent = agentBuilder()
  .name('researcher')
  .role('Research Specialist')
  .llm(new ChatOpenAI({ model: 'gpt-4' }))
  .tools([webSearch, wikipediaSearch, arxivSearch])
  .systemMessage(`You are an expert researcher.

Your responsibilities:
- Find accurate, up-to-date information
- Cite all sources
- Verify facts from multiple sources
- Summarize findings clearly`)
  .memory({ type: 'buffer', maxMessages: 20 })
  .build();

const system = createMultiAgentSystem({
  agents: {
    researcher: researchAgent,
    analyst: analystAgent,
    writer: writerAgent
  },
  strategy: 'supervisor'
});
```

## Streaming

Monitor multi-agent collaboration in real-time:

```typescript
const stream = await system.stream({
  messages: [{ role: 'user', content: 'Complex task' }]
});

for await (const chunk of stream) {
  if (chunk.supervisor) {
    console.log('Supervisor:', chunk.supervisor.decision);
  }
  if (chunk.agent) {
    console.log(`Agent ${chunk.agent.name}:`, chunk.agent.message);
  }
  if (chunk.handoff) {
    console.log(`Handoff: ${chunk.handoff.from} -> ${chunk.handoff.to}`);
  }
}
```

## Best Practices

### 1. Clear Agent Roles

Define specific, non-overlapping responsibilities:

```typescript
const system = createMultiAgentSystem({
  agents: {
    // ✅ Clear, specific roles
    dataCollector: {
      llm,
      tools: [apiCall, webScrape],
      role: 'Collect data from external sources'
    },
    dataProcessor: {
      llm,
      tools: [dataTransform, calculator],
      role: 'Clean and transform data'
    },
    dataAnalyst: {
      llm,
      tools: [statisticalAnalysis, chartGenerate],
      role: 'Analyze data and create visualizations'
    }
  },
  strategy: 'sequential'
});
```

### 2. Limit Agent Count

Too many agents increases coordination overhead:

```typescript
// ✅ Good: 3-5 specialized agents
const system = createMultiAgentSystem({
  agents: {
    researcher: { ... },
    analyst: { ... },
    writer: { ... }
  }
});

// ❌ Avoid: Too many agents
const system = createMultiAgentSystem({
  agents: {
    agent1: { ... },
    agent2: { ... },
    // ... 15 more agents
  }
});
```

### 3. Use Shared Memory Wisely

```typescript
const system = createMultiAgentSystem({
  agents: { ... },

  // Share context that all agents need
  sharedMemory: true,
  sharedContext: {
    projectGoals: '...',
    constraints: '...',
    previousDecisions: []
  }
});
```

### 4. Set Timeouts and Limits

```typescript
const system = createMultiAgentSystem({
  agents: { ... },
  maxRounds: 10,  // Prevent infinite loops
  timeout: 300000,  // 5 minute timeout
  maxMessagesPerAgent: 50  // Limit verbosity
});
```

## Common Patterns

### Software Development Team

```typescript
const devTeam = createMultiAgentSystem({
  agents: {
    productManager: {
      llm,
      role: 'Define requirements and priorities',
      tools: []
    },
    developer: {
      llm,
      role: 'Write code',
      tools: [codeExecutor, fileWrite]
    },
    tester: {
      llm,
      role: 'Write and run tests',
      tools: [testRunner, coverageAnalyzer]
    },
    reviewer: {
      llm,
      role: 'Review code quality',
      tools: [linter, securityScanner]
    }
  },

  strategy: 'supervisor',
  supervisor: {
    llm,
    systemMessage: 'Coordinate the development team to build high-quality software.'
  }
});
```

### Research Team

```typescript
const researchTeam = createMultiAgentSystem({
  agents: {
    literatureReviewer: {
      llm,
      tools: [arxivSearch, googleScholar],
      role: 'Find and review academic papers'
    },
    dataCollector: {
      llm,
      tools: [apiCall, webScrape],
      role: 'Gather experimental data'
    },
    statistician: {
      llm,
      tools: [statisticalAnalysis, rScript],
      role: 'Perform statistical analysis'
    },
    writer: {
      llm,
      tools: [latexCompiler, fileWrite],
      role: 'Write research paper'
    }
  },

  strategy: 'sequential',
  sequence: ['literatureReviewer', 'dataCollector', 'statistician', 'writer']
});
```

### Customer Service Team

```typescript
const supportTeam = createMultiAgentSystem({
  agents: {
    triageAgent: {
      llm,
      tools: [ticketClassifier],
      role: 'Classify and prioritize tickets'
    },
    technicalSupport: {
      llm,
      tools: [knowledgeBase, diagnosticTools],
      role: 'Resolve technical issues'
    },
    billingSupport: {
      llm,
      tools: [billingSystem, paymentProcessor],
      role: 'Handle billing inquiries'
    },
    escalationAgent: {
      llm,
      tools: [emailSend, slackNotify],
      role: 'Escalate complex issues'
    }
  },

  strategy: 'supervisor',
  supervisor: {
    llm,
    systemMessage: 'Route customer inquiries to the appropriate support agent.'
  }
});
```

## Debugging

### Visualize Agent Communication

```typescript
const result = await system.invoke(input, {
  returnCommunicationLog: true
});

console.log('Communication Log:');
result.communicationLog.forEach((msg, i) => {
  console.log(`${i + 1}. ${msg.from} -> ${msg.to}: ${msg.content}`);
});
```

### Track Agent Performance

```typescript
const result = await system.invoke(input, {
  trackMetrics: true
});

console.log('Agent Metrics:');
Object.entries(result.metrics).forEach(([agent, metrics]) => {
  console.log(`${agent}:`);
  console.log('  Messages:', metrics.messageCount);
  console.log('  Tokens:', metrics.tokenUsage);
  console.log('  Duration:', metrics.duration);
  console.log('  Success Rate:', metrics.successRate);
});
```

### Generate Collaboration Diagram

```typescript
import { visualizeMultiAgentSystem } from '@agentforge/core';

const result = await system.invoke(input, {
  returnCommunicationLog: true
});

// Generate sequence diagram
const diagram = visualizeMultiAgentSystem(result);
console.log(diagram);
```

## Performance Optimization

### 1. Parallel Agent Execution

Execute independent agents in parallel:

```typescript
const system = createMultiAgentSystem({
  agents: { ... },
  parallelExecution: true,
  maxParallelAgents: 3
});
```

### 2. Agent Caching

Cache agent responses for similar inputs:

```typescript
import { withAgentCache } from '@agentforge/patterns';

const cachedSystem = withAgentCache(system, {
  ttl: 3600,
  cacheKey: (input) => input.messages[0].content
});
```

### 3. Lazy Agent Loading

Only initialize agents when needed:

```typescript
const system = createMultiAgentSystem({
  agents: {
    researcher: { llm, tools: [webSearch], lazy: true },
    analyst: { llm, tools: [calculator], lazy: true },
    writer: { llm, tools: [fileWrite], lazy: true }
  },
  lazyLoading: true
});
```

## Comparison with Single-Agent Patterns

| Feature | Multi-Agent | Single Agent |
|---------|------------|--------------|
| Complexity | High | Low |
| Specialization | High (per agent) | Medium |
| Coordination | Required | Not needed |
| Scalability | High (add agents) | Limited |
| Latency | Higher (coordination) | Lower |
| Token usage | Higher | Lower |
| Best for | Complex, multi-domain | Simple, single-domain |

## Advanced: Agent Communication Protocols

### Structured Messages

```typescript
const system = createMultiAgentSystem({
  agents: { ... },
  communicationProtocol: {
    format: 'structured',
    schema: z.object({
      from: z.string(),
      to: z.string(),
      type: z.enum(['request', 'response', 'notification']),
      content: z.string(),
      metadata: z.object({
        priority: z.enum(['low', 'medium', 'high']),
        requiresResponse: z.boolean()
      })
    })
  }
});
```

### Message Routing

```typescript
const system = createMultiAgentSystem({
  agents: { ... },
  messageRouter: {
    rules: [
      {
        condition: (msg) => msg.content.includes('urgent'),
        route: 'escalationAgent'
      },
      {
        condition: (msg) => msg.type === 'technical',
        route: 'technicalSupport'
      }
    ],
    defaultRoute: 'triageAgent'
  }
});
```

## Next Steps

- [ReAct Pattern](/guide/patterns/react) - For single-agent tool usage
- [Plan-Execute Pattern](/guide/patterns/plan-execute) - For structured workflows
- [Reflection Pattern](/guide/patterns/reflection) - For self-improving agents
- [API Reference](/api/patterns#multi-agent) - Complete API documentation

## Further Reading

- [AutoGen Paper](https://arxiv.org/abs/2308.08155) - Microsoft's multi-agent framework
- [MetaGPT Paper](https://arxiv.org/abs/2308.00352) - Multi-agent collaboration
- [Examples](/examples/multi-agent) - Working code examples


