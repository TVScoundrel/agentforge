# Customer Support Agent

A configurable, reusable customer support agent built with AgentForge. This agent demonstrates best practices for creating flexible, production-ready AI agents that can be customized for different use cases.

## Features

- ✅ **Configurable**: Customize model, tools, prompts, and behavior
- 🔧 **Tool Injection**: Add custom tools for your specific needs
- 🎯 **Feature Flags**: Enable/disable features like human escalation, ticket creation
- 📝 **Type-Safe**: Full TypeScript support with Zod validation
- 🧪 **Testable**: Easy to test with dependency injection
- 📦 **Reusable**: Use as-is or customize for your needs

## Installation

```bash
npm install @agentforge-examples/customer-support-agent
```

## Quick Start

### Basic Usage

```typescript
import { createCustomerSupportAgent } from '@agentforge-examples/customer-support-agent';

// Create agent with defaults
const agent = createCustomerSupportAgent();

// Use the agent
const result = await agent.invoke({
  messages: [
    { role: 'user', content: 'I need help resetting my password' }
  ]
});

console.log(result);
```

### With Configuration

```typescript
import { createCustomerSupportAgent } from '@agentforge-examples/customer-support-agent';
import { ChatOpenAI } from '@langchain/openai';

const agent = createCustomerSupportAgent({
  // Company branding
  companyName: 'Acme Corp',
  supportEmail: 'support@acme.com',
  
  // Model configuration
  model: new ChatOpenAI({ modelName: 'gpt-4-turbo' }),
  temperature: 0.5,
  
  // Feature flags
  enableHumanEscalation: true,
  enableTicketCreation: true,
  enableKnowledgeBase: true,
  
  // Behavior
  maxIterations: 15,
  escalationThreshold: 'medium',
});
```

### With Custom Tools

```typescript
import { createCustomerSupportAgent } from '@agentforge-examples/customer-support-agent';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

// Create custom tool
const checkOrderStatus = toolBuilder()
  .name('check-order-status')
  .description('Check the status of a customer order')
  .category(ToolCategory.UTILITY)
  .schema(z.object({
    orderId: z.string().describe('Order ID to check'),
  }))
  .implement(async ({ orderId }) => {
    // Your implementation
    return { orderId, status: 'shipped', eta: '2024-01-25' };
  })
  .build();

// Create agent with custom tools
const agent = createCustomerSupportAgent({
  customTools: [checkOrderStatus],
  enableTicketCreation: true,
});
```

### With Tool Registry

```typescript
import { createCustomerSupportAgent } from '@agentforge-examples/customer-support-agent';
import { ToolRegistry, ToolCategory } from '@agentforge/core';
import { webSearch, calculator } from '@agentforge/tools';

// Create and configure registry
const registry = new ToolRegistry();
registry.registerMany([webSearch, calculator]);

// Create agent with registry
const agent = createCustomerSupportAgent({
  toolRegistry: registry,
  enabledCategories: [ToolCategory.UTILITY, ToolCategory.WEB],
});
```

## Configuration Options

### CustomerSupportConfig

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `model` | `BaseLanguageModel` | `ChatOpenAI('gpt-4')` | Language model to use |
| `temperature` | `number` | `0.7` | Model temperature (0-2) |
| `customTools` | `Tool[]` | `[]` | Custom tools to add |
| `toolRegistry` | `ToolRegistry` | `undefined` | Pre-configured tool registry |
| `enabledCategories` | `ToolCategory[]` | `[]` | Filter tools by category |
| `enableHumanEscalation` | `boolean` | `false` | Enable ask-human tool |
| `enableTicketCreation` | `boolean` | `false` | Enable ticket creation tool |
| `enableKnowledgeBase` | `boolean` | `false` | Enable knowledge base search |
| `maxIterations` | `number` | `10` | Max reasoning iterations |
| `systemPrompt` | `string` | Default prompt | Custom system prompt |
| `companyName` | `string` | `undefined` | Company name for branding |
| `supportEmail` | `string` | `undefined` | Support email for escalation |
| `escalationThreshold` | `'low'\|'medium'\|'high'` | `undefined` | When to escalate |

## Built-in Tools

### Core Tools
- **currentDateTime**: Get current date and time

### Optional Tools (via feature flags)

#### Human Escalation (`enableHumanEscalation: true`)
- **ask-human**: Escalate to human agent for complex issues

#### Ticket Creation (`enableTicketCreation: true`)
- **create-support-ticket**: Create support tickets with priority and category

#### Knowledge Base (`enableKnowledgeBase: true`)
- **search-knowledge-base**: Search knowledge base for solutions

## Examples

See the [examples directory](./examples) for more usage examples:
- Basic customer support
- Multi-language support
- Integration with ticketing systems
- Custom tool integration
- Testing strategies

## Testing

```bash
npm test
```

## License

MIT

