# Testing Tutorial

Learn how to test your AgentForge applications with mocks, fixtures, and integration tests.

## Overview

This tutorial covers:

- **Unit Testing** - Test individual components
- **Mock Factories** - Create mock LLMs and tools
- **Integration Testing** - Test complete agent workflows
- **Snapshot Testing** - Verify state consistency
- **Best Practices** - Testing strategies and patterns

## Prerequisites

- Completed [Your First Agent](/tutorials/first-agent)
- Basic testing knowledge (Vitest/Jest)
- Node.js 20+ installed

## Setup

### Install Testing Package

```bash
pnpm add -D @agentforge/testing vitest
```

### Configure Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/'],
    },
  },
});
```

### Project Structure

```
my-agent/
├── src/
│   ├── agent.ts
│   └── tools/
│       └── search.ts
├── tests/
│   ├── unit/
│   │   ├── agent.test.ts
│   │   └── tools/
│   │       └── search.test.ts
│   └── integration/
│       └── agent.test.ts
├── package.json
└── vitest.config.ts
```

## Unit Testing

### Testing Tools

Test individual tools in isolation:

```typescript
// tests/unit/tools/search.test.ts
import { describe, it, expect } from 'vitest';
import { searchTool } from '../../../src/tools/search';

describe('Search Tool', () => {
  it('should search and return results', async () => {
    const result = await searchTool.invoke({
      query: 'AgentForge',
      limit: 5
    });
    
    expect(result).toBeDefined();
    expect(result).toContain('AgentForge');
  });
  
  it('should handle empty queries', async () => {
    await expect(
      searchTool.invoke({ query: '', limit: 5 })
    ).rejects.toThrow('Query cannot be empty');
  });
  
  it('should respect limit parameter', async () => {
    const result = await searchTool.invoke({
      query: 'test',
      limit: 3
    });
    
    const results = JSON.parse(result);
    expect(results.length).toBeLessThanOrEqual(3);
  });
});
```

### Testing with Mock LLM

Test agents with mock language models:

```typescript
// tests/unit/agent.test.ts
import { describe, it, expect } from 'vitest';
import { createMockLLM } from '@agentforge/testing';
import { createReActAgent } from '@agentforge/patterns';
import { searchTool } from '../../src/tools/search';

describe('Agent', () => {
  it('should respond to greetings', async () => {
    const mockLLM = createMockLLM({
      responses: ['Hello! How can I help you today?']
    });
    
    const agent = createReActAgent({
      model: mockLLM as any,
      tools: [searchTool],
      maxIterations: 5
    });
    
    const result = await agent.invoke({
      messages: [{ role: 'user', content: 'Hi' }]
    });
    
    expect(result.messages).toBeDefined();
    expect(result.messages.length).toBeGreaterThan(0);
  });
  
  it('should use tools when needed', async () => {
    const mockLLM = createMockLLM({
      responseGenerator: (messages) => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.content.includes('search')) {
          return 'I will search for that information.';
        }
        return 'Here are the results.';
      }
    });
    
    const agent = createReActAgent({
      model: mockLLM as any,
      tools: [searchTool],
      maxIterations: 10
    });
    
    const result = await agent.invoke({
      messages: [{ role: 'user', content: 'Search for AgentForge' }]
    });
    
    expect(result.messages).toBeDefined();
  });
});
```

### Testing with Mock Tools

Test agents with mock tools:

```typescript
import { createMockTool, createCalculatorTool } from '@agentforge/testing';
import { z } from 'zod';

describe('Agent with Mock Tools', () => {
  it('should use calculator tool', async () => {
    const calcTool = createCalculatorTool();
    
    const mockLLM = createMockLLM({
      responses: ['The result is 4']
    });
    
    const agent = createReActAgent({
      model: mockLLM as any,
      tools: [calcTool],
      maxIterations: 5
    });
    
    const result = await agent.invoke({
      messages: [{ role: 'user', content: 'What is 2+2?' }]
    });
    
    expect(result.messages).toBeDefined();
  });
  
  it('should handle tool errors', async () => {
    const errorTool = createMockTool({
      name: 'error_tool',
      shouldError: true,
      errorMessage: 'Tool failed'
    });
    
    const mockLLM = createMockLLM({
      responses: ['I encountered an error']
    });
    
    const agent = createReActAgent({
      model: mockLLM as any,
      tools: [errorTool],
      maxIterations: 5
    });
    
    // Agent should handle tool errors gracefully
    const result = await agent.invoke({
      messages: [{ role: 'user', content: 'Use the error tool' }]
    });
    
    expect(result.messages).toBeDefined();
  });
});
```

## Integration Testing

### Testing Complete Workflows

Test end-to-end agent workflows:

```typescript
// tests/integration/agent.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import {
  createAgentTestRunner,
  createStateBuilder,
  assertMessageContains,
  assertCompletesWithin,
} from '@agentforge/testing';
import { agent } from '../../src/agent';

