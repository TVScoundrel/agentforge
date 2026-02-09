# ReAct Pattern Guide

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Usage Patterns](#usage-patterns)
- [Advanced Features](#advanced-features)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Monitoring & Debugging](#monitoring--debugging)
- [Error Handling](#error-handling)
- [Performance Optimization](#performance-optimization)
- [Testing](#testing)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

## Overview

The ReAct (Reasoning and Action) pattern is an agentic workflow that synergizes reasoning and acting in language models. It enables agents to:
- Generate verbal reasoning traces
- Take actions using tools
- Observe results and adjust reasoning
- Solve complex tasks through iterative refinement

### When to Use ReAct

**Ideal for:**
- ✅ Tasks requiring tool usage
- ✅ Multi-step problem solving
- ✅ Transparent decision-making
- ✅ Dynamic task decomposition
- ✅ Exploratory workflows

**Not ideal for:**
- ❌ Simple, single-step tasks
- ❌ Tasks requiring extensive planning upfront
- ❌ Highly structured, predetermined workflows
- ❌ Tasks where reasoning overhead is unnecessary

### Key Benefits

1. **Transparency**: Explicit reasoning traces show decision-making
2. **Flexibility**: Adapts to task complexity dynamically
3. **Tool Integration**: Natural tool usage through reasoning
4. **Error Recovery**: Can adjust based on observations
5. **Interpretability**: Easy to understand and debug

## Architecture

### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      ReAct Loop                              │
│                                                              │
│  ┌──────────┐      ┌──────────┐      ┌──────────────┐      │
│  │          │      │          │      │              │      │
│  │ REASONING├─────►│  ACTION  ├─────►│ OBSERVATION  │      │
│  │   Node   │      │   Node   │      │     Node     │      │
│  │          │      │          │      │              │      │
│  └────┬─────┘      └──────────┘      └──────┬───────┘      │
│       │                                      │              │
│       │         ┌──────────────┐             │              │
│       └─────────┤ Check Done?  │◄────────────┘              │
│                 └──────┬───────┘                            │
│                        │                                    │
│                   Yes  │  No                                │
│                        │                                    │
│                   ┌────▼────┐                               │
│                   │   END   │                               │
│                   └─────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

### State Structure

The ReAct pattern maintains state across iterations:

```typescript
interface ReActState {
  // Conversation messages
  messages: Message[];
  
  // Reasoning traces
  thoughts: Thought[];
  
  // Tool calls (actions)
  actions: ToolCall[];
  
  // Tool results (observations)
  observations: ToolResult[];
  
  // Combined scratchpad
  scratchpad: ScratchpadEntry[];
  
  // Current iteration
  iteration: number;
}
```

### Node Responsibilities

#### 1. Reasoning Node
- Analyzes current state
- Generates reasoning trace
- Decides next action
- Selects tools or provides final answer

#### 2. Action Node
- Executes tool calls
- Handles tool errors
- Validates tool inputs
- Returns tool results

#### 3. Observation Node
- Processes tool results
- Updates scratchpad
- Formats observations
- Prepares for next iteration

## Quick Start

### Basic Example

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import { ToolRegistry } from '@agentforge/core';
import { HumanMessage } from '@langchain/core/messages';

// Create tools
const toolRegistry = new ToolRegistry();
toolRegistry.register(myTool);

// Create agent
const agent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4' }),
  tools: toolRegistry,
  maxIterations: 10,
});

// Run agent
const result = await agent.invoke({
  messages: [new HumanMessage('What is the weather in Tokyo?')],
});

console.log(result.messages[result.messages.length - 1].content);
```

### With Intermediate Steps

```typescript
const agent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4' }),
  tools: toolRegistry,
  maxIterations: 10,
  returnIntermediateSteps: true, // Enable intermediate steps
});

const result = await agent.invoke({
  messages: [new HumanMessage('Calculate 15 * 8')],
});

// Access reasoning process
console.log('Thoughts:', result.thoughts);
console.log('Actions:', result.actions);
console.log('Observations:', result.observations);
```

## Core Concepts

### 1. Thought-Action-Observation Loop

The core of ReAct is the iterative loop:

```typescript
// Pseudocode
while (!done && iteration < maxIterations) {
  // THINK: Generate reasoning
  thought = await llm.generate({
    context: state,
    prompt: "What should I do next?",
  });
  
  // ACT: Execute action
  if (thought.requiresTool) {
    action = await executeTool(thought.toolCall);
  } else {
    action = thought.finalAnswer;
    done = true;
  }
  
  // OBSERVE: Process result
  observation = processResult(action);
  
  // Update state
  state = update(state, thought, action, observation);
  iteration++;
}
```

### 2. Scratchpad

The scratchpad maintains a history of the agent's work:

```typescript
interface ScratchpadEntry {
  step: number;
  thought?: string;
  action?: string;
  observation?: string;
  timestamp: string;
}
```

Benefits:
- Provides context for future reasoning
- Enables learning from past actions
- Supports debugging and analysis
- Helps avoid repeated mistakes

### 3. Tool Integration

Tools are the agent's way to interact with the world:

```typescript
const searchTool = {
  name: 'search',
  description: 'Search for information on a topic',
  schema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    // Implementation
    return { results: [...] };
  },
};
```

### 4. Reasoning Traces

Thoughts capture the agent's reasoning:

```typescript
interface Thought {
  content: string;      // The reasoning text
  timestamp: string;    // When it was generated
  iteration: number;    // Which iteration
}
```

## Usage Patterns

### Pattern 1: Simple Tool Usage

For straightforward tasks requiring one or two tools:

```typescript
const agent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4', temperature: 0 }),
  tools: [calculatorTool, weatherTool],
  systemPrompt: 'You are a helpful assistant.',
  maxIterations: 5,
});

