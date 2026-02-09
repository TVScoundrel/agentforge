# Agent Patterns

Agent patterns are proven architectural approaches for building AI agents. AgentForge provides four production-ready patterns, each optimized for different types of tasks.

::: tip Detailed Guides
This page provides an overview. For in-depth guides, see:
- **[ReAct Pattern Guide](/guide/patterns/react)** - Complete ReAct documentation
- **[Plan-Execute Pattern Guide](/guide/patterns/plan-execute)** - Complete Plan-Execute documentation
- **[Reflection Pattern Guide](/guide/patterns/reflection)** - Complete Reflection documentation
- **[Multi-Agent Pattern Guide](/guide/patterns/multi-agent)** - Complete Multi-Agent documentation
:::

::: info Code Examples
Code examples on this page assume the following imports from the first example:
```typescript
import { ChatOpenAI } from '@langchain/openai';
```
:::

## Overview

| Pattern | Best For | Key Strength | Complexity |
|---------|----------|--------------|------------|
| **ReAct** | Exploration, flexibility | Dynamic adaptation | Low |
| **Plan-Execute** | Structured workflows | Parallel execution | Medium |
| **Reflection** | Quality-critical outputs | Iterative improvement | Medium |
| **Multi-Agent** | Specialized tasks | Coordinated expertise | High |

## ReAct Pattern

**Reasoning and Action** - The agent alternates between thinking and acting in a loop.

### How It Works

1. **Reason** - Think about what to do next
2. **Act** - Use a tool or provide an answer
3. **Observe** - See the result
4. **Repeat** - Continue until task is complete

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

const agent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [calculator, webScraper, fileReader],
  maxIterations: 10,
});

const result = await agent.invoke({
  messages: [{ role: 'user', content: 'What is the population of Tokyo multiplied by 2?' }],
});
```

### When to Use ReAct

**✅ Ideal for:**
- Exploratory tasks requiring tool usage
- Multi-step problem solving
- Transparent decision-making
- Dynamic task decomposition
- Tasks where the path isn't known upfront

**❌ Not ideal for:**
- Simple, single-step tasks
- Tasks requiring extensive upfront planning
- Highly structured, predetermined workflows
- Tasks where reasoning overhead is unnecessary

### Key Features

- 🔄 **Iterative** - Adapts based on observations
- 🔍 **Transparent** - Shows reasoning at each step
- 🛠️ **Tool-driven** - Leverages tools effectively
- 🎯 **Flexible** - Handles unexpected situations

## Plan-Execute Pattern

**Planning then Execution** - The agent creates a plan first, then executes it step by step.

### How It Works

1. **Plan** - Create a structured multi-step plan
2. **Execute** - Run each step (optionally in parallel)
3. **Replan** - Adjust plan if needed based on results
4. **Finish** - Complete when all steps are done

```typescript
import { createPlanExecuteAgent } from '@agentforge/patterns';

const agent = createPlanExecuteAgent({
  planner: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    maxSteps: 10,
  },
  executor: {
    tools: [dataFetcher, analyzer, reporter],
    parallel: true, // Enable parallel execution
  },
  replanner: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    replanThreshold: 0.7,
  },
});

const result = await agent.invoke({
  input: 'Research and analyze market trends for Q4 2025',
});
```

### When to Use Plan-Execute

**✅ Ideal for:**
- Well-defined workflows
- Tasks benefiting from parallel execution
- Structured, multi-step processes
- Research and analysis tasks
- ETL pipelines and data processing

**❌ Not ideal for:**
- Highly exploratory tasks
- Tasks requiring constant adaptation
- Simple, single-step operations
- Real-time interactive tasks

### Key Features

- 📋 **Structured** - Clear plan before execution
- ⚡ **Parallel** - Execute independent steps simultaneously
- 🔄 **Adaptive** - Can replan if needed
- 📊 **Efficient** - Optimizes execution order

## Reflection Pattern

**Generate, Critique, Revise** - The agent iteratively improves its output through self-critique.

### How It Works

1. **Generate** - Create initial response
2. **Reflect** - Critique the response
3. **Revise** - Improve based on critique
4. **Repeat** - Continue until quality threshold met

```typescript
import { createReflectionAgent } from '@agentforge/patterns';

