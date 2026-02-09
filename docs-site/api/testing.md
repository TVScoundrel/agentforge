# @agentforge/testing

Testing utilities for AI agents.

## Installation

```bash
pnpm add -D @agentforge/testing
```

## Mock LLM

### MockLLM

Mock language model for testing:

```typescript
import { MockLLM, createMockLLM } from '@agentforge/testing';

// Using constructor
const mockLLM = new MockLLM({
  responses: [
    'First response',
    'Second response',
    'Third response'
  ]
});

// Or using factory function
const echoLLM = createMockLLM({
  responseGenerator: (messages) => {
    const lastMessage = messages[messages.length - 1];
    return `You said: ${lastMessage.content}`;
  }
});

// Use in agent
const agent = createReActAgent({
  model: mockLLM as any,
  tools: [myTool]
});

const result = await agent.invoke({
  messages: [{ role: 'user', content: 'Hello' }]
});
```

#### Configuration

```typescript
interface MockLLMConfig {
  responses?: string[];                              // Predefined responses (cycles through)
  responseGenerator?: (messages: BaseMessage[]) => string;  // Dynamic response generation
  delay?: number;                                    // Response delay (ms)
  shouldError?: boolean;                             // Simulate failures
  errorMessage?: string;                             // Error message
  modelName?: string;                                // Model name to report
}
```

#### Helper Functions

```typescript
import { createEchoLLM, createErrorLLM } from '@agentforge/testing';

// Echo LLM - repeats the last message
const echoLLM = createEchoLLM();

// Error LLM - always throws an error
const errorLLM = createErrorLLM('Custom error message');
```

## Mock Tools

### createMockTool()

Create mock tools for testing:

```typescript
import { createMockTool } from '@agentforge/testing';
import { z } from 'zod';

// Basic mock tool
const mockTool = createMockTool({
  name: 'test_tool',
  description: 'A test tool',
  schema: z.object({
    input: z.string().describe('Input parameter')
  }),
  implementation: async ({ input }) => `Processed: ${input}`
});

// Mock tool with error simulation
const errorTool = createMockTool({
  name: 'error_tool',
  shouldError: true,
  errorMessage: 'Tool failed'
});

// Mock tool with delay
const delayedTool = createMockTool({
  name: 'delayed_tool',
  delay: 1000,
  implementation: async ({ input }) => `Delayed result: ${input}`
});
```

#### Configuration

```typescript
interface MockToolConfig<T extends z.ZodType = z.ZodType> {
  name?: string;                                     // Tool name
  description?: string;                              // Tool description
  category?: ToolCategory;                           // Tool category
  schema?: T;                                        // Input schema (Zod)
  implementation?: (input: z.infer<T>) => Promise<string> | string;  // Implementation function
  shouldError?: boolean;                             // Whether to throw an error
  errorMessage?: string;                             // Error message to throw
  delay?: number;                                    // Delay in milliseconds
}
```

#### Helper Functions

```typescript
import {
  createEchoTool,
  createErrorTool,
  createDelayedTool,
  createCalculatorTool
} from '@agentforge/testing';

// Echo tool - returns the input
const echoTool = createEchoTool('my_echo');

// Error tool - always throws
const errorTool = createErrorTool('my_error', 'Custom error');

// Delayed tool - adds artificial delay
const delayedTool = createDelayedTool('my_delayed', 500);

// Calculator tool - performs arithmetic
const calculatorTool = createCalculatorTool();
```

## Test Runners

### AgentTestRunner

Test runner for agent integration testing:

```typescript
import { AgentTestRunner, createAgentTestRunner } from '@agentforge/testing';
import { HumanMessage } from '@langchain/core/messages';

// Create test runner using constructor
const runner = new AgentTestRunner(agent, {
  timeout: 5000,
  captureSteps: true,
  validateState: true,
  stateValidator: (state) => state.messages.length > 0
});

// Or use factory function
const testRunner = createAgentTestRunner(agent, { timeout: 5000 });

// Run a single test
const result = await runner.run({
  messages: [new HumanMessage('What is 2+2?')]
});

expect(result.passed).toBe(true);
expect(result.messages.length).toBeGreaterThan(1);
expect(result.executionTime).toBeLessThan(5000);

// Run multiple tests
const results = await runner.runMany([
  { messages: [new HumanMessage('Hello')] },
  { messages: [new HumanMessage('Calculate 5 + 3')] }
]);
```