const result = await agent.invoke({
  messages: [new HumanMessage('What is 25 * 4?')],
});
```

**Best for**: Simple queries, single tool calls, quick answers

### Pattern 2: Multi-Step Reasoning

For complex tasks requiring multiple steps:

```typescript
const agent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4', temperature: 0 }),
  tools: [searchTool, calculatorTool, analysisTool],
  systemPrompt: `You are a research assistant.
    Break down complex tasks into steps.
    Use tools systematically.`,
  maxIterations: 15,
  returnIntermediateSteps: true,
});

const result = await agent.invoke({
  messages: [new HumanMessage(
    'Research quantum computing and calculate its market growth rate'
  )],
});
```

**Best for**: Research tasks, analysis, multi-step calculations

### Pattern 3: Tool Chaining

For workflows where tools build on each other:

```typescript
const agent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4', temperature: 0 }),
  tools: [
    fetchDataTool,      // Step 1: Get data
    transformTool,      // Step 2: Transform
    analyzeTool,        // Step 3: Analyze
    formatTool,         // Step 4: Format
  ],
  systemPrompt: `Chain tools together:
    1. Fetch data first
    2. Transform the data
    3. Analyze results
    4. Format output`,
  maxIterations: 10,
});
```

**Best for**: Data pipelines, sequential processing, ETL tasks

### Pattern 4: Exploratory Search

For open-ended exploration:

```typescript
const agent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4', temperature: 0.3 }),
  tools: [searchTool, summarizeTool, compareTool],
  systemPrompt: `You are an exploratory research assistant.
    Investigate topics thoroughly.
    Follow interesting leads.
    Synthesize findings.`,
  maxIterations: 20,
  stopCondition: (state) => {
    // Stop when we have comprehensive findings
    return state.observations.length >= 5 &&
           state.messages[state.messages.length - 1].content.length > 500;
  },
});
```

**Best for**: Research, discovery, comprehensive analysis

## Advanced Features

### Custom Stop Conditions

Control when the agent stops:

```typescript
const agent = createReActAgent({
  llm,
  tools,
  stopCondition: (state) => {
    // Stop if we have high confidence
    const lastMessage = state.messages[state.messages.length - 1];
    const hasConfidence = lastMessage.content.includes('confident');

    // Or if we've used enough tools
    const enoughTools = state.actions.length >= 3;

    // Or if we have a complete answer
    const hasCompleteAnswer = lastMessage.content.length > 200;

    return hasConfidence || (enoughTools && hasCompleteAnswer);
  },
});
```

### Custom System Prompts

Guide the agent's behavior:

```typescript
const systemPrompt = `You are a financial analysis assistant.

GUIDELINES:
1. Always verify data with multiple sources
2. Show your calculations step-by-step
3. Cite sources for all claims
4. Express uncertainty when appropriate
5. Provide actionable recommendations

TOOLS:
- Use 'fetch_stock_data' for current prices
- Use 'calculate_metrics' for financial ratios
- Use 'search_news' for recent developments

FORMAT:
- Start with data gathering
- Show all calculations
- End with clear recommendations`;

const agent = createReActAgent({
  llm,
  tools,
  systemPrompt,
});
```

### Verbose Mode

Enable detailed logging:

```typescript
const agent = createReActAgent(
  {
    llm,
    tools,
  },
  {
    verbose: true,  // Enable logging
    nodeNames: {
      reasoning: 'think',
      action: 'execute',
      observation: 'observe',
    },
  }
);
```

Output:
```
[think] Generating reasoning...
[think] Thought: I need to search for information
[execute] Calling tool: search
[execute] Arguments: { query: "quantum computing" }
[observe] Result: { ... }
[observe] Updated scratchpad
```

### Streaming Responses

Stream intermediate results:

```typescript
const agent = createReActAgent({
  llm,
  tools,
  returnIntermediateSteps: true,
});

