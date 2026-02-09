# Human-in-the-Loop

Human-in-the-loop (HITL) workflows allow your AI agents to request input, approval, or clarification from humans during execution. This is essential for:

- **Critical decisions**: Get approval before executing high-impact actions
- **Missing information**: Ask users for clarification when context is incomplete
- **Compliance**: Ensure human oversight for regulated operations
- **Quality control**: Review agent outputs before finalizing

## The `askHuman` Tool

AgentForge provides the `askHuman` tool for implementing human-in-the-loop workflows. It integrates seamlessly with LangGraph's interrupt mechanism and supports real-time communication via Server-Sent Events (SSE).

### Basic Usage

```typescript
import { createAskHumanTool } from '@agentforge/tools';

// Create the tool
const askHuman = createAskHumanTool();

// Use in your agent's tools array
const agent = createReActAgent({
  model: chatModel,
  tools: [askHuman, ...otherTools],
});
```

### Asking Questions

The `askHuman` tool accepts several parameters:

```typescript
const response = await askHuman.invoke({
  question: 'Do you approve this refund of $500?',
  priority: 'high',
  timeout: 60000, // 1 minute
  defaultResponse: 'no', // Fallback if timeout
  suggestions: ['yes', 'no', 'review later'],
  context: {
    customerId: '12345',
    amount: 500,
    reason: 'Product defect'
  }
});
```

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `question` | `string` | Yes | The question to ask the human |
| `priority` | `'low' \| 'normal' \| 'high' \| 'critical'` | No | Priority level (default: 'normal') |
| `timeout` | `number` | No | Timeout in milliseconds (0 = no timeout) |
| `defaultResponse` | `string` | No | Fallback response if timeout occurs |
| `suggestions` | `string[]` | No | Suggested responses for the user |
| `context` | `Record<string, unknown>` | No | Additional context for the question |

### Output Format

The tool returns:

```typescript
{
  response: string;           // The human's response
  metadata: {
    requestId: string;        // Unique request ID
    requestedAt: number;      // Timestamp when requested
    respondedAt: number;      // Timestamp when responded
    timedOut: boolean;        // Whether the request timed out
    priority: string;         // Priority level
  }
}
```

## Priority Levels

Use priority levels to help humans triage requests:

- **`low`**: Optional feedback, can be skipped
- **`normal`**: Standard questions (default)
- **`high`**: Important decisions requiring attention
- **`critical`**: Urgent actions that must be reviewed

```typescript
// Critical approval
await askHuman.invoke({
  question: 'Delete all customer data? This cannot be undone!',
  priority: 'critical',
  suggestions: ['Cancel', 'Confirm deletion']
});

// Low priority feedback
await askHuman.invoke({
  question: 'Which color scheme do you prefer?',
  priority: 'low',
  timeout: 30000,
  defaultResponse: 'blue'
});
```

## Timeout Handling

Set timeouts to prevent agents from waiting indefinitely:

```typescript
await askHuman.invoke({
  question: 'Approve deployment to production?',
  timeout: 120000, // 2 minutes
  defaultResponse: 'no', // Safe default
  priority: 'high'
});
```

**Best Practices:**
- Always provide a `defaultResponse` when using timeouts
- Use safe defaults (e.g., 'no' for approvals, 'skip' for optional actions)
- Set reasonable timeouts based on priority (critical = longer timeout)

## Context Tracking

Pass context to help humans make informed decisions:

```typescript
await askHuman.invoke({
  question: 'Approve this refund?',
  context: {
    customerId: 'CUST-12345',
    orderAmount: 500,
    refundAmount: 500,
    reason: 'Product arrived damaged',
    customerHistory: 'First refund request in 2 years'
  },
  priority: 'high'
});
```

## Integration with LangGraph

The `askHuman` tool uses LangGraph's `interrupt()` function to pause execution and wait for human input.

### How It Works

1. Agent calls `askHuman.invoke()`
2. Tool calls `interrupt()` with the request
3. LangGraph pauses execution and saves state
4. Human receives request via SSE stream
5. Human provides response
6. Execution resumes with the response
7. Tool returns response to agent

### Checkpointing

Human-in-the-loop requires LangGraph checkpointing to save state:

```typescript
import { MemorySaver } from '@langchain/langgraph';

const checkpointer = new MemorySaver();

const app = workflow.compile({ checkpointer });
```

## Server-Sent Events (SSE)

AgentForge provides SSE utilities for real-time communication with humans.

### Setting Up SSE