#### Configuration

```typescript
interface AgentTestConfig {
  timeout?: number;                                  // Max wait time (ms)
  captureSteps?: boolean;                            // Capture intermediate steps
  validateState?: boolean;                           // Validate state after each step
  stateValidator?: (state: any) => boolean | Promise<boolean>;  // Custom validator
}

interface AgentTestResult {
  finalState: any;                                   // Final state after execution
  messages: BaseMessage[];                           // Messages exchanged
  executionTime: number;                             // Execution time (ms)
  steps?: any[];                                     // Intermediate steps (if captured)
  passed: boolean;                                   // Whether test passed
  error?: Error;                                     // Error if test failed
}
```

### ConversationSimulator

Simulate multi-turn conversations:

```typescript
import { ConversationSimulator, createConversationSimulator } from '@agentforge/testing';

// Create simulator
const simulator = new ConversationSimulator(agent, {
  maxTurns: 5,
  turnDelay: 100,
  verbose: true,
  stopCondition: (messages) => {
    const lastMsg = messages[messages.length - 1];
    return lastMsg.content.includes('goodbye');
  }
});

// Simulate conversation with predefined inputs
const result = await simulator.simulate([
  'Hello',
  'What can you do?',
  'Help me calculate 2 + 2',
  'Thank you, goodbye'
]);

expect(result.turns).toBe(4);
expect(result.completed).toBe(true);
expect(result.stopReason).toBe('stop_condition');

// Simulate with dynamic input generation
const result = await simulator.simulateDynamic(
  (messages) => {
    if (messages.length >= 10) return null;  // Stop condition
    return `Message ${messages.length / 2 + 1}`;
  },
  10  // max turns
);
```

#### Configuration

```typescript
interface ConversationSimulatorConfig {
  maxTurns?: number;                                 // Maximum number of turns
  turnDelay?: number;                                // Delay between turns (ms)
  verbose?: boolean;                                 // Whether to log conversation
  stopCondition?: (messages: BaseMessage[]) => boolean;  // Stop condition
}

interface ConversationResult {
  messages: BaseMessage[];                           // All messages in conversation
  turns: number;                                     // Number of turns
  totalTime: number;                                 // Total execution time (ms)
  completed: boolean;                                // Whether conversation completed
  stopReason: 'max_turns' | 'stop_condition' | 'error';  // Reason for stopping
  error?: Error;                                     // Error if any
}
```

## Assertions

Custom assertions for testing:

```typescript
import {
  assertIsMessage,
  assertMessageContains,
  assertLastMessageContains,
  assertStateHasFields,
  assertToolCalled,
  assertCompletesWithin,
  assertThrowsWithMessage,
  assertStateSnapshot,
  assertAlternatingMessages,
  assertNotEmpty,
  assertInRange,
  assertIterationsWithinLimit,
  assertHasKeys
} from '@agentforge/testing';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';

// Assert message type
const msg = new HumanMessage('Hello');
assertIsMessage(msg, 'human');

// Assert messages contain specific content
const messages: BaseMessage[] = [/* ... */];
assertMessageContains(messages, 'expected text');
assertLastMessageContains(messages, 'final response');

// Assert state has required fields
assertStateHasFields(state, ['messages', 'iterations']);

// Assert tool was called
const toolCalls = [
  { name: 'calculator', args: { operation: 'add', a: 2, b: 2 } }
];
assertToolCalled(toolCalls, 'calculator');
assertToolCalled(toolCalls, 'calculator', { operation: 'add' });

// Assert execution time
await assertCompletesWithin(
  async () => agent.invoke(input),
  5000  // max 5 seconds
);

// Assert error message
await assertThrowsWithMessage(
  async () => errorTool.execute({}),
  'Tool failed'
);

// Assert state matches snapshot
assertStateSnapshot(state, expectedSnapshot);

// Assert messages alternate between human and AI
assertAlternatingMessages(messages);

// Assert array is not empty
assertNotEmpty(messages);

// Assert value is in range
assertInRange(iterations, 1, 10);

// Assert iterations within limit
assertIterationsWithinLimit(iterations, 5);

// Assert object has keys
assertHasKeys(result, ['messages', 'finalState', 'passed']);
```

