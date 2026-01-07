# Customer Support Bot Example

An AI-powered customer support system using multi-agent architecture with FAQ handling, ticket management, and intelligent routing.

## Features

- 💬 **Interactive Chat**: Real-time conversation with customers
- 📚 **FAQ Database**: Instant answers to common questions
- 🎫 **Ticket Management**: Create and track support tickets
- 🔀 **Intelligent Routing**: Route to appropriate specialist agent
- 😊 **Sentiment Analysis**: Detect frustrated customers and escalate
- 📦 **Order Tracking**: Check order status and tracking information
- 🚨 **Auto-Escalation**: Automatically escalate urgent or negative cases

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- OpenAI API key

## Installation

```bash
# From the repository root
pnpm install
```

## Configuration

Create a `.env` file in the repository root:

```bash
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4  # Optional, defaults to gpt-4
```

## Usage

Start the interactive support bot:

```bash
# From the repository root
pnpm tsx examples/applications/customer-support/src/index.ts
```

### Example Conversations

```
You: How do I reset my password?
Bot: To reset your password: 1) Go to login page 2) Click "Forgot Password"...

You: I need to track my order #12345
Bot: Let me check that for you... [provides tracking info]

You: This is urgent! My account is locked!
Bot: I understand this is urgent. I'm creating a high-priority ticket...

You: What are your shipping options?
Bot: We offer free shipping on orders over $50...
```

## Architecture

This example uses the **Multi-Agent Pattern** with three specialized agents:

### 1. Triage Agent
- Analyzes customer sentiment
- Determines urgency level
- Routes to appropriate specialist
- Escalates when needed

### 2. FAQ Agent
- Searches FAQ database
- Answers common questions
- Provides quick resolutions
- Handles simple inquiries

### 3. Technical Agent
- Handles complex issues
- Creates support tickets
- Checks order status
- Manages escalations

## How It Works

1. **Customer Message**: User sends a message
2. **Sentiment Analysis**: Triage agent analyzes tone and urgency
3. **Routing**: Routes to FAQ or Technical agent based on complexity
4. **Resolution**: Agent provides answer or creates ticket
5. **Escalation**: Urgent/negative cases are automatically escalated
6. **Follow-up**: System tracks conversation history

## Tools Used

- `search_faq` - Custom tool for FAQ lookup
- `create_ticket` - Custom tool for ticket creation
- `check_order_status` - Custom tool for order tracking
- `analyze_sentiment` - Custom tool for sentiment analysis
- `currentDateTime` - Get current date/time for tickets

## FAQ Database

The example includes a simulated FAQ database covering:
- Password reset
- Shipping information
- Returns and refunds
- Payment methods
- Order tracking
- Account management

## Customization

### Add More FAQs

Edit the `FAQ_DATABASE` object:

```typescript
const FAQ_DATABASE = {
  'your topic': 'Your answer here',
  'another topic': 'Another answer',
};
```

### Integrate Real Database

Replace the simulated FAQ search with a real database:

```typescript
const searchFAQTool = createTool()
  .name('search_faq')
  .implement(async ({ query }) => {
    const results = await db.query(
      'SELECT * FROM faqs WHERE question LIKE ?',
      [`%${query}%`]
    );
    return results.map(r => r.answer).join('\n');
  })
  .build();
```

### Add More Agents

Add specialized agents for different departments:

```typescript
agents: [
  {
    name: 'billing_agent',
    role: 'Billing Specialist',
    goal: 'Handle billing and payment issues',
    tools: [checkPaymentTool, processRefundTool],
  },
  {
    name: 'shipping_agent',
    role: 'Shipping Specialist',
    goal: 'Handle shipping and delivery issues',
    tools: [trackShipmentTool, updateAddressTool],
  },
],
```

### Customize Escalation Logic

Modify sentiment analysis for your needs:

```typescript
const negativeWords = ['angry', 'frustrated', 'terrible', 'lawsuit', 'lawyer'];
const urgentWords = ['urgent', 'emergency', 'critical', 'immediately'];
```

## Integration with Helpdesk Systems

### Zendesk Integration

```typescript
import { ZendeskClient } from 'zendesk-node-api';

const createTicketTool = createTool()
  .name('create_ticket')
  .implement(async ({ subject, description, priority }) => {
    const zendesk = new ZendeskClient({
      url: process.env.ZENDESK_URL,
      token: process.env.ZENDESK_TOKEN,
    });
    
    const ticket = await zendesk.tickets.create({
      subject,
      description,
      priority,
    });
    
    return `Ticket ${ticket.id} created in Zendesk`;
  })
  .build();
```

### Slack Notifications

```typescript
import { WebClient } from '@slack/web-api';

// Notify team of escalations
if (escalate) {
  const slack = new WebClient(process.env.SLACK_TOKEN);
  await slack.chat.postMessage({
    channel: '#support-escalations',
    text: `🚨 Escalated ticket: ${ticketId}`,
  });
}
```

## Production Considerations

1. **Conversation History**: Store chat history in database
2. **Authentication**: Verify customer identity for sensitive operations
3. **Rate Limiting**: Prevent abuse with rate limits
4. **Analytics**: Track resolution rates and customer satisfaction
5. **Human Handoff**: Implement seamless handoff to human agents
6. **Multi-language**: Add translation for international support
7. **Business Hours**: Handle after-hours inquiries appropriately

## Metrics to Track

- First response time
- Resolution time
- Customer satisfaction (CSAT)
- Ticket volume by category
- Escalation rate
- FAQ hit rate
- Agent utilization

## Learn More

- [AgentForge Documentation](../../../docs-site/)
- [Multi-Agent Pattern Guide](../../../docs-site/api/patterns.md#multi-agent-system)
- [Building Custom Tools](../../../docs-site/tutorials/custom-tools.md)

## License

MIT

