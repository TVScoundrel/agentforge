# Quick Start

This guide will walk you through building a complete AI agent in 10 minutes.

## What We'll Build

A research assistant agent that can:
- Search the web for information
- Perform calculations
- Answer questions with reasoning

## Step 1: Create Project

```bash
npx @agentforge/cli create research-assistant
cd research-assistant
pnpm install
```

## Step 2: Set Up Environment

**⚠️ Important: Do this BEFORE running your agent!**

First, copy the example environment file:

```bash
cp .env.example .env
```

Then edit `.env` and add your OpenAI API key:

```bash
OPENAI_API_KEY=your-api-key-here
LANGCHAIN_TRACING_V2=true  # Optional: for debugging
```

> **What happens if you skip this step?**
>
> If you don't set up your `.env` file with the required API keys, you'll get a clear error message telling you exactly what's missing and how to fix it. The agent won't start until all required environment variables are configured.

## Step 3: Create Custom Tools

Create `src/tools.ts`:

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

// Web search tool (mock for demo)
export const webSearch = toolBuilder()
  .name('web-search')
  .description('Search the web for current information')
  .category(ToolCategory.WEB)
  .tags(['search', 'web', 'information'])
  .schema(z.object({
    query: z.string().describe('Search query')
  }))
  .implement(async ({ query }) => {
    // In production, use a real search API
    return {
      success: true,
      data: {
        results: [
          {
            title: 'Example Result',
            snippet: `Information about: ${query}`,
            url: 'https://example.com'
          }
        ]
      }
    };
  })
  .build();
```

## Step 4: Create the Agent

Create `src/agent.ts`:

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import { calculator } from '@agentforge/tools';
import { webSearch } from './tools.js';

export const researchAgent = createReActAgent({
  model: new ChatOpenAI({
    model: 'gpt-4',
    temperature: 0
  }),
  tools: [webSearch, calculator],
  maxIterations: 5,
  systemPrompt: `You are a helpful research assistant. 
Use the available tools to find information and perform calculations.
Always cite your sources and show your reasoning.`
});
```

## Step 5: Add Middleware

Create `src/middleware.ts`:

```typescript
import { production } from '@agentforge/core/middleware';

export const productionMiddleware = production({
  retry: {
    maxAttempts: 3,
    delayMs: 1000
  },
  timeout: {
    timeoutMs: 30000
  },
  logging: {
    level: 'info'
  }
});
```

## Step 6: Create Main Entry Point

Create `src/index.ts`:

```typescript
import 'dotenv/config';
import { researchAgent } from './agent.js';

async function main() {
  console.log('🤖 Research Assistant Ready!\n');

  const questions = [
    'What is the capital of France?',
    'Calculate 15% of 250',
    'What is the population of Tokyo?'
  ];

  for (const question of questions) {
    console.log(`\n❓ Question: ${question}`);
    
    const result = await researchAgent.invoke({
      messages: [{
        role: 'user',
        content: question
      }]
    });

    const answer = result.messages[result.messages.length - 1].content;
    console.log(`✅ Answer: ${answer}\n`);
  }
}

main().catch(console.error);
```

## Step 7: Run Your Agent

```bash
npx tsx src/index.ts
```

You should see output like:

```
🤖 Research Assistant Ready!

❓ Question: What is the capital of France?
✅ Answer: The capital of France is Paris.

❓ Question: Calculate 15% of 250
✅ Answer: 15% of 250 is 37.5

❓ Question: What is the population of Tokyo?
✅ Answer: According to recent data, Tokyo has a population of approximately 14 million people.
```

## Step 8: Add Testing

Create `src/agent.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { MockLLM } from '@agentforge/testing';
import { createReActAgent } from '@agentforge/patterns';
import { calculator } from '@agentforge/tools';

describe('Research Agent', () => {
  it('should perform calculations', async () => {
    const mockLLM = new MockLLM({
      responses: ['The answer is 37.5']
    });

    const agent = createReActAgent({
      model: mockLLM as any,
      tools: [calculator],
      maxIterations: 3
    });

    const result = await agent.invoke({
      messages: [{
        role: 'user',
        content: 'Calculate 15% of 250'
      }]
    });

    expect(result.messages).toBeDefined();
    expect(result.messages.length).toBeGreaterThan(0);
  });
});
```

Run tests:

```bash
pnpm test
```

## What's Next?

Congratulations! You've built a complete AI agent. Now explore:

### Learn More
- [Core Concepts](/guide/concepts/tools) - Understand the fundamentals
- [Agent Patterns](/guide/patterns/react) - Explore different patterns
- [Middleware](/guide/concepts/middleware) - Add production features

### Build More
- [Custom Tools Tutorial](/tutorials/custom-tools) - Create specialized tools
- [Advanced Patterns](/tutorials/advanced-patterns) - Complex agent systems
- [Production Deployment](/tutorials/production-deployment) - Deploy to production

### Examples
- [Plan-Execute Agent](/examples/plan-execute) - Multi-step planning
- [Reflection Agent](/examples/reflection) - Self-improving agents
- [Multi-Agent System](/examples/multi-agent) - Coordinated agents