## Fixtures

### Sample Conversations

Pre-built conversation fixtures:

```typescript
import {
  simpleGreeting,
  multiTurnConversation,
  toolUsageConversation,
  errorHandlingConversation,
  complexReasoningConversation,
  longContextConversation,
  createConversation,
  createConversationWithSystem,
  sampleData
} from '@agentforge/testing';

// Use pre-built conversations
const result = await agent.invoke({ messages: simpleGreeting });

// Create custom conversation
const customConversation = createConversation([
  { human: 'Hello', ai: 'Hi there!' },
  { human: 'How are you?', ai: 'I\'m doing well!' }
]);

// Create conversation with system message
const conversation = createConversationWithSystem(
  'You are a helpful assistant',
  [
    { human: 'Hello', ai: 'Hi!' },
    { human: 'Help me', ai: 'Sure!' }
  ]
);

// Use sample data
const userInput = sampleData.userInputs[0];  // 'Hello'
const toolCall = sampleData.toolCalls[0];    // { name: 'calculator', args: {...} }
```

### Sample Tools

Pre-built tool fixtures:

```typescript
import {
  calculatorTool,
  searchTool,
  timeTool,
  weatherTool,
  fileReaderTool,
  databaseQueryTool,
  sampleTools,
  getToolsByCategory,
  getToolByName
} from '@agentforge/testing';
import { ToolCategory } from '@agentforge/core';

// Use individual tools
const agent = createReActAgent({
  model: mockLLM,
  tools: [calculatorTool, searchTool]
});

// Use all sample tools
const agent = createReActAgent({
  model: mockLLM,
  tools: sampleTools
});

// Get tools by category
const webTools = getToolsByCategory(ToolCategory.WEB);

// Get specific tool
const calculator = getToolByName('calculator');
```

## Snapshot Testing

Test state and messages with snapshots:

```typescript
import {
  createSnapshot,
  assertMatchesSnapshot,
  createMessageSnapshot,
  assertMessagesMatchSnapshot,
  compareStates,
  createStateDiff,
  assertStateChanged,
  type SnapshotConfig
} from '@agentforge/testing';

// Create snapshot with normalization
const snapshot = createSnapshot(state, {
  normalizeTimestamps: true,
  normalizeIds: true,
  excludeFields: ['_internal', 'timestamp'],
  includeFields: ['messages', 'iterations']
});

// Assert state matches snapshot (uses Vitest's toMatchSnapshot)
assertMatchesSnapshot(state, {
  normalizeTimestamps: true,
  normalizeIds: true
});

// Create message snapshot
const msgSnapshot = createMessageSnapshot(messages);
// Returns: [{ type: 'human', content: '...' }, { type: 'ai', content: '...' }]

// Assert messages match snapshot
assertMessagesMatchSnapshot(messages);

// Compare two states
const areEqual = compareStates(stateBefore, stateAfter, {
  excludeFields: ['timestamp']
});

// Create diff between states
const diff = createStateDiff(stateBefore, stateAfter);
console.log(diff.added);     // Fields added
console.log(diff.removed);   // Fields removed
console.log(diff.changed);   // Fields changed

// Assert specific fields changed
assertStateChanged(stateBefore, stateAfter, ['messages', 'iterations']);
```

### Snapshot Configuration

```typescript
interface SnapshotConfig {
  includeFields?: string[];                          // Fields to include
  excludeFields?: string[];                          // Fields to exclude
  normalizeTimestamps?: boolean;                     // Replace timestamps with [TIMESTAMP]
  normalizeIds?: boolean;                            // Replace UUIDs with [UUID]
  normalizer?: (value: any) => any;                  // Custom normalizer
}
```

## State Builders

Create test states easily:

