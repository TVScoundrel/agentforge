# ReAct Pattern

The **ReAct** (Reasoning and Acting) pattern is one of the most popular and versatile agent patterns. It combines reasoning (thinking about what to do) with acting (using tools to accomplish tasks) in an iterative loop.

## Overview

ReAct agents follow a simple but powerful loop:

1. **Reason** - The LLM thinks about the current state and decides what action to take
2. **Act** - Execute a tool based on the reasoning
3. **Observe** - Receive the tool's output
4. **Repeat** - Continue until the task is complete

This pattern is inspired by the [ReAct paper](https://arxiv.org/abs/2210.03629) from Princeton and Google.

## When to Use ReAct

✅ **Good for:**
- General-purpose task solving
- Tasks requiring multiple tool calls
- Exploratory or research tasks
- When you need flexibility and adaptability
- Interactive applications

❌ **Not ideal for:**
- Tasks requiring complex multi-step planning (use [Plan-Execute](/guide/patterns/plan-execute) instead)
- When you need guaranteed execution order (use [Plan-Execute](/guide/patterns/plan-execute) instead)
- Tasks that benefit from self-critique and revision (use [Reflection](/guide/patterns/reflection) instead)

::: tip Pattern Comparison
Not sure which pattern to use? See the [Agent Patterns Overview](/guide/concepts/patterns) for a detailed comparison of all patterns.
:::

## Basic Usage

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import { calculator, webScraper, fileReader } from '@agentforge/tools';

const agent = createReActAgent({
  model: new ChatOpenAI({
    model: 'gpt-4',
    temperature: 0
  }),
  tools: [calculator, webScraper, fileReader],
  maxIterations: 10
});

const result = await agent.invoke({
  messages: [{
    role: 'user',
    content: 'Calculate 15 * 7 and read the contents of data.txt'
  }]
});

console.log(result.messages[result.messages.length - 1].content);
```

## Configuration Options

### Core Options

```typescript
interface ReActConfig {
  // Required
  model: BaseChatModel;           // The language model
  tools: StructuredTool[];      // Available tools

  // Optional
  maxIterations?: number;       // Max reasoning loops (default: 15)
  returnIntermediateSteps?: boolean;  // Include reasoning steps (default: false)
  handleParsingErrors?: boolean | string;  // How to handle errors
  trimIntermediateSteps?: number;  // Keep only N recent steps
}
```

### Advanced Configuration

```typescript
const agent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [calculator, currentDateTime],

  // Limit iterations to prevent infinite loops
  maxIterations: 20,
  
  // Return intermediate steps for debugging
  returnIntermediateSteps: true,
  
  // Trim old steps to save tokens
  trimIntermediateSteps: 5,
  
  // Custom error handling
  handleParsingErrors: 'Check your output and make sure it conforms to the schema!'
});
```

## Customization

### Custom System Prompt

```typescript
import { createReActAgent } from '@agentforge/patterns';

const agent = createReActAgent({
  model,
  tools,
  systemMessage: `You are a helpful research assistant.
  
When solving tasks:
1. Break down complex questions into steps
2. Use tools to gather information
3. Synthesize findings into clear answers
4. Cite your sources

Always be thorough and accurate.`
});
```

### Tool Selection Strategy

```typescript
// Conditional tool availability
const agent = createReActAgent({
  model,
  tools: async (state) => {
    // Only provide expensive tools if needed
    const basicTools = [calculator, dateTime];

    if (state.messages.some(m => m.content.includes('scrape'))) {
      return [...basicTools, webScraper, htmlParser];
    }

    return basicTools;
  }
});
```

### State Persistence with Checkpointer

Enable conversation continuity and human-in-the-loop workflows with checkpointers:

```typescript
import { MemorySaver } from '@langchain/langgraph';
import { createReActAgent } from '@agentforge/patterns';
import { createAskHumanTool } from '@agentforge/tools';

// Create agent with checkpointer
const agent = createReActAgent({
  model,
  tools: [createAskHumanTool(), calculator, webSearch],
  checkpointer: new MemorySaver()
});

// Start a conversation with a thread ID
const result1 = await agent.invoke(
  { messages: [{ role: 'user', content: 'What is 2+2?' }] },
  { configurable: { thread_id: 'user-123' } }
);

// Resume the same conversation later
const result2 = await agent.invoke(
  { messages: [{ role: 'user', content: 'And what about 3+3?' }] },
  { configurable: { thread_id: 'user-123' } }  // Same thread ID
);
```

**For nested agents in multi-agent systems:**

```typescript
import { ReActAgentBuilder } from '@agentforge/patterns';

// Worker agent that uses parent's checkpointer
const hrAgent = new ReActAgentBuilder()
  .withModel(model)
  .withTools([askHumanTool, slackTool])
  .withCheckpointer(true)  // Use parent's checkpointer with separate namespace
  .build();

// When used in a multi-agent system:
// - The agent stores state in a separate namespace (e.g., thread_abc:worker:hr)
// - Supports interrupts (askHuman tool) without causing infinite loops
// - Can be resumed independently from other workers
```

**Benefits:**
- **Conversation continuity**: Resume conversations across sessions
- **Human-in-the-loop**: Request user input mid-execution with `askHuman` tool
- **Multi-agent coordination**: Enable worker agents to interrupt and resume independently
- **Error recovery**: Resume from failures without losing progress

## Streaming

ReAct agents support streaming for real-time updates:

```typescript
const stream = await agent.stream({
  messages: [{ role: 'user', content: 'Research quantum computing' }]
});