```typescript
import {
  formatHumanRequestEvent,
  formatHumanResponseEvent
} from '@agentforge/core';
import express from 'express';

const app = express();

app.get('/api/stream', (req, res) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const threadId = 'thread-123';

  // Create and send human request event
  const humanRequest = {
    id: 'req-123',
    question: 'Approve this action?',
    priority: 'high' as const,
    createdAt: Date.now(),
    timeout: 0, // 0 = no timeout
    status: 'pending' as const
  };
  const requestEvent = formatHumanRequestEvent(humanRequest, threadId);

  // Format SSE event manually
  res.write(`event: ${requestEvent.event}\n`);
  res.write(`id: ${requestEvent.id}\n`);
  res.write(`data: ${requestEvent.data}\n\n`);

  // Later, when human responds, send response event
  const responseEvent = formatHumanResponseEvent('req-123', 'yes', threadId);
  res.write(`event: ${responseEvent.event}\n`);
  res.write(`id: ${responseEvent.id}\n`);
  res.write(`data: ${responseEvent.data}\n\n`);
});
```

### SSE Event Types

| Event | Description |
|-------|-------------|
| `human_request` | New request for human input |
| `human_response` | Human provided a response |
| `human_timeout` | Request timed out |
| `human_error` | Error processing request |

## Pattern-Specific Usage

### ReAct Pattern

In ReAct agents, use `askHuman` like any other tool:

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { createAskHumanTool } from '@agentforge/tools';

const agent = createReActAgent({
  model: chatModel,
  tools: [
    createAskHumanTool(),
    // ... other tools
  ],
  systemPrompt: `You are a customer support agent.

When handling refunds:
1. Check the refund amount
2. If amount > $100, use ask-human tool to get approval
3. Process the refund only if approved`
});
```

### Plan-Execute Pattern

Use `askHuman` in both planning and execution phases:

```typescript
import { createPlanExecuteAgent } from '@agentforge/patterns';
import { createAskHumanTool } from '@agentforge/tools';

const agent = createPlanExecuteAgent({
  planner: {
    model: chatModel,
    systemPrompt: `Create a plan. Use ask-human tool if you need clarification.`
  },
  executor: {
    tools: [createAskHumanTool()],
    model: chatModel
  }
});
```

**Planning Phase Example:**
```typescript
// Agent asks for clarification before creating plan
await askHuman.invoke({
  question: 'What is the target completion date?',
  context: { phase: 'planning' },
  suggestions: ['Today', 'This week', 'This month']
});
```

**Execution Phase Example:**
```typescript
// Agent asks for approval during execution
await askHuman.invoke({
  question: 'Step 3 requires admin approval. Proceed?',
  context: { phase: 'execution', step: 3 },
  priority: 'high',
  timeout: 60000,
  defaultResponse: 'no'
});
```

## Best Practices

### 1. Clear Questions

❌ **Bad:**
```typescript
await askHuman.invoke({ question: 'OK?' });
```

✅ **Good:**
```typescript
await askHuman.invoke({
  question: 'Approve refund of $500 to customer John Doe for order #12345?',
  context: { orderId: '12345', amount: 500, customer: 'John Doe' }
});
```

### 2. Appropriate Priorities

```typescript
// Critical: Data deletion, financial transactions
priority: 'critical'

// High: Approvals, important decisions
priority: 'high'

// Normal: Standard questions
priority: 'normal'

// Low: Optional feedback, preferences
priority: 'low'
```

### 3. Safe Defaults

Always use safe defaults for timeouts:

```typescript
// ✅ Safe: Defaults to 'no' for approvals
await askHuman.invoke({
  question: 'Delete user account?',
  timeout: 60000,
  defaultResponse: 'no'
});

// ❌ Unsafe: Defaults to 'yes' for destructive action
await askHuman.invoke({
  question: 'Delete user account?',
  timeout: 60000,
  defaultResponse: 'yes' // DANGEROUS!
});
```

### 4. Provide Context

Include relevant information to help humans decide:

```typescript
await askHuman.invoke({
  question: 'Approve this expense?',
  context: {
    amount: 5000,
    category: 'Software licenses',
    requestedBy: 'Engineering team',
    budget: { allocated: 10000, spent: 3000, remaining: 7000 },
    justification: 'Required for new project'
  }
});
```

### 5. Use Suggestions

Help humans respond quickly with suggestions:

```typescript
await askHuman.invoke({
  question: 'How should we handle this error?',
  suggestions: [
    'Retry automatically',
    'Skip and continue',
    'Stop and alert admin',
    'Rollback changes'
  ]
});
```

## Error Handling

Handle errors gracefully:

```typescript
try {
  const result = await askHuman.invoke({
    question: 'Approve this action?',
    timeout: 30000,
    defaultResponse: 'no'
  });

  if (result.metadata.timedOut) {
    console.log('Request timed out, using default response');
  }

  if (result.response === 'no') {
    // Handle rejection
    return { status: 'cancelled', reason: 'User declined' };
  }

  // Proceed with action
  return { status: 'approved' };

} catch (error) {
  console.error('Failed to get human input:', error);
  // Fallback to safe default
  return { status: 'cancelled', reason: 'Error getting approval' };
}
```

## Next Steps

- See [Streaming Guide](./streaming.md) for SSE implementation details
- Check [ReAct Pattern](../patterns/react.md) for agent integration
- Review [Plan-Execute Pattern](../patterns/plan-execute.md) for multi-phase workflows
- Explore the [Tools API](../../api/tools.md) for all available tools


