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
interface ReActAgentConfig {
  // Required
  model: BaseChatModel;                    // The language model
  tools: ToolRegistry | Tool[];            // Available tools

  // Optional
  systemPrompt?: string;                   // System prompt (default: "You are a helpful assistant...")
  maxIterations?: number;                  // Max reasoning loops (default: 10)
  returnIntermediateSteps?: boolean;       // Include reasoning steps (default: false)
  stopCondition?: (state: ReActStateType) => boolean;  // Custom stop condition
  checkpointer?: BaseCheckpointSaver;      // For state persistence and human-in-the-loop
}
```

### Advanced Configuration

```typescript
const agent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [calculator, currentDateTime],

  // Custom system prompt
  systemPrompt: 'You are a helpful assistant that uses tools to solve problems.',

  // Limit iterations to prevent infinite loops
  maxIterations: 20,

  // Return intermediate steps for debugging
  returnIntermediateSteps: true,

  // Custom stop condition
  stopCondition: (state) => {
    return state.iteration >= 15 ||
           state.scratchpad.some(entry => entry.thought?.includes('FINAL_ANSWER'));
  },

  // Add checkpointer for state persistence
  checkpointer: new MemorySaver()
});
```

## Customization

### Custom System Prompt

```typescript
import { createReActAgent } from '@agentforge/patterns';

const agent = createReActAgent({
  model,
  tools,
  systemPrompt: `You are a helpful research assistant.
  
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
// Conditional tool availability - build tool list before creating agent
function getToolsForTask(taskType: string): Tool[] {
  const basicTools = [calculator, dateTime];

  if (taskType === 'web-scraping') {
    return [...basicTools, webScraper, htmlParser];
  }

  if (taskType === 'data-analysis') {
    return [...basicTools, jsonParser, csvParser];
  }

  return basicTools;
}

// Create agent with appropriate tools
const agent = createReActAgent({
  model,
  tools: getToolsForTask('web-scraping')
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
  maxIterations: 10,

  // Use custom stop condition to handle errors
  stopCondition: (state) => {
    // Stop if we've hit max iterations
    if (state.iteration >= 10) return true;

    // Stop if we have a response
    if (state.response) return true;

    // Stop if last observation indicates an error
    const lastObs = state.observations[state.observations.length - 1];
    if (lastObs?.error) {
      console.error('Tool error:', lastObs.error);
      return true;
    }

    return false;
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
  systemPrompt: `You are a thorough research assistant.

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
  systemPrompt: `You are a data analysis expert.

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
  systemPrompt: `You are a helpful customer support agent.

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

// Inspect reasoning steps from state
if (result.actions && result.observations) {
  result.actions.forEach((action, i) => {
    console.log(`Step ${i + 1}:`);
    console.log('Action:', action);
    console.log('Observation:', result.observations[i]);
  });
}

// Or inspect the scratchpad
console.log('Scratchpad:', result.scratchpad);
```

### Debug Agent State

```typescript
const agent = createReActAgent({
  model,
  tools,
  returnIntermediateSteps: true
});

const result = await agent.invoke(input);

// Access state fields
console.log('Iteration count:', result.iteration);
console.log('Actions taken:', result.actions);
console.log('Observations:', result.observations);
console.log('Scratchpad:', result.scratchpad);
```

## Performance Optimization

### 1. Limit Iterations

Reduce token usage by limiting the number of reasoning loops:

```typescript
const agent = createReActAgent({
  model,
  tools,
  maxIterations: 5,  // Limit to 5 reasoning loops

  // Or use a custom stop condition
  stopCondition: (state) => {
    // Stop early if we have enough information
    return state.iteration >= 3 && state.response !== undefined;
  }
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


