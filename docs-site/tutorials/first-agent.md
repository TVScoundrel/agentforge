# Your First Agent

In this tutorial, you'll build a complete AI agent from scratch in 15 minutes.

## What You'll Build

A weather assistant that can:
- Get current weather for any city
- Perform temperature conversions
- Answer weather-related questions

## Prerequisites

- Node.js 18+ installed
- Basic TypeScript knowledge
- OpenAI API key

## Step 1: Create Project

```bash
npx @agentforge/cli create weather-agent
cd weather-agent
pnpm install
```

## Step 2: Set Up Environment

Create `.env`:

```bash
OPENAI_API_KEY=your-api-key-here
```

## Step 3: Create Weather Tool

Create `src/tools/weather.ts`:

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

export const getWeather = toolBuilder()
  .name('get-weather')
  .description('Get current weather for a city')
  .category(ToolCategory.WEB)
  .tags(['weather', 'api'])
  .schema(z.object({
    city: z.string().describe('City name'),
    units: z.enum(['celsius', 'fahrenheit']).default('celsius')
  }))
  .examples([
    {
      input: { city: 'London', units: 'celsius' },
      output: { temperature: 15, condition: 'Cloudy' }
    }
  ])
  .implement(async ({ city, units }) => {
    // In production, call a real weather API
    // For demo, return mock data
    const temp = units === 'celsius' ? 15 : 59;
    
    return {
      success: true,
      data: {
        city,
        temperature: temp,
        units,
        condition: 'Partly Cloudy',
        humidity: 65,
        windSpeed: 10
      }
    };
  })
  .build();
```

## Step 4: Create Temperature Converter

Create `src/tools/converter.ts`:

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

export const convertTemperature = toolBuilder()
  .name('convert-temperature')
  .description('Convert temperature between Celsius and Fahrenheit')
  .category(ToolCategory.UTILITY)
  .schema(z.object({
    value: z.number().describe('Temperature value'),
    from: z.enum(['celsius', 'fahrenheit']),
    to: z.enum(['celsius', 'fahrenheit'])
  }))
  .implement(async ({ value, from, to }) => {
    if (from === to) {
      return { success: true, data: value };
    }

    let result: number;
    if (from === 'celsius' && to === 'fahrenheit') {
      result = (value * 9/5) + 32;
    } else {
      result = (value - 32) * 5/9;
    }

    return {
      success: true,
      data: {
        original: value,
        converted: Math.round(result * 10) / 10,
        from,
        to
      }
    };
  })
  .build();
```

## Step 5: Create the Agent

Create `src/agent.ts`:

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import { getWeather } from './tools/weather.js';
import { convertTemperature } from './tools/converter.js';

export const weatherAgent = createReActAgent({
  model: new ChatOpenAI({
    model: 'gpt-4',
    temperature: 0
  }),
  tools: [getWeather, convertTemperature],
  maxIterations: 5,
  systemPrompt: `You are a helpful weather assistant.
Use the available tools to answer weather questions.
Always provide temperature in both Celsius and Fahrenheit.
Be friendly and informative.`
});
```

## Step 6: Add Middleware

Create `src/middleware.ts`:

```typescript
import {
  withCache,
  withRateLimit,
  withLogging,
  compose,
  createSharedCache,
  createSharedRateLimiter
} from '@agentforge/core';
import type { NodeFunction } from '@agentforge/core';

// Create shared resources
const cache = createSharedCache({ maxSize: 100 });
const limiter = createSharedRateLimiter({ maxRequests: 10, windowMs: 60000 });

// Helper to enhance a node with middleware
export function withWeatherMiddleware<State>(node: NodeFunction<State>): NodeFunction<State> {
  return compose(
    withLogging({ name: 'weather-node', logInput: true, logOutput: true, logDuration: true }),
    (n) => cache.withCache(n, (state: any) => {
      const city = state.messages?.[0]?.content || '';
      return `weather:${city}`;
    }),
    (n) => limiter.withRateLimit(n, () => 'global')
  )(node);
}
```

## Step 7: Create Main Entry Point

Create `src/index.ts`:

```typescript
import 'dotenv/config';
import { weatherAgent } from './agent.js';

async function main() {
  console.log('🌤️  Weather Assistant Ready!\n');

  const questions = [
    'What is the weather in London?',
    'Convert 15 degrees Celsius to Fahrenheit',
    'What is the weather in Tokyo and convert the temperature to Fahrenheit?'
  ];

  for (const question of questions) {
    console.log(`\n❓ ${question}`);
    
    const result = await weatherAgent.invoke({
      messages: [{
        role: 'user',
        content: question
      }]
    });

    const answer = result.messages[result.messages.length - 1].content;
    console.log(`✅ ${answer}\n`);
  }
}

main().catch(console.error);
```

## Step 8: Run Your Agent

```bash
npx tsx src/index.ts
```

Expected output:

```
🌤️  Weather Assistant Ready!

❓ What is the weather in London?
✅ The current weather in London is partly cloudy with a temperature of 15°C (59°F).

❓ Convert 15 degrees Celsius to Fahrenheit
✅ 15°C is equal to 59°F.

❓ What is the weather in Tokyo and convert the temperature to Fahrenheit?
✅ The weather in Tokyo is partly cloudy with a temperature of 15°C, which is 59°F.
```

## Step 9: Add Tests

Create `src/agent.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { MockLLM, AgentTestHarness } from '@agentforge/testing';
import { createReActAgent } from '@agentforge/patterns';
import { getWeather, convertTemperature } from './tools/index.js';

describe('Weather Agent', () => {
  const mockLLM = new MockLLM({
    responses: [
      'The weather in London is 15°C (59°F) and partly cloudy.'
    ]
  });

  const agent = createReActAgent({
    model: mockLLM as any,
    tools: [getWeather, convertTemperature],
    maxIterations: 3
  });

  const harness = new AgentTestHarness(agent);

  it('should get weather', async () => {
    const result = await harness.invoke('What is the weather in London?');
    expect(result).toBeDefined();
  });

  it('should use weather tool', async () => {
    await harness.invoke('Weather in Paris?');
    harness.assertToolCalled('get-weather');
  });
});
```

Run tests:

```bash
pnpm test
```

## Next Steps

Congratulations! You've built your first agent. Now try:

- [Building Custom Tools](/tutorials/custom-tools) - Create more specialized tools
- [Advanced Patterns](/tutorials/advanced-patterns) - Use Plan-Execute or Reflection
- [Production Deployment](/tutorials/production-deployment) - Deploy your agent

## Complete Code

The complete code for this tutorial is available on [GitHub](https://github.com/agentforge/examples/tree/main/weather-agent).