for await (const chunk of stream) {
  if (chunk.agent) {
    console.log('Thinking:', chunk.agent.messages);
  }
  if (chunk.tools) {
    console.log('Using tool:', chunk.tools);
  }
}
```

## Error Handling

```typescript
import { createReActAgent } from '@agentforge/patterns';

const agent = createReActAgent({
  model,
  tools,
  
  // Option 1: Boolean - use default error message
  handleParsingErrors: true,
  
  // Option 2: Custom error message
  handleParsingErrors: 'Invalid format. Please use the correct tool schema.',
  
  // Option 3: Custom error handler function
  handleParsingErrors: (error: Error) => {
    console.error('Parsing error:', error);
    return `Error: ${error.message}. Please try again with valid JSON.`;
  }
});
```

## Best Practices

### 1. Limit Iterations

Always set a reasonable `maxIterations` to prevent infinite loops:

```typescript
const agent = createReActAgent({
  model,
  tools,
  maxIterations: 15  // Prevent runaway loops
});
```

### 2. Provide Clear Tool Descriptions

The agent relies on tool descriptions to decide which tool to use:

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';

const weatherTool = toolBuilder()
  .name('get-weather')
  .description('Get current weather for a city. Use this when the user asks about weather, temperature, or conditions.')
  .category(ToolCategory.WEB)
  .schema(z.object({
    city: z.string().describe('The city name, e.g., "San Francisco"'),
    units: z.enum(['celsius', 'fahrenheit']).default('celsius')
  }))
  .implement(async ({ city, units }) => {
    // Implementation
  })
  .build();
```

### 3. Use Temperature = 0 for Consistency

For deterministic behavior, use temperature 0:

```typescript
const agent = createReActAgent({
  model: new ChatOpenAI({
    model: 'gpt-4',
    temperature: 0  // Deterministic reasoning
  }),
  tools
});
```

### 4. Monitor Token Usage

Track token consumption to optimize costs:

```typescript
const result = await agent.invoke(input, {
  callbacks: [{
    handleLLMEnd: (output) => {
      console.log('Tokens used:', output.llmOutput?.tokenUsage);
    }
  }]
});
```

## Common Patterns

### Research Assistant

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { webScraper, htmlParser, calculator } from '@agentforge/tools';

const researchAgent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [webScraper, htmlParser, calculator],
  maxIterations: 20,
  systemMessage: `You are a thorough research assistant.

For each query:
1. Search multiple sources
2. Cross-reference information
3. Provide citations
4. Summarize findings clearly`
});
```

### Data Analysis Agent

```typescript
import { fileReader, csvParser, calculator } from '@agentforge/tools';

const dataAgent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [fileReader, csvParser, calculator],
  systemMessage: `You are a data analysis expert.

When analyzing data:
1. Read the data file first
2. Use Python for complex calculations
3. Explain your methodology
4. Provide visualizations when helpful`
});
```

### Customer Support Agent

```typescript
import { knowledgeBaseSearch, ticketCreate, emailSend } from './custom-tools';

const supportAgent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [knowledgeBaseSearch, ticketCreate, emailSend],
  maxIterations: 10,
  systemMessage: `You are a helpful customer support agent.

Always:
- Search the knowledge base first
- Be polite and professional
- Create tickets for unresolved issues
- Confirm actions with the user`
});
```

## Debugging

### Enable Verbose Logging

```typescript
const agent = createReActAgent({
  model,
  tools,
  returnIntermediateSteps: true
});

const result = await agent.invoke(input);

// Inspect reasoning steps
result.intermediateSteps.forEach((step, i) => {
  console.log(`Step ${i + 1}:`);
  console.log('Action:', step.action);
  console.log('Observation:', step.observation);
});
```

### Visualize Agent Flow

```typescript
import { visualizeAgentExecution } from '@agentforge/core';

const result = await agent.invoke(input, {
  returnIntermediateSteps: true
});

// Generate Mermaid diagram
const diagram = visualizeAgentExecution(result);
console.log(diagram);
```

## Performance Optimization

### 1. Trim Intermediate Steps

Reduce token usage by keeping only recent steps:

```typescript
const agent = createReActAgent({
  model,
  tools,
  trimIntermediateSteps: 5  // Keep only last 5 steps
});
```

### 2. Use Faster Models for Simple Tasks

```typescript
const agent = createReActAgent({
  model: new ChatOpenAI({
    model: 'gpt-3.5-turbo',  // Faster and cheaper
    temperature: 0
  }),
  tools,
  maxIterations: 10
});
```

### 3. Cache Tool Results

```typescript
import { withCache } from '@agentforge/core';

const cachedWebScraper = withCache(webScraper, {
  ttl: 3600,  // Cache for 1 hour
  keyFn: (input) => input.url
});

const agent = createReActAgent({
  model,
  tools: [cachedWebScraper, calculator]
});
```

## Next Steps

- [Plan-Execute Pattern](/guide/patterns/plan-execute) - For complex multi-step tasks
- [Reflection Pattern](/guide/patterns/reflection) - For self-improving agents
- [Multi-Agent Pattern](/guide/patterns/multi-agent) - For collaborative agents
- [API Reference](/api/patterns#react) - Complete API documentation

## Further Reading

- [ReAct Paper](https://arxiv.org/abs/2210.03629) - Original research paper
- [LangGraph ReAct](https://langchain-ai.github.io/langgraph/tutorials/react/) - LangGraph tutorial
- [Examples](/examples/react-agent) - Working code examples