const agent = createReflectionAgent({
  generator: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    systemPrompt: 'Expert content writer',
  },
  reflector: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    systemPrompt: 'Critical reviewer checking quality',
  },
  reviser: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    systemPrompt: 'Editor improving based on feedback',
  },
  maxIterations: 3,
});

const result = await agent.invoke({
  input: 'Write a technical blog post about microservices',
  qualityCriteria: {
    minScore: 8,
    criteria: ['Clear', 'Accurate', 'Engaging'],
  },
});
```

### When to Use Reflection

**✅ Ideal for:**
- Quality-critical outputs (writing, code, designs)
- Tasks requiring refinement
- Content that benefits from review
- Complex problem-solving
- Creative tasks

**❌ Not ideal for:**
- Time-sensitive tasks
- Simple queries
- Tasks with clear right/wrong answers
- Cost-sensitive applications (uses more LLM calls)

### Key Features

- 🎯 **Quality-focused** - Iterative improvement
- 🔍 **Self-critical** - Built-in review process
- 📈 **Measurable** - Quality criteria and scoring
- 🔄 **Iterative** - Multiple revision cycles

## Multi-Agent Pattern

**Coordinated Specialists** - Multiple specialized agents work together, coordinated by a supervisor.

### How It Works

1. **Supervisor** - Routes tasks to appropriate workers
2. **Workers** - Specialized agents handle specific tasks
3. **Aggregator** - Combines results from multiple workers
4. **Routing** - Intelligent task distribution

```typescript
import { MultiAgentSystemBuilder } from '@agentforge/patterns';

const builder = new MultiAgentSystemBuilder({
  supervisor: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    strategy: 'skill-based', // or 'llm-based', 'round-robin', 'load-balanced'
  },
  aggregator: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
  },
});

builder.registerWorkers([
  {
    name: 'researcher',
    description: 'Research Specialist',
    capabilities: ['research', 'analysis', 'data-gathering'],
    tools: [webScraper, httpGet],
    systemPrompt: 'You are a research specialist. Find accurate information.',
    model: new ChatOpenAI({ model: 'gpt-4' }),
  },
  {
    name: 'writer',
    description: 'Content Writer',
    capabilities: ['writing', 'editing', 'formatting'],
    tools: [textFormatter, grammarCheck],
    systemPrompt: 'You are a content writer. Create clear, engaging content.',
    model: new ChatOpenAI({ model: 'gpt-4' }),
  },
]);

const system = builder.build();

const result = await system.invoke({
  input: 'Research AI trends and write a summary',
});
```

### When to Use Multi-Agent

**✅ Ideal for:**
- Tasks requiring different expertise
- Complex workflows with specialized steps
- Parallel processing of different aspects
- Systems needing load balancing
- Modular, maintainable architectures

**❌ Not ideal for:**
- Simple, single-domain tasks
- Tasks where coordination overhead isn't worth it
- Real-time, low-latency requirements
- Resource-constrained environments

### Routing Strategies

| Strategy | Best For | How It Works |
|----------|----------|--------------|
| **skill-based** | Specialized tasks | Matches task to worker skills |
| **llm-based** | Complex routing | LLM decides best worker |
| **round-robin** | Load distribution | Rotates through workers |
| **load-balanced** | High throughput | Routes to least busy worker |
| **rule-based** | Custom logic | User-defined routing rules |

### Key Features

- 🎯 **Specialized** - Each worker has specific expertise
- 🔀 **Coordinated** - Supervisor manages workflow
- ⚡ **Parallel** - Multiple workers can run simultaneously
- 📊 **Scalable** - Add workers as needed

## Choosing the Right Pattern

### Decision Tree

```
Start
  ├─ Need multiple specialized agents?
  │   └─ YES → Multi-Agent Pattern
  │
  ├─ Need high-quality, refined output?
  │   └─ YES → Reflection Pattern
  │
  ├─ Have a clear, structured workflow?
  │   └─ YES → Plan-Execute Pattern
  │
  └─ Need flexible, exploratory approach?
      └─ YES → ReAct Pattern