// Stream events
for await (const event of await agent.stream({
  messages: [new HumanMessage('Research topic')],
})) {
  if (event.thoughts) {
    console.log('💭', event.thoughts[event.thoughts.length - 1].content);
  }
  if (event.actions) {
    console.log('🔧', event.actions[event.actions.length - 1].tool);
  }
  if (event.observations) {
    console.log('👁️ ', event.observations[event.observations.length - 1].result);
  }
}
```

## Best Practices

### 1. Tool Design

**DO:**
- ✅ Keep tools focused and single-purpose
- ✅ Provide clear, descriptive names
- ✅ Write detailed descriptions
- ✅ Use Zod schemas for validation
- ✅ Handle errors gracefully
- ✅ Return structured data

**DON'T:**
- ❌ Create overly complex tools
- ❌ Use vague descriptions
- ❌ Skip input validation
- ❌ Throw unhandled errors
- ❌ Return inconsistent formats

Example:
```typescript
// ✅ GOOD
const searchTool = {
  name: 'search_articles',
  description: 'Search for academic articles by keyword. Returns title, abstract, and publication date.',
  schema: z.object({
    keyword: z.string().min(1).describe('Search keyword or phrase'),
    limit: z.number().min(1).max(10).default(5).describe('Maximum results'),
  }),
  execute: async ({ keyword, limit }) => {
    try {
      const results = await api.search(keyword, limit);
      return { success: true, results };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// ❌ BAD
const tool = {
  name: 'search',
  description: 'Search',
  schema: z.object({ q: z.string() }),
  execute: async ({ q }) => {
    return await api.search(q); // No error handling
  },
};
```

### 2. System Prompt Design

**Structure:**
```typescript
const systemPrompt = `
[ROLE]
You are a [specific role] that [specific purpose].

[GUIDELINES]
1. [Guideline 1]
2. [Guideline 2]
3. [Guideline 3]

[TOOLS]
- [Tool 1]: [When to use]
- [Tool 2]: [When to use]

[FORMAT]
- [Expected output format]
- [Quality criteria]
`;
```

**Example:**
```typescript
const systemPrompt = `
[ROLE]
You are a data analysis assistant that helps users understand datasets.

[GUIDELINES]
1. Always validate data before analysis
2. Show calculations step-by-step
3. Explain statistical concepts clearly
4. Highlight limitations and assumptions

[TOOLS]
- load_dataset: Use first to load data
- calculate_stats: Use for statistical analysis
- create_visualization: Use to create charts
- export_report: Use last to generate final report

[FORMAT]
- Start with data summary
- Show all calculations
- Include visualizations
- End with key insights
`;
```

### 3. Iteration Management

**Set appropriate limits:**
```typescript
// Simple tasks
maxIterations: 5

// Medium complexity
maxIterations: 10

// Complex research
maxIterations: 20

// With custom stop condition
maxIterations: 50
stopCondition: (state) => hasGoodAnswer(state)
```

### 4. Error Handling

**In tools:**
```typescript
const tool = {
  name: 'api_call',
  description: 'Call external API',
  schema: z.object({ endpoint: z.string() }),
  execute: async ({ endpoint }) => {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        return {
          success: false,
          error: `API returned ${response.status}`,
        };
      }
      return {
        success: true,
        data: await response.json(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
```

**In agent usage:**
```typescript
try {
  const result = await agent.invoke({
    messages: [new HumanMessage(query)],
  });

  if (result.iteration >= maxIterations) {
    console.warn('Agent reached max iterations');
  }

  return result;
} catch (error) {
  console.error('Agent error:', error);
  // Fallback logic
}
```

### 5. Performance Optimization

**Optimize tool execution:**
```typescript
// Parallel tool execution when possible
const tool = {
  name: 'batch_search',
  description: 'Search multiple sources',
  schema: z.object({
    queries: z.array(z.string()),
  }),
  execute: async ({ queries }) => {
    // Execute in parallel
    const results = await Promise.all(
      queries.map(q => searchAPI(q))
    );
    return { results };
  },
};
```

**Cache expensive operations:**
```typescript
const cache = new Map();

const tool = {
  name: 'expensive_operation',
  description: 'Perform expensive calculation',
  schema: z.object({ input: z.string() }),
  execute: async ({ input }) => {
    if (cache.has(input)) {
      return cache.get(input);
    }

    const result = await expensiveCalculation(input);
    cache.set(input, result);
    return result;
  },
};
```

## Common Patterns

### Pattern: Research Assistant

```typescript
const researchAgent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4', temperature: 0.2 }),
  tools: [
    searchTool,
    summarizeTool,
    citationTool,
    factCheckTool,
  ],
  systemPrompt: `You are a research assistant.
    1. Search for information from multiple sources
    2. Verify facts with fact-checking tool
    3. Summarize findings
    4. Provide citations`,
  maxIterations: 15,
  returnIntermediateSteps: true,
});
```

### Pattern: Data Analyst

```typescript
const analystAgent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4', temperature: 0 }),
  tools: [
    loadDataTool,
    calculateStatsTool,
    visualizeTool,
    exportTool,
  ],
  systemPrompt: `You are a data analyst.
    1. Load and validate data
    2. Calculate relevant statistics
    3. Create visualizations
    4. Export comprehensive report`,
  maxIterations: 10,
});
```

### Pattern: Customer Support

```typescript
const supportAgent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4', temperature: 0.3 }),
  tools: [
    lookupAccountTool,
    checkOrderStatusTool,
    createTicketTool,
    sendEmailTool,
  ],
  systemPrompt: `You are a customer support agent.
    1. Look up customer account
    2. Check order/ticket status
    3. Provide helpful solutions
    4. Create tickets for complex issues`,
  maxIterations: 8,
});
```

## Monitoring & Debugging

### Structured Logging

The ReAct pattern uses AgentForge's structured logging system with three dedicated loggers:

- `agentforge:patterns:react:reasoning` - Thought generation and decision making
- `agentforge:patterns:react:action` - Tool execution and observations
- `agentforge:patterns:react:observation` - Observation processing

### Enable Debug Logging

Set the `LOG_LEVEL` environment variable to see detailed execution logs:

```bash
# See everything (most verbose)
LOG_LEVEL=debug npm start

