# ReAct Agent Example

A complete example of a ReAct (Reasoning and Acting) agent that can perform calculations, scrape web data, and answer questions.

## Overview

The ReAct pattern alternates between reasoning and acting:
1. **Reason** - Think about what to do next
2. **Act** - Use a tool or provide an answer
3. **Observe** - See the result
4. **Repeat** - Continue until task is complete

## Complete Example

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import {
  calculator,
  webScraper,
  currentDateTime
} from '@agentforge/tools';
// Create the agent
const agent = createReActAgent({
  model: new ChatOpenAI({
    model: 'gpt-4',
    temperature: 0
  }),

  tools: [
    calculator,
    webScraper,
    currentDateTime
  ],

  maxIterations: 10,

  systemPrompt: `You are a helpful research assistant.
Use the available tools to answer questions accurately.
Always show your reasoning process.
Cite sources when using web search.`
});

// Optional: Apply middleware to enhance the agent
// Note: Middleware wraps individual nodes, not the entire agent graph
// For production use, you can wrap specific nodes with middleware:
// import { production, withCache, withRateLimit } from '@agentforge/core';
// const enhancedNode = production(myNode, { nodeName: 'reasoning', enableMetrics: true });

// Use the agent
async function main() {
  const questions = [
    'What is the current time?',
    'Calculate the square root of 144',
    'What are the latest developments in AI?',
    'What is 15% of 250, and what time is it now?'
  ];

  for (const question of questions) {
    console.log(`\n❓ Question: ${question}`);
    
    const result = await agent.invoke({
      messages: [{
        role: 'user',
        content: question
      }]
    });

    const answer = result.messages[result.messages.length - 1].content;
    console.log(`✅ Answer: ${answer}`);
    
    // Show reasoning steps
    console.log('\n📝 Reasoning Steps:');
    result.messages.forEach((msg, i) => {
      if (msg.role === 'assistant') {
        console.log(`  ${i}. ${msg.content.substring(0, 100)}...`);
      }
    });
  }
}

main().catch(console.error);
```

## Output Example

```
❓ Question: What is 15% of 250, and what time is it now?

✅ Answer: 15% of 250 is 37.5, and the current time is 14:30:00 UTC.

📝 Reasoning Steps:
  1. I need to calculate 15% of 250 and get the current time...
  2. Let me use the calculator tool first...
  3. Now I'll get the current time...
  4. I have both pieces of information. Let me provide the answer...
```

## With Streaming

```typescript
import { createReActAgent } from '@agentforge/patterns';

const agent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [calculator, currentDateTime],
  maxIterations: 5
});

// Stream responses
const stream = await agent.stream({
  messages: [{
    role: 'user',
    content: 'What is the weather in London and calculate 15% of 250?'
  }]
});

for await (const chunk of stream) {
  if (chunk.type === 'text') {
    process.stdout.write(chunk.content);
  } else if (chunk.type === 'tool_call') {
    console.log(`\n🔧 Using tool: ${chunk.tool}`);
  }
}
```

## With State Persistence

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { MemorySaver } from '@langchain/langgraph';

const checkpointer = new MemorySaver();

const agent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [calculator, currentDateTime],
  checkpointer,
  maxIterations: 5
});

// First conversation
await agent.invoke({
  messages: [{ role: 'user', content: 'My name is Alice' }]
}, {
  configurable: { thread_id: 'user-123' }
});

// Continue conversation (remembers context)
await agent.invoke({
  messages: [{ role: 'user', content: 'What is my name?' }]
}, {
  configurable: { thread_id: 'user-123' }
});
```

## Error Handling

Middleware should be applied to individual nodes, not the agent itself:

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { withRetry, withTimeout } from '@agentforge/core';
import type { NodeFunction } from '@agentforge/core';

// Create the agent
const agent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4' }),
  tools: [calculator, currentDateTime],
  maxIterations: 5
});

// To apply middleware, you would wrap individual nodes in the graph
// For example, if you have access to the graph nodes:
// const enhancedNode = withRetry(
//   withTimeout(myNode, { timeout: 30000 }),
//   { maxAttempts: 3, backoff: 'exponential' }
// );

try {
  const result = await agent.invoke({
    messages: [{ role: 'user', content: 'Complex question...' }]
  });
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error.message);
}
```

## Testing

```typescript
import { describe, it, expect } from 'vitest';
import { MockLLM, AgentTestRunner } from '@agentforge/testing';
import { createReActAgent } from '@agentforge/patterns';
import { calculator } from '@agentforge/tools';

describe('ReAct Agent', () => {
  const mockLLM = new MockLLM({
    responses: [
      'Let me calculate that...',
      'The answer is 4'
    ]
  });

  const agent = createReActAgent({
    model: mockLLM as any,
    tools: [calculator],
    maxIterations: 3
  });

  const runner = new AgentTestRunner(agent, {
    timeout: 5000,
    captureSteps: true
  });

  it('should use tools correctly', async () => {
    const result = await runner.run({
      messages: [{ role: 'user', content: 'What is 2+2?' }]
    });

    expect(result.passed).toBe(true);
    harness.assertToolCalled('calculator');
  });

  it('should complete within iterations', async () => {
    const result = await harness.invoke('Calculate 10 * 5');
    harness.assertWithinIterations(3);
  });
});
```

## Key Features

- ✅ **Reasoning Loop** - Think before acting
- ✅ **Tool Integration** - Use multiple tools
- ✅ **Streaming Support** - Real-time responses
- ✅ **State Persistence** - Remember context
- ✅ **Error Handling** - Graceful failures
- ✅ **Middleware Support** - Caching, rate limiting, etc.

## When to Use ReAct

Use ReAct when you need:
- Multi-step reasoning
- Tool usage based on context
- Flexible problem-solving
- Iterative refinement

## Limitations

- Can be slower than simpler patterns
- May use more tokens
- Requires good tool descriptions
- Can get stuck in loops (use maxIterations)

## Next Steps

- [Plan-Execute Pattern](/examples/plan-execute) - For structured tasks
- [Reflection Pattern](/examples/reflection) - For quality improvement
- [Multi-Agent System](/examples/multi-agent) - For complex workflows