```

### By Use Case

| Use Case | Recommended Pattern | Why |
|----------|-------------------|-----|
| **Research & Analysis** | Plan-Execute | Structured steps, parallel data gathering |
| **Content Writing** | Reflection | Quality improvement through iteration |
| **Customer Support** | Multi-Agent | Route to specialized support agents |
| **Data Processing** | Plan-Execute | Parallel execution, clear workflow |
| **Code Generation** | Reflection | Iterative refinement for quality |
| **General Q&A** | ReAct | Flexible tool usage, exploration |
| **Complex Projects** | Multi-Agent | Different specialists for different tasks |

### By Characteristics

**Choose ReAct when you need:**
- 🔍 Transparency in reasoning
- 🔄 Dynamic adaptation
- 🛠️ Flexible tool usage
- 📝 Visible thought process

**Choose Plan-Execute when you need:**
- 📋 Structured approach
- ⚡ Parallel execution
- 🎯 Efficiency
- 📊 Clear progress tracking

**Choose Reflection when you need:**
- 🎯 High quality output
- 🔄 Iterative improvement
- 📈 Measurable quality
- 🔍 Self-critique

**Choose Multi-Agent when you need:**
- 🎯 Specialized expertise
- 🔀 Task routing
- ⚡ Parallel processing
- 📊 Scalability

## Combining Patterns

Patterns can be combined for more sophisticated systems:

### Example: Multi-Agent with Reflection Workers

```typescript
// Create a reflection agent for writing
const writerAgent = createReflectionAgent({
  generator: { model: llm, systemPrompt: 'Expert writer' },
  reflector: { model: llm, systemPrompt: 'Critical reviewer' },
  reviser: { model: llm, systemPrompt: 'Revise based on feedback' },
  maxIterations: 2,
});

// Use it as a worker in multi-agent system
// Note: The builder converts this to WorkerConfig internally
builder.registerWorkers([
  {
    name: 'writer',
    description: 'Quality Writer',
    capabilities: ['writing', 'editing', 'reflection'],
    tools: [],
    systemPrompt: 'You are a quality writer with self-reflection capabilities.',
    model: llm,
  },
]);
```

### Example: Plan-Execute with ReAct Executor

```typescript
const agent = createPlanExecuteAgent({
  planner: { model: llm, maxSteps: 5 },
  executor: {
    tools: [calculator, webScraper],
    parallel: false,        // Execute steps sequentially
    stepTimeout: 30000,     // 30 second timeout per step
  },
});
```

## Best Practices

### 1. Start Simple

Begin with the simplest pattern that meets your needs:
- Single task? → ReAct
- Multiple steps? → Plan-Execute
- Need quality? → Reflection
- Need specialists? → Multi-Agent

### 2. Measure Performance

Track metrics for each pattern:
- **Latency** - How long does it take?
- **Cost** - How many LLM calls?
- **Quality** - How good are the results?
- **Success Rate** - How often does it work?

### 3. Iterate and Optimize

- Start with default configurations
- Monitor performance
- Adjust parameters based on results
- Consider switching patterns if needed

### 4. Handle Errors Gracefully

Handle errors using try-catch or middleware:

```typescript
// Option 1: Try-catch in calling code
try {
  const result = await agent.invoke({ messages });
} catch (error) {
  console.error('Agent error:', error);
  // Handle error appropriately
}

// Option 2: Use withErrorHandler middleware on custom nodes
// See the Middleware guide for details on wrapping nodes with error handling
```

::: tip Error Handling
ReActAgentConfig does not support an `onError` field. Use try-catch blocks in your calling code, or apply `withErrorHandler` middleware to custom nodes. See the [Middleware Guide](/guide/concepts/middleware) for more details.
:::

## Next Steps

- [ReAct Pattern Guide](/guide/patterns/react) - Deep dive into ReAct
- [Plan-Execute Guide](/guide/patterns/plan-execute) - Deep dive into Plan-Execute
- [Reflection Guide](/guide/patterns/reflection) - Deep dive into Reflection
- [Multi-Agent Guide](/guide/patterns/multi-agent) - Deep dive into Multi-Agent
- [Pattern Examples](/examples/react-agent) - Working examples
- [API Reference](/api/patterns) - Complete API documentation