# See important events only (recommended for production)
LOG_LEVEL=info npm start

# See warnings and errors only
LOG_LEVEL=warn npm start
```

### Example Debug Output

With `LOG_LEVEL=debug`, you'll see detailed execution flow:

```
[2026-01-24T10:15:33.163Z] [DEBUG] [agentforge:patterns:react:reasoning] Reasoning node executing data={"iteration":1,"maxIterations":10}
[2026-01-24T10:15:33.164Z] [INFO] [agentforge:patterns:react:reasoning] Reasoning complete data={"iteration":1,"thoughtGenerated":true,"actionCount":2,"shouldContinue":true,"duration":125}
[2026-01-24T10:15:33.165Z] [DEBUG] [agentforge:patterns:react:action] Action node executing data={"iteration":1,"toolCallCount":2}
[2026-01-24T10:15:33.165Z] [DEBUG] [agentforge:patterns:react:action] Executing tool data={"toolName":"search","args":{"query":"weather"}}
[2026-01-24T10:15:33.166Z] [INFO] [agentforge:patterns:react:action] Action node complete data={"iteration":1,"toolsExecuted":2,"duplicatesSkipped":0,"totalObservations":2,"duration":89}
```

### Track Intermediate Steps

```typescript
const agent = createReActAgent({
  llm,
  tools,
  returnIntermediateSteps: true,
});

const result = await agent.invoke({ messages });

// Analyze the process
console.log('Reasoning steps:', result.thoughts.length);
console.log('Tools used:', result.actions.map(a => a.tool));
console.log('Iterations:', result.iteration);

// Check for issues
if (result.iteration >= maxIterations) {
  console.warn('Agent hit iteration limit');
}

if (result.actions.length === 0) {
  console.warn('Agent made no tool calls');
}
```

### Common Debugging Scenarios

#### Agent Not Stopping

```bash
LOG_LEVEL=debug npm start
```

Look for `shouldContinue` in "Reasoning complete" logs:
```
[INFO] [agentforge:patterns:react:reasoning] Reasoning complete data={"shouldContinue":true}
```

If `shouldContinue` is always `true`, the agent isn't detecting completion. Check your prompt or add explicit completion criteria.

#### Tool Not Being Called

```bash
LOG_LEVEL=debug npm start
```

Look for:
1. "Tool calls parsed" - Check if tool name is in the list
2. "Executing tool" - Verify the tool is actually being called
3. "Tool execution failed" - Check for errors

#### Slow Performance

```bash
LOG_LEVEL=info npm start
```

Check `duration` fields in completion logs:
```
[INFO] [agentforge:patterns:react:action] Action node complete data={"duration":5234}
```

If duration > 2000ms, investigate which tools are slow.

#### Cache Not Working

```bash
LOG_LEVEL=debug npm start
```

Look for cache metrics:
```
[INFO] [agentforge:patterns:react:action] Action node complete data={"duplicatesSkipped":3}
```

If `duplicatesSkipped` is 0 when you expect duplicates, check tool call deduplication configuration.

### Performance Monitoring

Monitor key metrics in INFO level logs:

```typescript
// Reasoning node metrics
{
  "iteration": 1,
  "thoughtGenerated": true,
  "actionCount": 2,
  "shouldContinue": true,
  "duration": 125  // milliseconds
}

// Action node metrics
{
  "iteration": 1,
  "toolsExecuted": 2,
  "duplicatesSkipped": 0,  // Cache hits
  "totalObservations": 2,
  "duration": 89
}
```

**Performance targets:**
- Reasoning node: < 500ms
- Action node: < 1000ms (depends on tool execution time)
- Cache hit rate: > 20% for repetitive tasks

### LangSmith Integration

```typescript
import { Client } from 'langsmith';

const client = new Client({
  apiKey: process.env.LANGSMITH_API_KEY,
});

// Traces automatically captured
const result = await agent.invoke(
  { messages },
  {
    runName: 'react-agent-run',
    tags: ['react', 'production'],
    metadata: { userId: 'user123' },
  }
);
```

### Filtering Logs

Use grep to filter logs by component:

```bash
# See only reasoning logs
LOG_LEVEL=debug npm start 2>&1 | grep "react:reasoning"

