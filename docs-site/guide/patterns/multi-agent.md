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
- Simple, single-domain tasks (use [ReAct](/guide/patterns/react) instead)
- When coordination overhead exceeds benefits (use [ReAct](/guide/patterns/react) or [Plan-Execute](/guide/patterns/plan-execute) instead)
- Real-time applications (adds latency) (use [ReAct](/guide/patterns/react) instead)
- When a single agent is sufficient (use [ReAct](/guide/patterns/react), [Plan-Execute](/guide/patterns/plan-execute), or [Reflection](/guide/patterns/reflection) instead)

::: tip Pattern Comparison
Not sure which pattern to use? See the [Agent Patterns Overview](/guide/concepts/patterns) for a detailed comparison of all patterns.
:::

## Basic Usage

```typescript
import { createMultiAgentSystem } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({ model: 'gpt-4' });

const system = createMultiAgentSystem({
  supervisor: {
    strategy: 'skill-based',  // or 'llm-based', 'round-robin', 'load-balanced', 'rule-based'
    model,
    systemPrompt: 'Route tasks to the most appropriate agent based on their skills.'
  },

  workers: [
    {
      id: 'researcher',
      capabilities: {
        skills: ['research', 'web-scraping', 'information-gathering'],
        tools: ['web_scraper', 'html_parser'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [webScraper, htmlParser],
      systemPrompt: 'You are a research specialist. Find accurate information.'
    },
    {
      id: 'analyst',
      capabilities: {
        skills: ['data-analysis', 'statistics', 'calculations'],
        tools: ['calculator', 'csv_parser'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [calculator, csvParser],
      systemPrompt: 'You are a data analyst. Analyze and interpret data.'
    },
    {
      id: 'writer',
      capabilities: {
        skills: ['writing', 'documentation', 'reporting'],
        tools: ['file_writer'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [fileWriter],
      systemPrompt: 'You are a technical writer. Create clear, structured reports.'
    }
  ],

  aggregator: {
    model,
    systemPrompt: 'Combine the results from all workers into a coherent final response.'
  },

  maxIterations: 10
});

const result = await system.invoke({
  input: 'Research AI trends in 2026, analyze the data, and create a report.'
});
```

## Routing Strategies

The supervisor uses different strategies to route tasks to workers:

### 1. Skill-Based Routing

Routes tasks based on worker capabilities and skills:

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    strategy: 'skill-based',
    model,
    systemPrompt: 'Route tasks based on worker skills and capabilities.'
  },

  workers: [
    {
      id: 'coder',
      capabilities: {
        skills: ['coding', 'programming', 'debugging'],
        tools: ['code_executor'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [codeExecutor],
      systemPrompt: 'You are an expert programmer. Write clean, efficient code.'
    },
    {
      id: 'tester',
      capabilities: {
        skills: ['testing', 'qa', 'validation'],
        tools: ['test_runner'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [testRunner],
      systemPrompt: 'You are a QA specialist. Test code thoroughly.'
    },
    {
      id: 'reviewer',
      capabilities: {
        skills: ['code-review', 'best-practices', 'security'],
        tools: [],
        available: true,
        currentWorkload: 0
      },
      model,
      systemPrompt: 'You are a senior engineer. Review code for quality and security.'
    }
  ],

  aggregator: { model }
});
```

### 2. LLM-Based Routing

Uses an LLM to make intelligent routing decisions:

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    strategy: 'llm-based',
    model,
    systemPrompt: `You are a project manager routing tasks to specialized workers.

Analyze the task and route to the most appropriate worker(s):
- coder: For writing and implementing code
- tester: For running tests and validation
- reviewer: For code review and quality checks

You can route to multiple workers in parallel if needed.`
  },

  workers: [/* ... */],
  aggregator: { model }
});
```

### 3. Round-Robin Routing

Distributes tasks evenly across all available workers:

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    strategy: 'round-robin'
    // No model needed for round-robin
  },

  workers: [/* ... */],
  aggregator: { model }
});
```

### 4. Load-Balanced Routing

Routes to workers with the lowest current workload:

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    strategy: 'load-balanced'
    // No model needed for load-balanced
  },

  workers: [/* ... */],
  aggregator: { model }
});
```

