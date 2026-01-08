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
import { MockLLM } from '@agentforge/testing';

const mockLLM = new MockLLM({
  responses: [
    'First response',
    'Second response',
    'Third response'
  ]
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

#### Options

```typescript
interface MockLLMOptions {
  responses?: string[];           // Predefined responses
  delay?: number;                 // Response delay (ms)
  shouldFail?: boolean;           // Simulate failures
  errorMessage?: string;          // Error message
}
```

## Mock Tools

### createMockTool()

Create mock tools for testing:

```typescript
import { createMockTool } from '@agentforge/testing';

const mockTool = createMockTool({
  name: 'test-tool',
  responses: [
    { success: true, data: 'Result 1' },
    { success: true, data: 'Result 2' }
  ]
});
```

### MockToolBuilder

Fluent API for building mock tools:

```typescript
import { MockToolBuilder } from '@agentforge/testing';

const mockTool = new MockToolBuilder()
  .name('search')
  .response({ success: true, data: 'Found it!' })
  .delay(100)
  .build();
```

## Test Helpers

### AgentTestHarness

Test harness for agents:

```typescript
import { AgentTestHarness } from '@agentforge/testing';

const harness = new AgentTestHarness(agent);

// Test single invocation
const result = await harness.invoke('What is 2+2?');
expect(result).toContain('4');

// Test conversation
const conversation = await harness.conversation([
  'Hello',
  'What is your name?',
  'Goodbye'
]);

expect(conversation).toHaveLength(3);

// Assert tool usage
harness.assertToolCalled('calculator');
harness.assertToolCalledWith('calculator', { expression: '2+2' });
```

### Assertions

Custom assertions for testing:

```typescript
import { 
  assertAgentResponse,
  assertToolCalled,
  assertNoErrors,
  assertWithinIterations 
} from '@agentforge/testing';

// Assert response content
assertAgentResponse(result, {
  contains: 'expected text',
  notContains: 'error',
  matches: /pattern/
});

// Assert tool usage
assertToolCalled(result, 'tool-name');

// Assert no errors
assertNoErrors(result);

// Assert iteration count
assertWithinIterations(result, 5);
```

## Fixtures

### Sample Conversations

Pre-built conversation fixtures:

```typescript
import { 
  simpleConversation,
  multiTurnConversation,
  errorConversation 
} from '@agentforge/testing/fixtures';

// Use in tests
const result = await agent.invoke(simpleConversation);
```

### Sample Tools

Pre-built tool fixtures:

```typescript
import { 
  calculatorFixture,
  searchFixture,
  weatherFixture 
} from '@agentforge/testing/fixtures';

const agent = createReActAgent({
  model: mockLLM,
  tools: [calculatorFixture, searchFixture]
});
```

## Integration Testing

### TestEnvironment

Set up test environment:

```typescript
import { TestEnvironment } from '@agentforge/testing';

const env = new TestEnvironment({
  llm: new MockLLM({ responses: ['Hello'] }),
  tools: [tool1, tool2],
  middleware: [loggingMiddleware]
});

// Create test agent
const agent = env.createAgent('react');

// Run tests
const result = await agent.invoke({
  messages: [{ role: 'user', content: 'Test' }]
});

// Clean up
await env.cleanup();
```

### Snapshot Testing

```typescript
import { createSnapshot, compareSnapshot } from '@agentforge/testing';

// Create snapshot
const snapshot = createSnapshot(result);

// Compare with saved snapshot
const matches = compareSnapshot(result, 'test-name');
expect(matches).toBe(true);
```

## Performance Testing

### PerformanceMonitor

Monitor agent performance:

```typescript
import { PerformanceMonitor } from '@agentforge/testing';

const monitor = new PerformanceMonitor();

monitor.start();
await agent.invoke(input);
const metrics = monitor.stop();

expect(metrics.duration).toBeLessThan(1000);
expect(metrics.tokenCount).toBeLessThan(1000);
```

## Example Test Suite

```typescript
import { describe, it, expect } from 'vitest';
import { MockLLM, AgentTestHarness } from '@agentforge/testing';
import { createReActAgent } from '@agentforge/patterns';
import { calculator } from '@agentforge/tools';

describe('Calculator Agent', () => {
  const mockLLM = new MockLLM({
    responses: ['The answer is 4']
  });

  const agent = createReActAgent({
    model: mockLLM as any,
    tools: [calculator],
    maxIterations: 3
  });

  const harness = new AgentTestHarness(agent);

  it('should perform calculations', async () => {
    const result = await harness.invoke('What is 2+2?');
    expect(result).toContain('4');
  });

  it('should use calculator tool', async () => {
    await harness.invoke('Calculate 10 * 5');
    harness.assertToolCalled('calculator');
  });

  it('should complete within iterations', async () => {
    const result = await harness.invoke('What is 1+1?');
    harness.assertWithinIterations(3);
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