# See only errors
LOG_LEVEL=debug npm start 2>&1 | grep "ERROR"

# See only tool executions
LOG_LEVEL=debug npm start 2>&1 | grep "Executing tool"
```

For more debugging techniques, see the [Debugging Guide](../../../docs/DEBUGGING_GUIDE.md).

## Error Handling

### Tool Errors

```typescript
const robustTool = {
  name: 'api_call',
  description: 'Call external API',
  schema: z.object({ url: z.string() }),
  execute: async ({ url }) => {
    try {
      const response = await fetch(url, { timeout: 5000 });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return { success: true, data };

    } catch (error) {
      if (error.name === 'TimeoutError') {
        return { success: false, error: 'Request timeout' };
      }
      return { success: false, error: error.message };
    }
  },
};
```

### Agent-Level Error Handling

```typescript
async function runAgentSafely(query: string) {
  try {
    const result = await agent.invoke({
      messages: [new HumanMessage(query)],
    });

    // Check for incomplete execution
    if (result.iteration >= maxIterations) {
      return {
        success: false,
        error: 'Agent reached maximum iterations',
        partialResult: result,
      };
    }

    return { success: true, result };

  } catch (error) {
    console.error('Agent execution failed:', error);

    // Retry with simpler prompt
    try {
      const fallbackResult = await agent.invoke({
        messages: [new HumanMessage(`Simplified: ${query}`)],
      });
      return { success: true, result: fallbackResult, wasRetried: true };
    } catch (retryError) {
      return { success: false, error: retryError.message };
    }
  }
}
```

### Graceful Degradation

```typescript
const agent = createReActAgent({
  llm,
  tools,
  stopCondition: (state) => {
    // Stop if we have a partial answer after many iterations
    if (state.iteration >= 15) {
      const lastMessage = state.messages[state.messages.length - 1];
      return lastMessage.content.length > 100; // Accept partial answer
    }
    return false;
  },
});
```

## Performance Optimization

### 1. Reduce LLM Calls

```typescript
// Use lower temperature for deterministic tasks
const agent = createReActAgent({
  model: new ChatOpenAI({
    model: 'gpt-4',
    temperature: 0,  // Deterministic
  }),
  tools,
});

// Use faster model for simple tasks
const fastAgent = createReActAgent({
  model: new ChatOpenAI({
    model: 'gpt-3.5-turbo',  // Faster, cheaper
  }),
  tools,
  maxIterations: 5,  // Limit iterations
});
```

### 2. Optimize Tool Execution

```typescript
// Batch operations
const batchTool = {
  name: 'batch_lookup',
  description: 'Look up multiple items at once',
  schema: z.object({
    ids: z.array(z.string()),
  }),
  execute: async ({ ids }) => {
    // Single batch query instead of multiple calls
    const results = await db.findMany({ id: { in: ids } });
    return { results };
  },
};

// Parallel execution
const parallelTool = {
  name: 'multi_search',
  description: 'Search multiple sources',
  schema: z.object({
    sources: z.array(z.string()),
    query: z.string(),
  }),
  execute: async ({ sources, query }) => {
    const results = await Promise.all(
      sources.map(source => searchSource(source, query))
    );
    return { results };
  },
};
```

### 3. Caching

```typescript
import { InMemoryCache } from '@langchain/core/caches';

const llm = new ChatOpenAI({
  model: 'gpt-4',
  cache: new InMemoryCache(),  // Cache LLM responses
});

// Tool-level caching
const cache = new Map();
const cachedTool = {
  name: 'cached_search',
  description: 'Search with caching',
  schema: z.object({ query: z.string() }),
  execute: async ({ query }) => {
    const cacheKey = `search:${query}`;

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const result = await search(query);
    cache.set(cacheKey, result);
    return result;
  },
};
```

### 4. Early Stopping

```typescript
const agent = createReActAgent({
  llm,
  tools,
  stopCondition: (state) => {
    // Stop early if we have high-quality answer
    const lastMessage = state.messages[state.messages.length - 1];
    const content = lastMessage.content.toString();

    // Check for quality indicators
    const hasConfidence = content.includes('confident') ||
                         content.includes('certain');
    const hasEvidence = state.observations.length >= 2;
    const isComplete = content.length > 200;

    return hasConfidence && hasEvidence && isComplete;
  },
});
```

## Testing

### Unit Testing Nodes

```typescript
import { describe, it, expect } from 'vitest';
import { createReActAgent } from '@agentforge/patterns';