```typescript
import {
  StateBuilder,
  createStateBuilder,
  createConversationState,
  createReActState,
  createPlanningState
} from '@agentforge/testing';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

// Use StateBuilder for custom states
const state = new StateBuilder()
  .addMessage(new HumanMessage('Hello'))
  .addMessage(new AIMessage('Hi there!'))
  .set('iterations', 1)
  .set('customField', 'value')
  .build();

// Or use factory function
const builder = createStateBuilder();

// Create conversation state (alternates human/AI messages from strings)
const conversationState = createConversationState([
  'Hello',      // Human message
  'Hi!',        // AI message
  'How are you?',  // Human message
  'I\'m doing well!'  // AI message
]);

// Create ReAct agent state
const reactState = createReActState({
  messages: [new HumanMessage('Calculate 2+2')],
  iterations: 0
});

// Create planning agent state
const planningState = createPlanningState({
  messages: [new HumanMessage('Plan a trip')],
  plan: [],
  currentStep: 0
});
```

## Example Test Suite

Complete example using the testing utilities:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMockLLM,
  createCalculatorTool,
  AgentTestRunner,
  ConversationSimulator,
  assertLastMessageContains,
  assertIterationsWithinLimit,
  assertMatchesSnapshot,
  simpleGreeting
} from '@agentforge/testing';
import { createReActAgent } from '@agentforge/patterns';
import { HumanMessage } from '@langchain/core/messages';

describe('Calculator Agent', () => {
  let agent: any;
  let runner: AgentTestRunner;
  let simulator: ConversationSimulator;

  beforeEach(() => {
    // Create mock LLM with calculator responses
    const mockLLM = createMockLLM({
      responses: [
        'Let me calculate that for you.',
        'The answer is 4',
        'The result is 50'
      ]
    });

    // Create agent with calculator tool
    agent = createReActAgent({
      model: mockLLM as any,
      tools: [createCalculatorTool()],
      maxIterations: 5
    });

    // Create test utilities
    runner = new AgentTestRunner(agent, {
      timeout: 5000,
      captureSteps: true
    });

    simulator = new ConversationSimulator(agent, {
      maxTurns: 3,
      verbose: false
    });
  });

  it('should perform calculations', async () => {
    const result = await runner.run({
      messages: [new HumanMessage('What is 2+2?')]
    });

    expect(result.passed).toBe(true);
    expect(result.messages.length).toBeGreaterThan(1);
    assertLastMessageContains(result.messages, '4');
  });

  it('should complete within iteration limit', async () => {
    const result = await runner.run({
      messages: [new HumanMessage('Calculate 10 * 5')]
    });

    expect(result.passed).toBe(true);
    // Check iteration count (ReAct state uses 'iteration' singular)
    if (result.finalState.iteration !== undefined) {
      assertIterationsWithinLimit(result.finalState.iteration, 5);
    }
  });

  it('should handle multi-turn conversations', async () => {
    const result = await simulator.simulate([
      'Hello',
      'What is 2 + 2?',
      'Thank you'
    ]);

    expect(result.completed).toBe(true);
    expect(result.turns).toBe(3);
    expect(result.messages.length).toBe(6); // 3 human + 3 AI
  });

  it('should match snapshot', async () => {
    const result = await runner.run({
      messages: simpleGreeting
    });

    assertMatchesSnapshot(result.finalState, {
      excludeFields: ['timestamp', '_internal'],
      normalizeTimestamps: true
    });
  });

  it('should handle errors gracefully', async () => {
    const errorLLM = createMockLLM({
      shouldError: true,
      errorMessage: 'LLM failed'
    });

    const errorAgent = createReActAgent({
      model: errorLLM as any,
      tools: [createCalculatorTool()],
      maxIterations: 3
    });

    const errorRunner = new AgentTestRunner(errorAgent, { timeout: 5000 });
    const result = await errorRunner.run({
      messages: [new HumanMessage('Test')]
    });

    expect(result.passed).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('LLM failed');
  });
});
```

## Best Practices

1. **Use Mock LLMs** - Don't call real LLMs in tests
2. **Test Tool Integration** - Verify tools are called correctly
3. **Test Error Handling** - Simulate failures
4. **Use Fixtures** - Reuse common test data
5. **Monitor Performance** - Track execution time and tokens
6. **Snapshot Testing** - Catch unexpected changes

## Type Definitions

All exports include full TypeScript definitions. See the [source code](https://github.com/TVScoundrel/agentforge/tree/main/packages/testing/src) for complete type information.