describe('Agent Integration Tests', () => {
  let runner: ReturnType<typeof createAgentTestRunner>;

  beforeAll(() => {
    runner = createAgentTestRunner(agent, {
      timeout: 10000,
      captureSteps: true,
      validateState: true,
    });
  });

  it('should complete simple queries', async () => {
    const state = createStateBuilder()
      .addHumanMessage('What is 2+2?')
      .build();

    const result = await runner.run(state);

    expect(result.passed).toBe(true);
    expect(result.messages.length).toBeGreaterThan(0);
    assertMessageContains(result.messages, '4');
  });

  it('should handle multi-step reasoning', async () => {
    const state = createStateBuilder()
      .addHumanMessage('Search for AgentForge and summarize the results')
      .build();

    const result = await runner.run(state);

    expect(result.passed).toBe(true);
    expect(result.steps).toBeDefined();
    expect(result.steps!.length).toBeGreaterThan(1);
  });

  it('should complete within time limit', async () => {
    await assertCompletesWithin(async () => {
      const state = createStateBuilder()
        .addHumanMessage('Hello')
        .build();

      await runner.run(state);
    }, 5000);
  });
});
```

### Testing Conversations

Test multi-turn conversations:

```typescript
import { createConversationSimulator } from '@agentforge/testing';

describe('Conversation Tests', () => {
  it('should maintain context across turns', async () => {
    const simulator = createConversationSimulator(agent, {
      maxTurns: 10,
      validateContext: true,
    });

    const conversation = await simulator.simulate([
      'My name is Alice',
      'What is my name?',
      'What did I just tell you?',
    ]);

    expect(conversation.turns.length).toBe(3);
    assertMessageContains(conversation.turns[1].response, 'Alice');
    assertMessageContains(conversation.turns[2].response, 'name');
  });

  it('should handle context switching', async () => {
    const simulator = createConversationSimulator(agent);

    const conversation = await simulator.simulate([
      'Tell me about AI',
      'Now tell me about databases',
      'What was the first topic?',
    ]);

    expect(conversation.turns.length).toBe(3);
    assertMessageContains(conversation.turns[2].response, 'AI');
  });
});
```

## Test Helpers

### State Builder

Build complex test states easily:

```typescript
import { createStateBuilder, createReActState } from '@agentforge/testing';

describe('State Builder', () => {
  it('should build conversation state', () => {
    const state = createStateBuilder()
      .addSystemMessage('You are a helpful assistant')
      .addHumanMessage('Hello')
      .addAIMessage('Hi there!')
      .addHumanMessage('How are you?')
      .set('customField', 'value')
      .build();

    expect(state.messages.length).toBe(4);
    expect(state.customField).toBe('value');
  });

  it('should build ReAct state', () => {
    const state = createReActState({
      messages: [],
      thoughts: ['I need to search for information'],
      toolCalls: [{ name: 'search', args: { query: 'test' } }],
      iterations: 1,
      maxIterations: 10,
    });

    expect(state.thoughts.length).toBe(1);
    expect(state.toolCalls.length).toBe(1);
    expect(state.iterations).toBe(1);
  });
});
```

### Assertions

Use helpful assertion functions:

```typescript
import {
  assertMessageContains,
  assertLastMessageContains,
  assertToolCalled,
  assertStateHasFields,
  assertIterationsWithinLimit,
} from '@agentforge/testing';

describe('Assertions', () => {
  it('should assert message content', () => {
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ];

    assertMessageContains(messages, 'Hello');
    assertLastMessageContains(messages, 'Hi there');
  });

  it('should assert tool calls', () => {
    const toolCalls = [
      { name: 'calculator', args: { operation: 'add', a: 2, b: 2 } },
    ];

    assertToolCalled(toolCalls, 'calculator', { operation: 'add' });
  });

  it('should assert state fields', () => {
    const state = {
      messages: [],
      iterations: 5,
      maxIterations: 10,
    };

    assertStateHasFields(state, ['messages', 'iterations']);
    assertIterationsWithinLimit(state, 10);
  });
});
```

## Snapshot Testing

### State Snapshots

Test state consistency with snapshots:

```typescript
import { assertStateSnapshot, createStateDiff } from '@agentforge/testing';