describe('ReActAgent', () => {
  it('should generate reasoning', async () => {
    const agent = createReActAgent({
      model: llm,
      tools,
      systemPrompt,
      maxIterations: 10,
    });

    const result = await agent.invoke({
      messages: [new HumanMessage('What is 2+2?')],
    });

    expect(result.messages).toBeDefined();
    expect(result.messages.length).toBeGreaterThan(0);
  });
});
```

### Integration Testing

```typescript
describe('ReAct Agent Integration', () => {
  it('should solve multi-step problem', async () => {
    const agent = createReActAgent({
      model: new ChatOpenAI({ model: 'gpt-4', temperature: 0 }),
      tools: [calculatorTool, searchTool],
      maxIterations: 10,
      returnIntermediateSteps: true,
    });

    const result = await agent.invoke({
      messages: [new HumanMessage('What is 15 * 8, and what is the weather in Tokyo?')],
    });

    // Verify multiple tools were used
    expect(result.actions.length).toBeGreaterThanOrEqual(2);
    expect(result.actions.some(a => a.tool === 'calculator')).toBe(true);
    expect(result.actions.some(a => a.tool === 'get_weather')).toBe(true);

    // Verify final answer
    const finalMessage = result.messages[result.messages.length - 1];
    expect(finalMessage.content).toContain('120');
    expect(finalMessage.content.toLowerCase()).toContain('tokyo');
  });

  it('should handle tool errors gracefully', async () => {
    const failingTool = {
      name: 'failing_tool',
      description: 'A tool that fails',
      schema: z.object({ input: z.string() }),
      execute: async () => {
        throw new Error('Tool failed');
      },
    };

    const agent = createReActAgent({
      model: new ChatOpenAI({ model: 'gpt-4' }),
      tools: [failingTool],
      maxIterations: 5,
    });

    // Should not throw, should handle gracefully
    const result = await agent.invoke({
      messages: [new HumanMessage('Use the failing tool')],
    });

    expect(result).toBeDefined();
  });
});
```

### Testing with Mock LLM

```typescript
import { FakeListChatModel } from '@langchain/core/utils/testing';

describe('ReAct with Mock LLM', () => {
  it('should work with predetermined responses', async () => {
    const mockLLM = new FakeListChatModel({
      responses: [
        'I need to use the calculator tool to compute 5 + 3',
        'The answer is 8',
      ],
    });

    const agent = createReActAgent({
      model: mockLLM,
      tools: [calculatorTool],
      maxIterations: 5,
    });

    const result = await agent.invoke({
      messages: [new HumanMessage('What is 5 + 3?')],
    });

    expect(result.messages.length).toBeGreaterThan(0);
  });
});
```

## API Reference

### createReActAgent()

Creates a compiled ReAct agent.

```typescript
function createReActAgent(
  config: ReActAgentConfig,
  options?: ReActBuilderOptions
): CompiledStateGraph
```

#### Parameters

**config: ReActAgentConfig**
- `model: BaseChatModel` - Language model instance
- `tools: ToolRegistry | Tool[]` - Available tools
- `systemPrompt?: string` - System prompt (default: standard ReAct prompt)
- `maxIterations?: number` - Maximum iterations (default: 10)
- `returnIntermediateSteps?: boolean` - Return thoughts/actions (default: false)
- `stopCondition?: (state: ReActStateType) => boolean` - Custom stop condition

**options: ReActBuilderOptions**
- `verbose?: boolean` - Enable logging (default: false)
- `nodeNames?: object` - Custom node names for observability
  - `reasoning?: string` - Reasoning node name
  - `action?: string` - Action node name
  - `observation?: string` - Observation node name

#### Returns

`CompiledStateGraph` - Compiled LangGraph agent

#### Example

```typescript
const agent = createReActAgent(
  {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    tools: toolRegistry,
    systemPrompt: 'You are a helpful assistant.',
    maxIterations: 10,
    returnIntermediateSteps: true,
    stopCondition: (state) => state.actions.length >= 5,
  },
  {
    verbose: true,
    nodeNames: {
      reasoning: 'think',
      action: 'act',
      observation: 'observe',
    },
  }
);
```

### State Types

> **Note**: Individual node creators (`createReasoningNode`, `createActionNode`, `createObservationNode`) are internal implementation details and not exported from the package. Use `createReActAgent` or `ReActAgentBuilder` for creating agents.

#### ReActStateType

```typescript
interface ReActStateType {
  messages: Message[];
  thoughts: Thought[];
  actions: ToolCall[];
  observations: ToolResult[];
  scratchpad: ScratchpadEntry[];
  iteration: number;
}
```

#### Thought

```typescript
interface Thought {
  content: string;
  timestamp: string;
  iteration: number;
}
```

#### ToolCall

```typescript
interface ToolCall {
  tool: string;
  arguments: Record<string, any>;
  timestamp: string;
  iteration: number;
}
```

#### ToolResult

```typescript
interface ToolResult {
  tool: string;
  result: any;
  success: boolean;
  error?: string;
  timestamp: string;
  iteration: number;
}
```

#### ScratchpadEntry

```typescript
interface ScratchpadEntry {
  step: number;
  thought?: string;
  action?: string;
  observation?: string;
  timestamp: string;
}
```

## Troubleshooting

### Agent loops without completing

**Symptoms:**
- Reaches max iterations
- Repeats same actions
- Doesn't provide final answer

**Debug with logging:**
```bash
LOG_LEVEL=debug npm start
```

Look for `shouldContinue` in "Reasoning complete" logs:
```
[INFO] [agentforge:patterns:react:reasoning] Reasoning complete data={"shouldContinue":true,"iteration":10}
```

If `shouldContinue` is always `true`, the agent isn't detecting completion.

**Solutions:**
```typescript
// 1. Add custom stop condition
stopCondition: (state) => {
  const lastMessage = state.messages[state.messages.length - 1];
  return lastMessage.content.length > 100 &&
         !lastMessage.additional_kwargs?.tool_calls;
}

