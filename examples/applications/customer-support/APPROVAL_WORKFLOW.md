# Customer Support with Approval Workflow

This example demonstrates a customer support agent that uses the `askHuman` tool to request human approval for high-value refunds.

## Features

- 🤖 **Automated Refunds**: Small refunds ($100 or less) processed automatically
- 👤 **Human Approval**: Large refunds require human review and approval
- ⏸️ **Pause/Resume**: LangGraph checkpointing enables workflow interruption
- 📊 **Context-Rich Requests**: Provides customer history and order details for informed decisions
- ⏱️ **Timeout Handling**: Safe defaults prevent system from hanging
- 🔒 **Safe Defaults**: Defaults to "no" for approvals to prevent unauthorized refunds

## How It Works

### Workflow

1. **Customer requests refund** for an order
2. **Agent gathers information**:
   - Customer details (order history, refund history)
   - Order details (amount, items, status)
3. **Agent evaluates refund**:
   - If amount ≤ $100: Process immediately
   - If amount > $100: Request human approval
4. **Human approval** (for large refunds):
   - Agent pauses execution
   - Human receives request with full context
   - Human approves or denies
   - Agent resumes and processes accordingly
5. **Refund processed** based on approval

### Decision Logic

```typescript
if (refundAmount <= 100) {
  // Auto-approve small refunds
  processRefund({ approved: true });
} else {
  // Request human approval for large refunds
  const approval = await askHuman.invoke({
    question: `Approve refund of $${amount}?`,
    context: {
      customer: customerInfo,
      order: orderInfo,
      amount: refundAmount,
      reason: refundReason
    },
    priority: 'high',
    timeout: 120000, // 2 minutes
    defaultResponse: 'no' // Safe default
  });
  
  processRefund({ approved: approval.response === 'yes' });
}
```

## Running the Example

```bash
# From repository root
pnpm tsx examples/applications/customer-support/src/with-approval.ts
```

## Example Output

### Scenario 1: Small Refund (Auto-approved)

```
Customer: I need a refund for order ORD-67890. The phone case arrived damaged.

Agent: I've processed your refund request for order ORD-67890.
       Refund REF-1234567890 processed successfully.
       $45 will be refunded to your original payment method within 3-5 business days.
```

### Scenario 2: Large Refund (Requires Approval)

```
Customer: I want a refund for order ORD-12345. The laptop stand is defective.

⏸️  Execution paused for human approval

Human Request:
{
  "id": "req-abc123",
  "question": "Approve refund of $150 for order ORD-12345?",
  "context": {
    "customer": {
      "id": "CUST-001",
      "name": "John Doe",
      "totalOrders": 15,
      "totalSpent": 2500,
      "refundHistory": 1
    },
    "order": {
      "id": "ORD-12345",
      "amount": 150,
      "items": ["Laptop Stand", "USB-C Cable"],
      "status": "delivered"
    },
    "reason": "Defective product"
  },
  "priority": "high",
  "timeout": 120000,
  "defaultResponse": "no"
}

✅ In a real application:
1. This request would be sent to a human via SSE
2. Human would review and respond
3. Execution would resume with the response
4. Agent would process the refund based on approval
```

## Tools Used

### Built-in Tools

- **`askHuman`** - Request human input/approval
- **`currentDateTime`** - Get current timestamp

### Custom Tools

- **`get_customer_info`** - Retrieve customer details and history
- **`get_order_info`** - Retrieve order details
- **`process_refund`** - Process approved refunds

## Key Concepts

### 1. LangGraph Checkpointing

Required for human-in-the-loop workflows:

```typescript
import { MemorySaver } from '@langchain/langgraph';

const checkpointer = new MemorySaver();
const app = agent.compile({ checkpointer });
```

### 2. Priority Levels

Use appropriate priority for different scenarios:

- **`critical`**: Fraud alerts, security issues
- **`high`**: Large refunds, account changes
- **`normal`**: Standard approvals
- **`low`**: Optional feedback

### 3. Timeout Handling

Always set timeouts with safe defaults:

```typescript
await askHuman.invoke({
  question: 'Approve this refund?',
  timeout: 120000, // 2 minutes
  defaultResponse: 'no' // Safe: deny if no response
});
```

### 4. Context Provision

Provide comprehensive context for informed decisions:

```typescript
context: {
  customer: {
    name: 'John Doe',
    orderHistory: 15,
    refundHistory: 1,
    totalSpent: 2500
  },
  order: {
    amount: 150,
    items: ['Laptop Stand'],
    reason: 'Defective'
  },
  recommendation: 'Approve - loyal customer, first refund in 15 orders'
}
```

## Production Integration

### SSE Streaming

```typescript
import { createHumanInLoopSSE } from '@agentforge/core';

app.get('/api/support/stream', (req, res) => {
  const sse = createHumanInLoopSSE(res);
  
  // Stream agent execution
  for await (const event of app.stream(input, config)) {
    if (event.type === 'human_request') {
      sse.sendHumanRequest(event.data);
    }
  }
});
```

### Web UI for Approvals

```typescript
// Frontend receives SSE event
eventSource.addEventListener('human_request', (event) => {
  const request = JSON.parse(event.data);
  
  // Show approval dialog
  showApprovalDialog({
    question: request.question,
    context: request.context,
    onApprove: () => sendResponse(request.id, 'yes'),
    onDeny: () => sendResponse(request.id, 'no')
  });
});
```

## Best Practices

1. **Always use safe defaults** - Default to "no" for approvals
2. **Provide rich context** - Help humans make informed decisions
3. **Set appropriate timeouts** - Don't let requests hang indefinitely
4. **Use priority levels** - Help humans triage requests
5. **Log all approvals** - Maintain audit trail for compliance
6. **Test timeout scenarios** - Ensure system handles timeouts gracefully

## Learn More

- [Human-in-the-Loop Guide](../../../docs-site/guide/advanced/human-in-the-loop.md)
- [askHuman Tool API](../../../docs-site/api/tools.md#ask-human)
- [LangGraph Checkpointing](https://langchain-ai.github.io/langgraphjs/concepts/persistence/)
- [SSE Streaming](../../../docs-site/guide/advanced/streaming.md)

