# @agentforge/testing

> Testing utilities and helpers for the AgentForge framework

[![npm version](https://img.shields.io/npm/v/@agentforge/testing)](https://www.npmjs.com/package/@agentforge/testing)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](../../LICENSE)

## 🎉 Status: Production Ready & Published

**Complete testing toolkit** | **Full TypeScript support** | **Comprehensive documentation**

## 📦 Installation

```bash
npm install --save-dev @agentforge/testing
# or
pnpm add -D @agentforge/testing
# or
yarn add -D @agentforge/testing
```

## ✨ Features

- 🎭 **Mock Factories** - Create mock LLMs, tools, and states for testing
- 🔧 **Test Helpers** - Assertion helpers and state builders
- 📦 **Fixtures** - Pre-built sample agents, tools, and conversations
- 🏃 **Test Runners** - Agent test runner and conversation simulator
- 📸 **Snapshot Testing** - State and message snapshot utilities
- ✅ **Full TypeScript** - Complete type safety and inference
- 🧪 **Vitest Integration** - Works seamlessly with Vitest

## Quick Start

```typescript
import { describe, it, expect } from 'vitest';
import {
  createMockLLM,
  createMockTool,
  createStateBuilder,
  createAgentTestRunner,
  assertMessageContains,
} from '@agentforge/testing';

describe('My Agent', () => {
  it('should respond to greetings', async () => {
    // Create mock LLM
    const llm = createMockLLM({
      responses: ['Hello! How can I help you?']
    });
    
    // Create test state
    const state = createStateBuilder()
      .addHumanMessage('Hi')
      .build();
    
    // Run agent
    const runner = createAgentTestRunner(agent);
    const result = await runner.run(state);
    
    // Assert
    expect(result.passed).toBe(true);
    assertMessageContains(result.messages, 'Hello');
  });
});
```

## Mock Factories

### Mock LLM

Create mock language models for testing:

```typescript
import { createMockLLM, createEchoLLM, createErrorLLM } from '@agentforge/testing';

// Basic mock with predefined responses
const llm = createMockLLM({
  responses: ['Response 1', 'Response 2']
});

// Echo LLM (echoes input)
const echoLLM = createEchoLLM();

// Error LLM (always throws)
const errorLLM = createErrorLLM('Custom error message');

// Custom response generator
const customLLM = createMockLLM({
  responseGenerator: (messages) => {
    const lastMsg = messages[messages.length - 1];
    return `You said: ${lastMsg.content}`;
  }
});
```

### Mock Tools

Create mock tools for testing:

```typescript
import { createMockTool, createEchoTool, createCalculatorTool } from '@agentforge/testing';
import { z } from 'zod';

// Basic mock tool
const tool = createMockTool({
  name: 'my_tool',
  schema: z.object({ input: z.string() }),
  implementation: async ({ input }) => `Processed: ${input}`
});

// Echo tool
const echoTool = createEchoTool();

// Calculator tool
const calcTool = createCalculatorTool();
```

## Test Helpers

### State Builder

Build test states easily:

```typescript
import { createStateBuilder } from '@agentforge/testing';

const state = createStateBuilder()
  .addHumanMessage('Hello')
  .addAIMessage('Hi there!')
  .set('customField', 'value')
  .build();
```

### Assertions

Helpful assertion functions:

```typescript
import {
  assertMessageContains,
  assertLastMessageContains,
  assertToolCalled,
  assertCompletesWithin,
} from '@agentforge/testing';

// Assert message contains text
assertMessageContains(messages, 'hello');

// Assert last message contains text
assertLastMessageContains(messages, 'goodbye');

// Assert tool was called
assertToolCalled(toolCalls, 'calculator', { operation: 'add' });

// Assert completes within time
await assertCompletesWithin(async () => {
  await agent.invoke(input);
}, 1000);
```

## Fixtures

Pre-built test data:

```typescript
import {
  simpleGreeting,
  multiTurnConversation,
  sampleTools,
  calculatorTool,
} from '@agentforge/testing';

// Use sample conversations
const messages = simpleGreeting;

// Use sample tools
const tools = sampleTools;
```

## Test Runners

### Agent Test Runner

Run integration tests on agents:

```typescript
import { createAgentTestRunner } from '@agentforge/testing';

const runner = createAgentTestRunner(agent, {
  timeout: 5000,
  captureSteps: true,
  validateState: true,
});

const result = await runner.run({ messages: [new HumanMessage('Test')] });

expect(result.passed).toBe(true);
expect(result.executionTime).toBeLessThan(5000);
```

### Conversation Simulator

Simulate multi-turn conversations:

```typescript
import { createConversationSimulator } from '@agentforge/testing';

const simulator = createConversationSimulator(agent, {
  maxTurns: 5,
  verbose: true,
  stopCondition: (messages) => {
    const lastMsg = messages[messages.length - 1];
    return lastMsg.content.includes('goodbye');
  }
});

const result = await simulator.simulate([
  'Hello',
  'What can you do?',
  'Help me with a task'
]);

expect(result.completed).toBe(true);
expect(result.turns).toBe(3);
```

## Snapshot Testing

Create and compare state snapshots:

```typescript
import {
  createSnapshot,
  assertMatchesSnapshot,
  compareStates,
  createStateDiff,
} from '@agentforge/testing';

// Create snapshot
const snapshot = createSnapshot(state, {
  normalizeTimestamps: true,
  normalizeIds: true,
  excludeFields: ['_internal']
});

// Assert matches snapshot
assertMatchesSnapshot(state);

// Compare states
const isEqual = compareStates(state1, state2);

// Create diff
const diff = createStateDiff(stateBefore, stateAfter);
console.log(diff.changed); // { field: { from: 'old', to: 'new' } }
```

## Complete Example

```typescript
import { describe, it, expect } from 'vitest';
import {
  createMockLLM,
  createMockTool,
  createStateBuilder,
  createAgentTestRunner,
  createConversationSimulator,
  assertMessageContains,
  assertToolCalled,
  assertMatchesSnapshot,
} from '@agentforge/testing';
import { createReActAgent } from '@agentforge/patterns';

describe('ReAct Agent Integration Tests', () => {
  const llm = createMockLLM({
    responses: [
      'I need to use the calculator tool.',
      'The result is 4.'
    ]
  });

  const calculatorTool = createMockTool({
    name: 'calculator',
    implementation: async ({ operation, a, b }) => {
      if (operation === 'add') return `${a + b}`;
      return '0';
    }
  });

  const agent = createReActAgent({
    llm,
    tools: [calculatorTool],
  });

  it('should use tools to solve problems', async () => {
    const runner = createAgentTestRunner(agent, {
      timeout: 5000,
      captureSteps: true
    });

    const state = createStateBuilder()
      .addHumanMessage('What is 2 + 2?')
      .build();

    const result = await runner.run(state);

    expect(result.passed).toBe(true);
    assertMessageContains(result.messages, 'calculator');
    assertToolCalled(result.finalState.toolCalls, 'calculator');
  });

  it('should handle multi-turn conversations', async () => {
    const simulator = createConversationSimulator(agent, {
      maxTurns: 3,
      verbose: false
    });

    const result = await simulator.simulate([
      'Hello',
      'Calculate 5 + 3',
      'Thank you'
    ]);

    expect(result.completed).toBe(true);
    expect(result.turns).toBe(3);
    assertMatchesSnapshot(result.messages);
  });
});
```

## API Reference

### Mocks

- `createMockLLM(config?)` - Create a mock LLM
- `createEchoLLM()` - Create an echo LLM
- `createErrorLLM(message?)` - Create an error LLM
- `createMockTool(config?)` - Create a mock tool
- `createEchoTool(name?)` - Create an echo tool
- `createCalculatorTool()` - Create a calculator tool

### Helpers

- `createStateBuilder()` - Create a state builder
- `createConversationState(messages)` - Create conversation state
- `createReActState(config?)` - Create ReAct agent state
- `createPlanningState(config?)` - Create planning agent state

### Assertions

- `assertMessageContains(messages, content)` - Assert message contains text
- `assertLastMessageContains(messages, content)` - Assert last message contains text
- `assertToolCalled(toolCalls, name, args?)` - Assert tool was called
- `assertCompletesWithin(fn, maxMs)` - Assert completes within time
- `assertStateHasFields(state, fields)` - Assert state has fields
- `assertMatchesSnapshot(state, config?)` - Assert matches snapshot

### Runners

- `createAgentTestRunner(agent, config?)` - Create agent test runner
- `createConversationSimulator(agent, config?)` - Create conversation simulator

### Fixtures

- `simpleGreeting` - Simple greeting conversation
- `multiTurnConversation` - Multi-turn conversation
- `sampleTools` - Array of sample tools
- `calculatorTool` - Calculator tool
- `searchTool` - Search tool

## 📖 Documentation

- 📚 **[Full Documentation](https://tvscoundrel.github.io/agentforge/)**
- 🚀 **[Quick Start](https://tvscoundrel.github.io/agentforge/guide/quick-start)**
- 🧪 **[Testing API Reference](https://tvscoundrel.github.io/agentforge/api/testing)**
- 💡 **[Testing Tutorial](https://tvscoundrel.github.io/agentforge/tutorials/testing)**

## 🔗 Links

- [GitHub Repository](https://github.com/TVScoundrel/agentforge)
- [npm Package](https://www.npmjs.com/package/@agentforge/testing)
- [Report Issues](https://github.com/TVScoundrel/agentforge/issues)

## 📚 Related Packages

- [@agentforge/core](https://www.npmjs.com/package/@agentforge/core) - Core abstractions
- [@agentforge/patterns](https://www.npmjs.com/package/@agentforge/patterns) - Agent patterns
- [@agentforge/tools](https://www.npmjs.com/package/@agentforge/tools) - Standard tools
- [@agentforge/cli](https://www.npmjs.com/package/@agentforge/cli) - CLI tool

## License

MIT