// 2. Improve system prompt
systemPrompt: `...
When you have enough information, provide a final answer.
Do not repeat the same tool calls.
If a tool fails, try a different approach.`

// 3. Reduce max iterations
maxIterations: 5  // Force earlier completion
```

### Tools not being called

**Symptoms:**
- Agent provides answer without using tools
- No actions in result

**Debug with logging:**
```bash
LOG_LEVEL=debug npm start
```

Look for:
1. "Reasoning complete" - Check if `actionCount` is 0
2. "Tool calls parsed" - Check if tool name is in the list
3. "Executing tool" - Verify the tool is actually being called

Example log showing no tools called:
```
[INFO] [agentforge:patterns:react:reasoning] Reasoning complete data={"actionCount":0}
```

**Solutions:**
```typescript
// 1. Improve tool descriptions
const tool = {
  name: 'search',
  description: 'Search for current information. Use this when you need up-to-date data.',
  // ...
};

// 2. Update system prompt
systemPrompt: `You MUST use tools to answer questions.
Available tools: ${tools.map(t => t.name).join(', ')}
Always use tools before providing an answer.`

// 3. Check tool registration
console.log('Registered tools:', toolRegistry.getAll().map(t => t.name));
```

### Poor reasoning quality

**Symptoms:**
- Illogical tool selection
- Incomplete reasoning
- Wrong conclusions

**Solutions:**
```typescript
// 1. Use better model
model: new ChatOpenAI({ model: 'gpt-4' })  // vs gpt-3.5-turbo

// 2. Lower temperature
model: new ChatOpenAI({ temperature: 0 })  // More deterministic

// 3. Improve system prompt with examples
systemPrompt: `...
Example reasoning:
Thought: I need to find the weather in Tokyo
Action: Use get_weather tool with location="Tokyo"
Observation: Temperature is 72°F, sunny
Thought: I have the information needed
Action: Provide final answer`
```

### Excessive iterations

**Symptoms:**
- Takes too long to complete
- Uses many iterations for simple tasks

**Debug with logging:**
```bash
LOG_LEVEL=info npm start
```

Check `duration` fields to identify slow operations:
```
[INFO] [agentforge:patterns:react:action] Action node complete data={"duration":5234,"iteration":8}
```

If duration > 2000ms or iteration > 5 for simple tasks, investigate.

**Solutions:**
```typescript
// 1. Reduce max iterations
maxIterations: 5  // For simple tasks

// 2. Add early stopping
stopCondition: (state) => {
  // Stop if we have a good answer early
  return state.observations.length >= 2 &&
         state.messages[state.messages.length - 1].content.length > 150;
}

// 3. Simplify tools
// Break complex tools into simpler ones
// Remove unnecessary tools
```

### More Debugging Help

For comprehensive debugging techniques, see:
- [Debugging Guide](../../../docs/DEBUGGING_GUIDE.md) - Complete debugging reference
- [Logging Standards](../../../docs/LOGGING_STANDARDS.md) - Logging best practices
- [Logging Examples](../../../docs/examples/LOGGING_EXAMPLES.md) - Code examples

### Tool errors

**Symptoms:**
- Tools throw exceptions
- Unexpected tool behavior

**Solutions:**
```typescript
// 1. Add error handling in tools
execute: async (args) => {
  try {
    const result = await operation(args);
    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      fallback: 'default value'
    };
  }
}

// 2. Validate inputs
execute: async (args) => {
  // Validate before executing
  if (!args.required_field) {
    return { success: false, error: 'Missing required field' };
  }
  // ...
}