describe('Snapshot Tests', () => {
  it('should match state snapshot', () => {
    const state = createStateBuilder()
      .addHumanMessage('Hello')
      .addAIMessage('Hi')
      .build();

    assertStateSnapshot(state);
  });

  it('should detect state changes', () => {
    const stateBefore = { count: 0, messages: [] };
    const stateAfter = { count: 1, messages: ['new'] };

    const diff = createStateDiff(stateBefore, stateAfter);

    expect(diff.changed).toEqual({
      count: { from: 0, to: 1 },
      messages: { from: [], to: ['new'] },
    });
  });
});
```

## Fixtures

### Using Pre-built Fixtures

Use sample data for testing:

```typescript
import {
  simpleGreeting,
  multiTurnConversation,
  toolUsageConversation,
  sampleTools,
  calculatorTool,
} from '@agentforge/testing';

describe('Fixtures', () => {
  it('should use sample conversations', () => {
    expect(simpleGreeting.length).toBeGreaterThan(0);
    expect(multiTurnConversation.length).toBeGreaterThan(2);
  });

  it('should use sample tools', () => {
    expect(sampleTools.length).toBeGreaterThan(0);
    expect(calculatorTool).toBeDefined();
  });
});
```

## Testing Patterns

### Testing ReAct Agents

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { createMockLLM, createMockTool } from '@agentforge/testing';

describe('ReAct Agent', () => {
  it('should follow think-act-observe loop', async () => {
    const mockLLM = createMockLLM({
      responses: [
        'I need to search for information',
        'Based on the results, the answer is...',
      ]
    });

    const searchTool = createMockTool({
      name: 'search',
      implementation: async () => 'Search results...',
    });

    const agent = createReActAgent({
      model: mockLLM as any,
      tools: [searchTool],
      maxIterations: 10,
    });

    const result = await agent.invoke({
      messages: [{ role: 'user', content: 'Search for AI' }]
    });

    expect(result.messages).toBeDefined();
  });
});
```

### Testing Plan-Execute Agents

```typescript
import { createPlanExecuteAgent } from '@agentforge/patterns';

describe('Plan-Execute Agent', () => {
  it('should create and execute plan', async () => {
    const mockLLM = createMockLLM({
      responses: [
        'Step 1: Search\nStep 2: Analyze\nStep 3: Report',
        'Execution complete',
      ]
    });

    const agent = createPlanExecuteAgent({
      planner: { model: mockLLM as any, maxSteps: 5 },
      executor: { tools: sampleTools },
    });

    const result = await agent.invoke({
      input: 'Research and analyze AI trends',
    });

    expect(result.plan).toBeDefined();
    expect(result.pastSteps).toBeDefined();
  });
});
```

## Best Practices

### 1. Isolate Tests

```typescript
// ✅ Good - isolated test
it('should add numbers', async () => {
  const tool = createCalculatorTool();
  const result = await tool.invoke({ operation: 'add', a: 2, b: 2 });
  expect(result).toBe('4');
});

// ❌ Bad - depends on external state
let sharedTool;
it('should create tool', () => {
  sharedTool = createCalculatorTool();
});
it('should use tool', async () => {
  const result = await sharedTool.invoke({ operation: 'add', a: 2, b: 2 });
  expect(result).toBe('4');
});
```

### 2. Use Descriptive Names

```typescript
// ✅ Good - descriptive
it('should return error when dividing by zero', async () => {
  // ...
});

// ❌ Bad - vague
it('should work', async () => {
  // ...
});
```

### 3. Test Edge Cases

```typescript
describe('Calculator Tool', () => {
  it('should handle normal operations', async () => {
    // Test normal case
  });

  it('should handle division by zero', async () => {
    // Test edge case
  });

  it('should handle very large numbers', async () => {
    // Test edge case
  });

  it('should handle negative numbers', async () => {
    // Test edge case
  });
});
```

### 4. Mock External Dependencies

```typescript
// ✅ Good - mock external API
const mockSearchTool = createMockTool({
  name: 'search',
  implementation: async () => 'Mocked results',
});

// ❌ Bad - call real API in tests
const realSearchTool = createSearchTool({
  apiKey: process.env.API_KEY,
});
```

## Running Tests

### Run All Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test --coverage

# Run in watch mode
pnpm test --watch
```

### Run Specific Tests

```bash
# Run unit tests only
pnpm test tests/unit

# Run integration tests only
pnpm test tests/integration

# Run specific file
pnpm test tests/unit/agent.test.ts
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm test --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## Next Steps

- [Production Deployment](/tutorials/production-deployment) - Deploy tested agents
- [Advanced Patterns](/tutorials/advanced-patterns) - Test complex workflows
- [API Reference](/api/testing) - Complete testing API
- [@agentforge/testing Package](/api/testing) - Full documentation