### 5. Rule-Based Routing

Uses custom routing logic:

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    strategy: 'rule-based',
    routingFn: async (state) => {
      const input = state.input.toLowerCase();

      // Custom routing logic
      if (input.includes('code') || input.includes('implement')) {
        return {
          targetAgent: 'coder',
          reasoning: 'Task requires coding',
          confidence: 0.9,
          strategy: 'rule-based',
          timestamp: Date.now()
        };
      } else if (input.includes('test')) {
        return {
          targetAgent: 'tester',
          reasoning: 'Task requires testing',
          confidence: 0.9,
          strategy: 'rule-based',
          timestamp: Date.now()
        };
      }

      // Default to first worker
      return {
        targetAgent: state.workers ? Object.keys(state.workers)[0] : 'coder',
        reasoning: 'Default routing',
        confidence: 0.5,
        strategy: 'rule-based',
        timestamp: Date.now()
      };
    }
  },

  workers: [/* ... */],
  aggregator: { model }
});
```

## Advanced Patterns

### Hierarchical Organization

Multi-level agent organization:

```typescript
// Create a team lead multi-agent system
const teamLead = createMultiAgentSystem({
  supervisor: {
    strategy: 'skill-based',
    model,
    systemPrompt: 'You are a team lead. Coordinate your team members.'
  },
  workers: [
    {
      id: 'specialist1',
      capabilities: {
        skills: ['task1', 'task2'],
        tools: ['tool1'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [tool1],
      systemPrompt: 'You are specialist 1.'
    },
    {
      id: 'specialist2',
      capabilities: {
        skills: ['task3', 'task4'],
        tools: ['tool2'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [tool2],
      systemPrompt: 'You are specialist 2.'
    }
  ],
  aggregator: { model }
});

// Use the team lead as a worker in a higher-level system
const organization = createMultiAgentSystem({
  supervisor: {
    strategy: 'skill-based',
    model,
    systemPrompt: 'You are the CEO. Delegate to department heads.'
  },
  workers: [
    {
      id: 'engineering_team',
      capabilities: {
        skills: ['engineering', 'development'],
        tools: [],
        available: true,
        currentWorkload: 0
      },
      agent: teamLead,  // Nested multi-agent system
      systemPrompt: 'You lead the engineering team.'
    },
    // ... other departments
  ],
  aggregator: { model }
});
```

## Configuration Options

### Core Configuration

```typescript
interface MultiAgentSystemConfig {
  // Required
  supervisor: SupervisorConfig;         // Supervisor configuration
  workers: WorkerConfig[];              // Worker configurations

  // Optional
  aggregator?: AggregatorConfig;        // Aggregator configuration
  maxIterations?: number;               // Max routing iterations (default: 10)
  verbose?: boolean;                    // Enable verbose logging
  checkpointer?: BaseCheckpointSaver;   // For state persistence and human-in-the-loop
}

interface SupervisorConfig {
  strategy: RoutingStrategy;            // 'skill-based' | 'llm-based' | 'round-robin' | 'load-balanced' | 'rule-based'
  model?: BaseChatModel;                // Required for 'llm-based' strategy
  systemPrompt?: string;                // System prompt for LLM-based routing
  routingFn?: (state) => Promise<RoutingDecision>;  // Custom routing function for 'rule-based'
  verbose?: boolean;
  maxIterations?: number;
  maxToolRetries?: number;              // Max tool call retries (default: 3)
}

interface WorkerConfig {
  id: string;                           // Unique worker identifier
  capabilities: WorkerCapabilities;     // Worker capabilities
  model?: BaseChatModel;                // Language model
  tools?: Tool[];                       // Available tools
  systemPrompt?: string;                // System prompt
  executeFn?: (state, config?) => Promise<Partial<MultiAgentStateType>>;  // Custom execution
  agent?: CompiledStateGraph;           // ReAct agent or nested multi-agent system
  verbose?: boolean;
}

interface WorkerCapabilities {
  skills: string[];                     // List of skills
  tools: string[];                      // List of tool names
  available: boolean;                   // Availability status
  currentWorkload: number;              // Current workload count
}

interface AggregatorConfig {
  model?: BaseChatModel;                // Language model for aggregation
  systemPrompt?: string;                // System prompt
  aggregateFn?: (state) => Promise<string>;  // Custom aggregation function
  verbose?: boolean;
}
```

### Advanced Configuration

```typescript
import { MemorySaver } from '@langchain/langgraph';

const system = createMultiAgentSystem({
  supervisor: {
    strategy: 'llm-based',
    model,
    systemPrompt: 'Route tasks intelligently to workers.',
    maxIterations: 5,
    maxToolRetries: 3,
    verbose: true
  },

  workers: [
    {
      id: 'researcher',
      capabilities: {
        skills: ['research', 'web-scraping'],
        tools: ['web_scraper'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [webScraper],
      systemPrompt: 'You are a research specialist.',
      verbose: true
    },
    {
      id: 'analyst',
      capabilities: {
        skills: ['analysis', 'calculations'],
        tools: ['calculator'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [calculator],
      systemPrompt: 'You are a data analyst.'
    }
  ],

  aggregator: {
    model,
    systemPrompt: 'Combine worker results into a coherent response.'
  },

  maxIterations: 10,
  verbose: true,
  checkpointer: new MemorySaver()  // Enable state persistence
});
```

## Human-in-the-Loop with Checkpointers

Enable worker agents to request human input mid-execution using checkpointers. This is essential for workflows that require user confirmation, clarification, or approval.

### Basic Setup

```typescript
import { MemorySaver } from '@langchain/langgraph';
import { createMultiAgentSystem, createReActAgent } from '@agentforge/patterns';
import { createAskHumanTool } from '@agentforge/tools';

// Create worker agents with checkpointer: true
const hrAgent = createReActAgent({
  model,
  tools: [createAskHumanTool(), slackTool, emailTool],
  systemPrompt: 'You are an HR specialist. Help with employee-related tasks.',
  checkpointer: true  // Use parent's checkpointer with separate namespace
});

const legalAgent = createReActAgent({
  model,
  tools: [createAskHumanTool(), contractTool, complianceTool],
  systemPrompt: 'You are a legal specialist. Help with contracts and compliance.',
  checkpointer: true
});

// Create multi-agent system with checkpointer
const system = createMultiAgentSystem({
  supervisor: {
    model,
    strategy: 'skill-based'
  },
  workers: [
    {
      id: 'hr',
      capabilities: {
        skills: ['hr', 'employee', 'slack'],
        tools: ['askHuman', 'slack', 'email'],
        available: true,
        currentWorkload: 0
      },
      agent: hrAgent
    },
    {
      id: 'legal',
      capabilities: {
        skills: ['legal', 'contract', 'compliance'],
        tools: ['askHuman', 'contract', 'compliance'],
        available: true,
        currentWorkload: 0
      },
      agent: legalAgent
    }
  ],
  aggregator: { model },
  checkpointer: new MemorySaver()  // Parent checkpointer
});
```

### How It Works

When a worker agent calls `askHuman`:

1. **Interrupt occurs** - The worker agent pauses execution
2. **State is saved** - Worker's state is saved in a separate namespace: `{thread_id}:worker:{workerId}`
3. **User responds** - Your application collects user input
4. **Resume execution** - Call `system.invoke(new Command({ resume: userInput }))` to continue

```typescript
import { Command } from '@langchain/langgraph';

// Start a conversation
const result = await system.invoke(
  { input: 'Send a Slack announcement about my promotion' },
  { configurable: { thread_id: 'user-123' } }
);

// If HR agent asks for confirmation, it will throw GraphInterrupt
// Your application should catch this and prompt the user

// Resume with user's response
const finalResult = await system.invoke(
  new Command({ resume: 'Yes, please send it to #announcements' }),
  { configurable: { thread_id: 'user-123' } }
);
```

### Benefits

- **Independent worker state** - Each worker has its own checkpoint namespace
- **No infinite loops** - Workers can interrupt and resume without restarting
- **Conversation continuity** - Resume conversations across sessions
- **Error recovery** - Resume from failures without losing progress

### Important Notes

- **Always use `checkpointer: true`** for worker agents (not a checkpointer instance)
- **Parent must provide checkpointer** - The multi-agent system must have a checkpointer
- **Unique thread IDs** - Always pass a `thread_id` in the config for conversation continuity

## Multi-Agent System Builder

Use the builder pattern for dynamic worker registration:

```typescript
import { MultiAgentSystemBuilder } from '@agentforge/patterns';

const builder = new MultiAgentSystemBuilder({
  supervisor: {
    strategy: 'skill-based',
    model
  },
  aggregator: { model }
});

// Register workers dynamically
builder.registerWorkers([
  {
    name: 'researcher',
    capabilities: ['research', 'web-scraping', 'information-gathering'],
    tools: [webScraper, htmlParser, httpGet],
    systemPrompt: `You are an expert researcher.

Your responsibilities:
- Find accurate, up-to-date information
- Cite all sources
- Verify facts from multiple sources
- Summarize findings clearly`,
    model
  },
  {
    name: 'analyst',
    capabilities: ['data-analysis', 'statistics'],
    tools: [calculator, dataAnalyzer],
    systemPrompt: 'You are a data analyst.',
    model
  },
  {
    name: 'writer',
    capabilities: ['writing', 'documentation'],
    tools: [fileWriter],
    systemPrompt: 'You are a technical writer.',
    model
  }
]);

const system = builder.build();
```

## Streaming

Monitor multi-agent collaboration in real-time:

```typescript
const stream = await system.stream({
  input: 'Research AI trends and create a report'
});

for await (const chunk of stream) {
  console.log('Node:', Object.keys(chunk)[0]);
  console.log('State update:', chunk);

  // Access specific node outputs
  if (chunk.supervisor) {
    console.log('Supervisor routing:', chunk.supervisor.currentAgent);
  }
  if (chunk.researcher) {
    console.log('Researcher output:', chunk.researcher.messages);
  }
  if (chunk.aggregator) {
    console.log('Final result:', chunk.aggregator.output);
  }
}
```

## Best Practices

### 1. Clear Worker Roles

Define specific, non-overlapping responsibilities:

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    strategy: 'skill-based',
    model
  },

  workers: [
    {
      id: 'dataCollector',
      capabilities: {
        skills: ['data-collection', 'api-calls', 'web-scraping'],
        tools: ['api_call', 'web_scrape'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [apiCall, webScrape],
      systemPrompt: 'Collect data from external sources'
    },
    {
      id: 'dataProcessor',
      capabilities: {
        skills: ['data-processing', 'transformation', 'calculations'],
        tools: ['data_transform', 'calculator'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [dataTransform, calculator],
      systemPrompt: 'Clean and transform data'
    },
    {
      id: 'dataAnalyst',
      capabilities: {
        skills: ['data-analysis', 'statistics', 'visualization'],
        tools: ['statistical_analysis', 'chart_generate'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [statisticalAnalysis, chartGenerate],
      systemPrompt: 'Analyze data and create visualizations'
    }
  ],

  aggregator: { model }
});
```

### 2. Limit Worker Count

Too many workers increases coordination overhead:

```typescript
// ✅ Good: 3-5 specialized workers
const system = createMultiAgentSystem({
  supervisor: { strategy: 'skill-based', model },
  workers: [
    { id: 'researcher', capabilities: { ... }, model },
    { id: 'analyst', capabilities: { ... }, model },
    { id: 'writer', capabilities: { ... }, model }
  ],
  aggregator: { model }
});

// ❌ Avoid: Too many workers
const system = createMultiAgentSystem({
  supervisor: { strategy: 'skill-based', model },
  workers: [
    // ... 15+ workers - too complex to coordinate
  ]
});
```

### 3. Set Iteration Limits

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    strategy: 'llm-based',
    model,
    maxIterations: 5,  // Limit supervisor iterations
    maxToolRetries: 3  // Limit tool call retries
  },
  workers: [/* ... */],
  aggregator: { model },
  maxIterations: 10  // Overall system iteration limit
});
```

### 4. Use Checkpointers for Long-Running Tasks

```typescript
import { MemorySaver } from '@langchain/langgraph';

const system = createMultiAgentSystem({
  supervisor: { strategy: 'skill-based', model },
  workers: [/* ... */],
  aggregator: { model },
  checkpointer: new MemorySaver()  // Enable state persistence
});

// Always use thread_id for conversation continuity
const result = await system.invoke(
  { input: 'Complex task' },
  { configurable: { thread_id: 'task-123' } }
);
```

## Common Patterns

### Software Development Team

```typescript
const devTeam = createMultiAgentSystem({
  supervisor: {
    strategy: 'skill-based',
    model,
    systemPrompt: 'Coordinate the development team to build high-quality software.'
  },

  workers: [
    {
      id: 'productManager',
      capabilities: {
        skills: ['requirements', 'planning', 'prioritization'],
        tools: [],
        available: true,
        currentWorkload: 0
      },
      model,
      systemPrompt: 'Define requirements and priorities'
    },
    {
      id: 'developer',
      capabilities: {
        skills: ['coding', 'implementation'],
        tools: ['code_executor', 'file_write'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [codeExecutor, fileWrite],
      systemPrompt: 'Write clean, efficient code'
    },
    {
      id: 'tester',
      capabilities: {
        skills: ['testing', 'qa', 'validation'],
        tools: ['test_runner', 'coverage_analyzer'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [testRunner, coverageAnalyzer],
      systemPrompt: 'Write and run comprehensive tests'
    },
    {
      id: 'reviewer',
      capabilities: {
        skills: ['code-review', 'security', 'best-practices'],
        tools: ['linter', 'security_scanner'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [linter, securityScanner],
      systemPrompt: 'Review code for quality and security'
    }
  ],

  aggregator: { model }
});
```

### Research Team

```typescript
const researchTeam = createMultiAgentSystem({
  supervisor: {
    strategy: 'skill-based',
    model
  },

  workers: [
    {
      id: 'literatureReviewer',
      capabilities: {
        skills: ['literature-review', 'research', 'academic-papers'],
        tools: ['web_scraper', 'http_get'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [webScraper, httpGet],
      systemPrompt: 'Find and review academic papers'
    },
    {
      id: 'dataCollector',
      capabilities: {
        skills: ['data-collection', 'experiments'],
        tools: ['api_call', 'web_scrape'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [apiCall, webScrape],
      systemPrompt: 'Gather experimental data'
    },
    {
      id: 'statistician',
      capabilities: {
        skills: ['statistics', 'data-analysis'],
        tools: ['statistical_analysis', 'r_script'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [statisticalAnalysis, rScript],
      systemPrompt: 'Perform statistical analysis'
    },
    {
      id: 'writer',
      capabilities: {
        skills: ['writing', 'documentation', 'academic-writing'],
        tools: ['latex_compiler', 'file_write'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [latexCompiler, fileWrite],
      systemPrompt: 'Write research paper'
    }
  ],

  aggregator: { model }
});
```

### Customer Service Team

```typescript
const supportTeam = createMultiAgentSystem({
  supervisor: {
    strategy: 'llm-based',
    model,
    systemPrompt: 'Route customer inquiries to the appropriate support agent.'
  },

  workers: [
    {
      id: 'triageAgent',
      capabilities: {
        skills: ['triage', 'classification', 'prioritization'],
        tools: ['ticket_classifier'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [ticketClassifier],
      systemPrompt: 'Classify and prioritize tickets'
    },
    {
      id: 'technicalSupport',
      capabilities: {
        skills: ['technical-support', 'troubleshooting', 'diagnostics'],
        tools: ['knowledge_base', 'diagnostic_tools'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [knowledgeBase, diagnosticTools],
      systemPrompt: 'Resolve technical issues'
    },
    {
      id: 'billingSupport',
      capabilities: {
        skills: ['billing', 'payments', 'invoicing'],
        tools: ['billing_system', 'payment_processor'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [billingSystem, paymentProcessor],
      systemPrompt: 'Handle billing inquiries'
    },
    {
      id: 'escalationAgent',
      capabilities: {
        skills: ['escalation', 'communication'],
        tools: ['email_send', 'slack_notify'],
        available: true,
        currentWorkload: 0
      },
      model,
      tools: [emailSend, slackNotify],
      systemPrompt: 'Escalate complex issues'
    }
  ],

  aggregator: { model }
});
```

## Debugging

### Enable Verbose Logging

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    strategy: 'llm-based',
    model,
    verbose: true  // Enable supervisor logging
  },
  workers: [
    {
      id: 'worker1',
      capabilities: { ... },
      model,
      verbose: true  // Enable worker logging
    }
  ],
  aggregator: {
    model,
    verbose: true  // Enable aggregator logging
  },
  verbose: true  // Enable system-level logging
});
```

### Stream State Updates

Monitor the system in real-time:

```typescript
const stream = await system.stream({
  input: 'Complex task'
});

for await (const chunk of stream) {
  const nodeName = Object.keys(chunk)[0];
  console.log(`\n=== ${nodeName} ===`);
  console.log('State:', JSON.stringify(chunk[nodeName], null, 2));
}
```

### Inspect State After Execution

```typescript
const result = await system.invoke({
  input: 'Task description'
});

console.log('Final output:', result.output);
console.log('Completed tasks:', result.completedTasks);
console.log('Status:', result.status);
console.log('Iterations:', result.iteration);
console.log('Messages:', result.messages);
```

## Performance Optimization

### 1. Parallel Worker Execution

The supervisor can route to multiple workers in parallel using LLM-based routing:

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    strategy: 'llm-based',
    model,
    systemPrompt: `Route tasks to workers. You can route to multiple workers in parallel by specifying them in the targetAgents array.`
  },
  workers: [/* ... */],
  aggregator: { model }
});

// The supervisor can return targetAgents: ['worker1', 'worker2'] for parallel execution
```

### 2. Limit Iterations

Prevent excessive routing iterations:

```typescript
const system = createMultiAgentSystem({
  supervisor: {
    strategy: 'llm-based',
    model,
    maxIterations: 5,  // Limit supervisor iterations
    maxToolRetries: 3  // Limit tool call retries
  },
  workers: [/* ... */],
  aggregator: { model },
  maxIterations: 10  // Overall system iteration limit
});
```

### 3. Use Efficient Routing Strategies

Choose the right strategy for your use case:

// Skill-based: Fast, deterministic routing based on worker skills
const skillBased = createMultiAgentSystem({
  supervisor: { strategy: 'skill-based' },  // No model needed
  workers: [/* ... */],
  aggregator: { model }
});

// Round-robin: Simple load distribution
const roundRobin = createMultiAgentSystem({
  supervisor: { strategy: 'round-robin' },  // No model needed
  workers: [/* ... */],
  aggregator: { model }
});

// LLM-based: Intelligent routing but slower and more expensive
const llmBased = createMultiAgentSystem({
  supervisor: {
    strategy: 'llm-based',
    model  // Model required for LLM-based routing
  },
  workers: [/* ... */],
  aggregator: { model }
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

## Advanced: Parallel Routing

**NEW in v0.6.3**: Route queries to **multiple agents in parallel** for comprehensive answers that combine insights from multiple specialists.

### Overview

When using `llm-based` routing, the supervisor can select multiple workers to execute simultaneously instead of routing to just one agent. This enables:

- **Comprehensive answers** combining multiple perspectives
- **Faster execution** through parallel processing
- **Better coverage** of complex queries

### How It Works

The supervisor analyzes the query and determines if multiple agents should work on it in parallel:

```typescript
import { createMultiAgentSystem } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

const llm = new ChatOpenAI({ modelName: 'gpt-4' });

const system = createMultiAgentSystem({
  supervisor: {
    strategy: 'llm-based',  // Required for parallel routing
    model: llm,
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
      capabilities: {
        skills: ['code-analysis', 'codebase-search'],
        tools: ['code_search'],
        available: true,
        currentWorkload: 0
      },
      model: llm,
      tools: [codeSearchTool],
      systemPrompt: 'You analyze codebases and find relevant code.'
    },
    {
      id: 'security',
      capabilities: {
        skills: ['security', 'vulnerability-scanning', 'security-audit'],
        tools: ['security_scan'],
        available: true,
        currentWorkload: 0
      },
      model: llm,
      tools: [securityScanTool],
      systemPrompt: 'You perform security audits and find vulnerabilities.'
    },
    {
      id: 'docs',
      capabilities: {
        skills: ['documentation', 'doc-search'],
        tools: ['doc_search'],
        available: true,
        currentWorkload: 0
      },
      model: llm,
      tools: [docSearchTool],
      systemPrompt: 'You search and analyze documentation.'
    },
  ],
  aggregator: { model: llm },
});

// Query that triggers parallel routing
const result = await system.invoke({
  input: 'Are there any security vulnerabilities in our authentication module?',
});
```

### Execution Flow

```
Query: "Are there security vulnerabilities in our auth module?"
   ↓
Supervisor analyzes query
   ↓
Routes to [code, security] in parallel
   ↓
┌─────────────────┬─────────────────┐
│   Code Agent    │ Security Agent  │
│  (analyzing)    │  (scanning)     │
└─────────────────┴─────────────────┘
   ↓                      ↓
   └──────────┬───────────┘
              ↓
         Aggregator
              ↓
    Combined Response
```

### Example Output

```
[Supervisor] Routing to 2 agents in parallel [code, security]

[Worker:code] Analyzing codebase...
[Worker:security] Running security scan...

[Aggregator] Combining results from 2 workers...

Response: "Security assessment combining code analysis and vulnerability scan:

Code Analysis (Code Agent):
- Found weak password hashing (MD5)
- Missing rate limiting on login endpoint
- Session tokens stored in localStorage

Security Scan (Security Agent):
- No MFA support detected
- Session tokens don't expire
- Missing CSRF protection

Recommendations:
1. Upgrade to bcrypt for password hashing
2. Add rate limiting middleware
3. Implement MFA
4. Add token expiration (15 min)
5. Move tokens to httpOnly cookies
6. Add CSRF tokens"
```

### When to Use Parallel Routing

✅ **Use parallel routing when:**
- Query needs multiple perspectives (code + docs, legal + HR)
- Different data sources should be consulted
- Comprehensive analysis requires multiple specialists
- Speed matters (parallel > sequential)

❌ **Don't use parallel routing when:**
- Query clearly maps to single specialist
- Workers would duplicate work
- Results need to be processed sequentially
- Resource constraints limit parallelism

### Schema Support

The routing decision schema supports both single and parallel routing:

```typescript
{
  targetAgent: string | null,      // For single agent routing
  targetAgents: string[] | null,   // For parallel routing (NEW)
  reasoning: string,
  confidence: number,
  strategy: string,
  timestamp: number,
}
```

**Validation**: Either `targetAgent` OR `targetAgents` must be provided (not both).

### Best Practices

1. **Guide the supervisor**: Provide clear examples in the system prompt of when to use parallel routing
2. **Choose complementary agents**: Select agents that provide different perspectives, not duplicate work
3. **Optimize aggregation**: Ensure the aggregator can effectively combine results from multiple agents
4. **Monitor performance**: Parallel routing is faster but uses more resources

::: tip Backward Compatibility
Parallel routing is fully backward compatible. Existing systems continue to work with single-agent routing, and no changes are needed to existing code.
:::

## Next Steps

- [ReAct Pattern](/guide/patterns/react) - For single-agent tool usage
- [Plan-Execute Pattern](/guide/patterns/plan-execute) - For structured workflows
- [Reflection Pattern](/guide/patterns/reflection) - For self-improving agents
- [API Reference](/api/patterns#multi-agent) - Complete API documentation

## Further Reading

- [AutoGen Paper](https://arxiv.org/abs/2308.08155) - Microsoft's multi-agent framework
- [MetaGPT Paper](https://arxiv.org/abs/2308.00352) - Multi-agent collaboration
- [Examples](/examples/multi-agent) - Working code examples