// 3. Add timeouts
execute: async (args) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 5000)
  );

  try {
    const result = await Promise.race([
      operation(args),
      timeout
    ]);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Memory issues

**Symptoms:**
- High memory usage
- Slow performance with long conversations

**Solutions:**
```typescript
// 1. Limit scratchpad size
const observationNode = createObservationNode(verbose);
const limitedObservationNode = async (state) => {
  const result = await observationNode(state);

  // Keep only last N entries
  if (result.scratchpad && result.scratchpad.length > 10) {
    result.scratchpad = result.scratchpad.slice(-10);
  }

  return result;
};

// 2. Summarize old messages
const summarizeOldMessages = (messages: Message[]) => {
  if (messages.length <= 10) return messages;

  const recent = messages.slice(-5);
  const summary = new SystemMessage(
    `Previous conversation summary: ${summarizeMessages(messages.slice(0, -5))}`
  );

  return [summary, ...recent];
};

// 3. Clear intermediate steps
returnIntermediateSteps: false  // Don't store all steps
```

## Comparison with Other Patterns

### ReAct vs Plan-Execute

| Aspect | ReAct | Plan-Execute |
|--------|-------|--------------|
| Planning | Dynamic, iterative | Upfront, structured |
| Flexibility | High - adapts on the fly | Lower - follows plan |
| Transparency | Very high - shows reasoning | Medium - shows plan |
| Best for | Exploratory tasks | Well-defined tasks |
| Iterations | Many small steps | Fewer large steps |
| Tool usage | Opportunistic | Planned |

**Use ReAct when:**
- Task is exploratory
- Requirements unclear
- Need to adapt based on results
- Want transparent reasoning

**Use Plan-Execute when:**
- Task is well-defined
- Can plan upfront
- Want structured execution
- Need parallel execution

### ReAct vs Reflection

| Aspect | ReAct | Reflection |
|--------|-------|------------|
| Focus | Action + Reasoning | Quality + Improvement |
| Iterations | Tool-driven | Critique-driven |
| Output | Final answer | Refined answer |
| Best for | Tool-based tasks | Quality-critical tasks |
| Complexity | Medium | Higher |

**Use ReAct when:**
- Need to use tools
- Focus on problem-solving
- Want step-by-step reasoning

**Use Reflection when:**
- Quality is critical
- Need iterative refinement
- Want self-critique

## Advanced Topics

### Combining Patterns

ReAct can be combined with other patterns:

```typescript
// ReAct + Reflection
const reactAgent = createReActAgent({ model: llm, tools });
const reflectionAgent = createReflectionAgent({
  generator: { model: llm },
  reflector: { model: llm },
  reviser: { model: llm },
  maxIterations: 3,
});

async function reactWithReflection(query: string) {
  // 1. Use ReAct to gather information
  const reactResult = await reactAgent.invoke({
    messages: [new HumanMessage(query)],
  });

  // 2. Use Reflection to refine the answer
  const finalAnswer = reactResult.messages[reactResult.messages.length - 1];
  const reflectionResult = await reflectionAgent.invoke({
    messages: [new HumanMessage(finalAnswer.content.toString())],
  });

  return reflectionResult;
}
```

### Multi-Agent ReAct

Multiple ReAct agents working together:

```typescript
const researchAgent = createReActAgent({
  llm,
  tools: [searchTool, summarizeTool],
  systemPrompt: 'You are a research specialist.',
});

const analysisAgent = createReActAgent({
  llm,
  tools: [calculateTool, visualizeTool],
  systemPrompt: 'You are a data analyst.',
});

async function multiAgentWorkflow(query: string) {
  // 1. Research phase
  const research = await researchAgent.invoke({
    messages: [new HumanMessage(`Research: ${query}`)],
  });

  // 2. Analysis phase
  const researchData = research.messages[research.messages.length - 1].content;
  const analysis = await analysisAgent.invoke({
    messages: [new HumanMessage(`Analyze: ${researchData}`)],
  });

  return analysis;
}
```

### Custom State Extensions

Extend the ReAct state for custom needs:

```typescript
import { Annotation } from '@langchain/langgraph';
import { ReActState } from '@agentforge/patterns';

// Extend ReAct state
const CustomReActState = Annotation.Root({
  ...ReActState.spec,

  // Add custom fields
  confidence: Annotation<number>({
    reducer: (_, right) => right,
    default: () => 0,
  }),

  sources: Annotation<string[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
});

// Use in custom workflow
const workflow = new StateGraph(CustomReActState)
  .addNode('reasoning', customReasoningNode)
  .addNode('action', customActionNode)
  // ...
```

## Resources

### Documentation
- [Examples](../examples/react/)
- [API Reference](#api-reference)
- [Test Suite](../tests/react/)

### Papers
- [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)
- [Chain-of-Thought Prompting](https://arxiv.org/abs/2201.11903)

### Related Patterns
- [Plan-Execute Pattern](./plan-execute-pattern.md)
- [Reflection Pattern](./reflection-pattern.md)

### Community
- [GitHub Discussions](https://github.com/your-repo/discussions)
- [Discord Community](https://discord.gg/your-server)

## Changelog

### v1.0.0
- Initial ReAct pattern implementation
- Basic reasoning, action, observation nodes
- Tool integration
- Scratchpad management
- Comprehensive documentation

### Future Enhancements
- [ ] Parallel tool execution
- [ ] Advanced caching strategies
- [ ] Tool recommendation system
- [ ] Automatic prompt optimization
- [ ] Multi-modal tool support

## Contributing

We welcome contributions! Areas for improvement:
- Additional examples
- Performance optimizations
- Better error messages
- Documentation improvements
- Test coverage

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../LICENSE) for details.

---

**Need help?** Check the [Troubleshooting](#troubleshooting) section or open an issue on GitHub.


