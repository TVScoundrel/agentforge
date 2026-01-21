# Creating Reusable Agents

Reusable agents are configurable, composable AI agents that can be easily customized and shared across projects. This guide covers best practices for creating agents that are flexible, maintainable, and ready for production use.

## Why Reusable Agents?

**Benefits:**
- 🔄 **Reusability**: Write once, use in multiple projects
- ⚙️ **Configurability**: Customize behavior without changing code
- 📦 **Composability**: Combine agents with different tools and capabilities
- 🧪 **Testability**: Easier to test with dependency injection
- 📚 **Shareability**: Publish to npm for team or community use
- 🔧 **Maintainability**: Centralized updates benefit all consumers

## Core Patterns

### 1. Agent Factory Functions

The foundation of reusable agents is the factory function pattern:

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import type { Tool } from '@agentforge/core';

export interface CustomerSupportAgentConfig {
  model?: ChatOpenAI;
  tools?: Tool[];
  systemPrompt?: string;
  temperature?: number;
  maxIterations?: number;
}

export function createCustomerSupportAgent(config: CustomerSupportAgentConfig = {}) {
  const {
    model = new ChatOpenAI({ modelName: 'gpt-4', temperature: 0.7 }),
    tools = [],
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    temperature = 0.7,
    maxIterations = 10,
  } = config;

  return createReActAgent({
    model,
    tools,
    systemPrompt,
    maxIterations,
  });
}

const DEFAULT_SYSTEM_PROMPT = `You are a helpful customer support agent.
Your goal is to assist customers with their questions and issues.
Always be polite, professional, and solution-focused.`;
```

**Key Principles:**
- Accept configuration object with sensible defaults
- Allow all critical parameters to be overridden
- Provide default system prompt but allow customization
- Return the compiled agent ready to use

### 2. Configuration-Driven Agents

Use configuration objects to make agents highly customizable:

```typescript
export interface AgentConfig {
  // Model configuration
  model?: {
    provider: 'openai' | 'anthropic' | 'custom';
    modelName: string;
    temperature?: number;
    maxTokens?: number;
  };
  
  // Behavior configuration
  behavior?: {
    maxIterations?: number;
    timeout?: number;
    retryAttempts?: number;
  };
  
  // Tool configuration
  tools?: {
    enabled: string[];  // Tool names to enable
    disabled: string[]; // Tool names to disable
    custom: Tool[];     // Custom tools to add
  };
  
  // Prompt configuration
  prompts?: {
    system?: string;
    examples?: Array<{ input: string; output: string }>;
    guidelines?: string[];
  };
}

export function createConfigurableAgent(config: AgentConfig) {
  // Initialize model based on config
  const model = createModel(config.model);
  
  // Select and configure tools
  const tools = selectTools(config.tools);
  
  // Build system prompt
  const systemPrompt = buildSystemPrompt(config.prompts);
  
  return createReActAgent({
    model,
    tools,
    systemPrompt,
    maxIterations: config.behavior?.maxIterations ?? 10,
  });
}
```

### 3. Tool Injection and Composition

Allow tools to be injected for maximum flexibility using AgentForge's ToolRegistry:

```typescript
import { ToolRegistry, toolBuilder, ToolCategory, type Tool } from '@agentforge/core';
import { createAskHumanTool, currentDateTime } from '@agentforge/tools';
import { z } from 'zod';

export interface RefundAgentConfig {
  // Required tools (created with toolBuilder)
  getCustomerInfo: Tool;
  getOrderInfo: Tool;
  processRefund: Tool;

  // Optional: Additional tools or registry
  additionalTools?: Tool[];
  toolRegistry?: ToolRegistry;

  // Feature flags
  enableHumanApproval?: boolean;
  enableLogging?: boolean;
}

export function createRefundAgent(config: RefundAgentConfig) {
  const {
    getCustomerInfo,
    getOrderInfo,
    processRefund,
    additionalTools = [],
    toolRegistry,
    enableHumanApproval = true,
    enableLogging = false,
  } = config;

  // Use provided registry or create a new one
  const registry = toolRegistry || new ToolRegistry();

  // Register required tools
  registry.registerMany([
    getCustomerInfo,
    getOrderInfo,
    processRefund,
    currentDateTime,
  ]);

  // Register additional tools
  if (additionalTools.length > 0) {
    registry.registerMany(additionalTools);
  }

  // Conditionally add tools based on feature flags
  if (enableHumanApproval) {
    registry.register(createAskHumanTool());
  }

  if (enableLogging) {
    const loggingTool = toolBuilder()
      .name('log-action')
      .description('Log an action for audit trail')
      .category(ToolCategory.UTILITY)
      .schema(z.object({
        action: z.string().describe('Action to log'),
        details: z.record(z.unknown()).optional().describe('Additional details'),
      }))
      .implement(async ({ action, details }) => {
        console.log(`[AUDIT] ${action}`, details);
        return { logged: true, timestamp: Date.now() };
      })
      .build();

    registry.register(loggingTool);
  }

  return createReActAgent({
    model: new ChatOpenAI({ modelName: 'gpt-4' }),
    tools: registry.getAll(),
    systemPrompt: buildRefundPrompt(enableHumanApproval),
  });
}
```

**Benefits:**
- Consumers provide their own tool implementations
- Easy to mock tools for testing
- Supports different backends (database, API, etc.)
- Feature flags enable/disable functionality
- ToolRegistry provides querying and organization

**Using ToolRegistry for Advanced Composition:**

```typescript
import { ToolRegistry, ToolCategory } from '@agentforge/core';
import { webSearch, calculator } from '@agentforge/tools';

export interface AdvancedAgentConfig {
  customTools?: Tool[];
  enabledCategories?: ToolCategory[];
  toolRegistry?: ToolRegistry;
}

export function createAdvancedAgent(config: AdvancedAgentConfig = {}) {
  const {
    customTools = [],
    enabledCategories = [ToolCategory.UTILITY, ToolCategory.WEB],
    toolRegistry,
  } = config;

  // Use provided registry or create new one
  const registry = toolRegistry || new ToolRegistry();

  // Register standard tools
  registry.registerMany([webSearch, calculator]);

  // Register custom tools
  if (customTools.length > 0) {
    registry.registerMany(customTools);
  }

  // Filter tools by enabled categories
  const tools = enabledCategories.length > 0
    ? enabledCategories.flatMap(cat => registry.getByCategory(cat))
    : registry.getAll();

  // Generate system prompt with tool descriptions
  const toolPrompt = registry.generatePrompt({
    includeExamples: true,
    groupByCategory: true,
  });

  const systemPrompt = `You are a helpful AI assistant.

${toolPrompt}

Always use the appropriate tool for each task.`;

  return createReActAgent({
    model: new ChatOpenAI({ modelName: 'gpt-4' }),
    tools,
    systemPrompt,
  });
}
```

### 4. System Prompt Customization

Make system prompts flexible while maintaining core behavior. **Best practice**: Store prompts in external `.md` files with variable placeholders.

#### External Prompt Pattern (Recommended)

Store prompts in separate `.md` files for better maintainability:

**File: `prompts/system.md`**
```markdown
# {{agentRole}}

You are a {{agentRole}}{{#if companyName}} representing {{companyName}}{{/if}}.

## Your Responsibilities

{{#each responsibilities}}
- {{this}}
{{/each}}

## Guidelines

{{#each guidelines}}
- {{this}}
{{/each}}

{{#if enableEscalation}}
## Escalation

When you encounter issues you cannot resolve, use the `ask-human` tool to escalate.
{{/if}}
```

**Prompt Loader Utility:**
```typescript
import { readFileSync } from 'fs';
import { join } from 'path';

export function renderTemplate(template: string, variables: Record<string, any>): string {
  let result = template;

  // Handle conditional blocks: {{#if variable}}...{{/if}}
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  result = result.replace(conditionalRegex, (match, varName, content) => {
    return variables[varName] ? content : '';
  });

  // Handle simple variables: {{variable}}
  const variableRegex = /\{\{(\w+)\}\}/g;
  result = result.replace(variableRegex, (match, varName) => {
    return variables[varName] !== undefined ? String(variables[varName]) : '';
  });

  return result;
}

export function loadPrompt(promptName: string, variables: Record<string, any> = {}): string {
  const template = readFileSync(join(__dirname, '..', 'prompts', `${promptName}.md`), 'utf-8');
  return renderTemplate(template, variables);
}
```

**Usage in Agent:**
```typescript
import { loadPrompt } from './prompt-loader';

export interface PromptConfig {
  role?: string;
  goal?: string;
  guidelines?: string[];
  examples?: Array<{ scenario: string; response: string }>;
  constraints?: string[];
}

export function buildSystemPrompt(config: CustomerSupportConfig): string {
  const { systemPrompt, companyName, enableHumanEscalation } = config;

  // Allow complete custom override
  if (systemPrompt) {
    return systemPrompt;
  }

  // Load and render prompt from external .md file
  return loadPrompt('system', {
    agentRole: 'customer support agent',
    companyName,
    enableEscalation: enableHumanEscalation,
    responsibilities: [
      'Greet customers warmly',
      'Listen actively to understand issues',
      'Provide clear solutions',
    ],
    guidelines: [
      'Be polite and empathetic',
      'Use simple language',
      'Document all interactions',
    ],
  });
}

// Usage
export function createSupportAgent(config: CustomerSupportConfig = {}) {
  const systemPrompt = buildSystemPrompt(config);

  return createReActAgent({
    model: new ChatOpenAI({ modelName: 'gpt-4' }),
    tools: config.tools || [],
    systemPrompt,
  });
}
```

**Benefits of External Prompts:**

- ✅ **Separation of Concerns**: Prompts are content, not code
- ✅ **Easier to Read**: Markdown is more readable than template strings
- ✅ **Version Control**: Track prompt changes independently from code
- ✅ **Team Collaboration**: Non-developers can edit prompts
- ✅ **Reusability**: Share prompts across multiple agents
- ✅ **Testing**: Easier to test different prompt variations
- ✅ **Localization**: Create language-specific prompt files

**Alternative: Inline Prompts (Not Recommended)**

For simple cases, you can build prompts inline, but this becomes hard to maintain:
      'Provide clear, actionable solutions',
      'Follow up to ensure satisfaction',
    ],
    constraints: [
      'Never share customer data with unauthorized parties',
      'Escalate to human if issue is complex or sensitive',
      'Always maintain a professional tone',
    ],
    ...promptConfig,
  });

  return createReActAgent({
    model: new ChatOpenAI({ modelName: 'gpt-4' }),
    tools: [],
    systemPrompt,
  });
}
```

## TypeScript Best Practices

### 1. Strong Typing

Use TypeScript to make your agents type-safe:

```typescript
import type { Tool } from '@agentforge/core';
import type { BaseLanguageModel } from '@langchain/core/language_models/base';

// Define strict configuration types
export interface StrictAgentConfig {
  model: BaseLanguageModel;  // Required, not optional
  tools: Tool[];             // Required, not optional
  systemPrompt: string;      // Required, not optional
}

// Use branded types for IDs
export type CustomerId = string & { readonly __brand: 'CustomerId' };
export type OrderId = string & { readonly __brand: 'OrderId' };

// Type-safe tool inputs
export interface GetCustomerInput {
  customerId: CustomerId;
}

export interface GetOrderInput {
  orderId: OrderId;
}
```

### 2. Generic Agents

Create generic agents that work with different state types:

```typescript
import type { StateGraph } from '@langchain/langgraph';

export interface AgentState<TData = unknown> {
  messages: Array<{ role: string; content: string }>;
  data: TData;
  metadata: Record<string, unknown>;
}

export function createTypedAgent<TData>(
  config: {
    model: BaseLanguageModel;
    tools: Tool[];
    initialData: TData;
  }
): StateGraph<AgentState<TData>> {
  // Implementation
  return createReActAgent({
    model: config.model,
    tools: config.tools,
    systemPrompt: 'Agent with typed state',
  });
}

// Usage with specific data type
interface CustomerData {
  id: string;
  name: string;
  tier: 'bronze' | 'silver' | 'gold';
}

const agent = createTypedAgent<CustomerData>({
  model: new ChatOpenAI({ modelName: 'gpt-4' }),
  tools: [],
  initialData: { id: '123', name: 'John', tier: 'gold' },
});
```

### 3. Validation with Zod

Use Zod for runtime validation of configuration:

```typescript
import { z } from 'zod';

const AgentConfigSchema = z.object({
  model: z.object({
    provider: z.enum(['openai', 'anthropic']),
    modelName: z.string(),
    temperature: z.number().min(0).max(2).optional(),
  }),
  behavior: z.object({
    maxIterations: z.number().int().positive().optional(),
    timeout: z.number().int().positive().optional(),
  }).optional(),
  tools: z.object({
    enabled: z.array(z.string()),
    disabled: z.array(z.string()).optional(),
  }).optional(),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

export function createValidatedAgent(config: unknown) {
  // Validate configuration at runtime
  const validConfig = AgentConfigSchema.parse(config);

  // Now TypeScript knows the exact shape
  return createReActAgent({
    model: createModel(validConfig.model),
    tools: [],
    systemPrompt: 'Validated agent',
  });
}
```

## Publishing to npm

### Package Structure

Organize your reusable agent as an npm package:

```
my-agent/
├── src/
│   ├── index.ts           # Main exports
│   ├── agent.ts           # Agent factory function
│   ├── config.ts          # Configuration types
│   ├── prompts.ts         # System prompts
│   └── tools/             # Custom tools
│       ├── index.ts
│       └── my-tool.ts
├── tests/
│   ├── agent.test.ts
│   └── tools.test.ts
├── examples/
│   └── basic-usage.ts
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

### package.json

```json
{
  "name": "@myorg/customer-support-agent",
  "version": "1.0.0",
  "description": "Reusable customer support agent for AgentForge",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "test": "vitest run",
    "prepublishOnly": "pnpm build && pnpm test"
  },
  "keywords": [
    "agentforge",
    "ai-agent",
    "customer-support",
    "langchain",
    "llm"
  ],
  "peerDependencies": {
    "@agentforge/core": "^0.3.0",
    "@agentforge/patterns": "^0.3.0",
    "@langchain/core": "^0.1.0"
  },
  "devDependencies": {
    "@agentforge/core": "^0.3.0",
    "@agentforge/patterns": "^0.3.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

### Publishing Checklist

Before publishing your agent to npm:

- [ ] **Documentation**
  - [ ] Comprehensive README with examples
  - [ ] API documentation for all exports
  - [ ] Configuration options documented
  - [ ] Usage examples provided

- [ ] **Code Quality**
  - [ ] All tests passing
  - [ ] TypeScript types exported
  - [ ] No linting errors
  - [ ] Code formatted consistently

- [ ] **Package Configuration**
  - [ ] Correct peer dependencies
  - [ ] Proper exports in package.json
  - [ ] Version number follows semver
  - [ ] License file included

- [ ] **Testing**
  - [ ] Unit tests for agent factory
  - [ ] Integration tests with real LLM
  - [ ] Tests for all configuration options
  - [ ] Edge cases covered

- [ ] **Examples**
  - [ ] Basic usage example
  - [ ] Advanced configuration example
  - [ ] Integration example

## Versioning Strategies

### Semantic Versioning

Follow [semver](https://semver.org/) for version numbers:

**MAJOR.MINOR.PATCH** (e.g., 1.2.3)

- **MAJOR**: Breaking changes to API or behavior
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Breaking Changes

Examples of breaking changes:
- Removing or renaming configuration options
- Changing default behavior significantly
- Removing tools from default set
- Changing system prompt in ways that alter behavior
- Updating peer dependencies to incompatible versions

```typescript
// ❌ Breaking change (v1 -> v2)
// v1
export function createAgent(config: { model: string }) { }

// v2 - Changed config structure
export function createAgent(config: { llm: { provider: string } }) { }

// ✅ Non-breaking change (v1.0 -> v1.1)
// v1.0
export function createAgent(config: { model: string }) { }

// v1.1 - Added optional parameter
export function createAgent(config: {
  model: string;
  temperature?: number;  // New, optional
}) { }
```

### Deprecation Strategy

When deprecating features:

```typescript
/**
 * @deprecated Use `createAgentV2` instead. Will be removed in v3.0.0
 */
export function createAgent(config: OldConfig) {
  console.warn('createAgent is deprecated. Use createAgentV2 instead.');
  return createAgentV2(migrateConfig(config));
}

export function createAgentV2(config: NewConfig) {
  // New implementation
}
```

### Changelog

Maintain a CHANGELOG.md:

```markdown
# Changelog

## [2.0.0] - 2024-01-20

### Breaking Changes
- Changed configuration structure to support multiple LLM providers
- Removed deprecated `createAgent` function

### Added
- Support for Anthropic Claude models
- New `enableStreaming` configuration option

### Fixed
- Fixed timeout handling in long-running conversations

## [1.2.0] - 2024-01-15

### Added
- New `maxRetries` configuration option
- Support for custom error handlers

### Fixed
- Fixed memory leak in conversation history
```

## Best Practices

### 1. Provide Sensible Defaults

Make agents work out-of-the-box with minimal configuration:

```typescript
export function createAgent(config: Partial<AgentConfig> = {}) {
  const defaults: AgentConfig = {
    model: new ChatOpenAI({ modelName: 'gpt-4', temperature: 0.7 }),
    tools: [currentDateTime],
    systemPrompt: DEFAULT_PROMPT,
    maxIterations: 10,
    timeout: 60000,
  };

  const finalConfig = { ...defaults, ...config };

  return createReActAgent(finalConfig);
}

// Easy to use with defaults
const agent1 = createAgent();

// Easy to customize
const agent2 = createAgent({
  model: new ChatOpenAI({ modelName: 'gpt-3.5-turbo' }),
  maxIterations: 5,
});
```

### 2. Document Configuration Options

Provide clear documentation for all options:

```typescript
export interface AgentConfig {
  /**
   * Language model to use for the agent.
   * @default ChatOpenAI with gpt-4
   * @example
   * ```ts
   * model: new ChatOpenAI({ modelName: 'gpt-3.5-turbo' })
   * ```
   */
  model?: BaseLanguageModel;

  /**
   * Tools available to the agent.
   * @default [currentDateTime]
   * @example
   * ```ts
   * tools: [searchTool, calculatorTool]
   * ```
   */
  tools?: Tool[];

  /**
   * Maximum number of reasoning iterations.
   * @default 10
   * @minimum 1
   * @maximum 50
   */
  maxIterations?: number;
}
```

### 3. Validate Configuration

Validate configuration early to provide helpful errors:

```typescript
export function createAgent(config: AgentConfig) {
  // Validate required fields
  if (!config.model) {
    throw new Error('model is required');
  }

  // Validate ranges
  if (config.maxIterations && (config.maxIterations < 1 || config.maxIterations > 50)) {
    throw new Error('maxIterations must be between 1 and 50');
  }

  // Validate tool compatibility
  if (config.tools) {
    const toolNames = config.tools.map(t => t.metadata.name);
    const duplicates = toolNames.filter((name, i) => toolNames.indexOf(name) !== i);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate tools: ${duplicates.join(', ')}`);
    }
  }

  return createReActAgent(config);
}
```

### 4. Support Testing

Make agents easy to test using AgentForge's tool builder:

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

// Provide mock tools for testing
export const mockTools = {
  getCustomer: toolBuilder()
    .name('get-customer')
    .description('Get customer information by ID')
    .category(ToolCategory.UTILITY)
    .schema(z.object({
      id: z.string().describe('Customer ID')
    }))
    .implement(async ({ id }) => ({
      id,
      name: 'Test Customer',
      email: 'test@example.com',
      tier: 'gold',
    }))
    .build(),

  processOrder: toolBuilder()
    .name('process-order')
    .description('Process a customer order')
    .category(ToolCategory.UTILITY)
    .schema(z.object({
      orderId: z.string().describe('Order ID'),
      action: z.enum(['approve', 'reject']).describe('Action to take'),
    }))
    .implement(async ({ orderId, action }) => ({
      orderId,
      action,
      status: 'completed',
      timestamp: Date.now(),
    }))
    .build(),
};

// Provide test configuration
export const testConfig: AgentConfig = {
  model: new ChatOpenAI({ modelName: 'gpt-3.5-turbo', temperature: 0 }),
  tools: Object.values(mockTools),
  maxIterations: 3,
};

// Usage in tests
import { createAgent, testConfig, mockTools } from '@myorg/my-agent';

test('agent handles customer query', async () => {
  const agent = createAgent(testConfig);
  const result = await agent.invoke({
    messages: [{ role: 'user', content: 'Get customer 123' }],
  });
  expect(result).toBeDefined();
});

test('agent uses correct tools', async () => {
  const agent = createAgent({
    ...testConfig,
    tools: [mockTools.getCustomer],
  });

  // Verify tool is available
  const tools = agent.getTools();
  expect(tools).toHaveLength(1);
  expect(tools[0].metadata.name).toBe('get-customer');
});
```

### 5. Handle Errors Gracefully

Provide clear error messages and recovery:

```typescript
export function createAgent(config: AgentConfig) {
  try {
    // Validate configuration
    validateConfig(config);

    // Create agent
    const agent = createReActAgent(config);

    // Wrap with error handling
    return {
      async invoke(input: any) {
        try {
          return await agent.invoke(input);
        } catch (error) {
          if (error instanceof RateLimitError) {
            throw new Error(
              'Rate limit exceeded. Please try again later or upgrade your plan.'
            );
          }
          if (error instanceof TimeoutError) {
            throw new Error(
              `Agent timed out after ${config.timeout}ms. Consider increasing timeout.`
            );
          }
          throw error;
        }
      },
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new Error(`Invalid configuration: ${error.message}`);
    }
    throw error;
  }
}
```

### 6. Provide Examples

Include working examples in your package:

```typescript
// examples/basic-usage.ts
import { createCustomerSupportAgent } from '@myorg/customer-support-agent';
import { ChatOpenAI } from '@langchain/openai';

async function main() {
  // Basic usage with defaults
  const agent = createCustomerSupportAgent();

  const result = await agent.invoke({
    messages: [
      { role: 'user', content: 'How do I reset my password?' }
    ],
  });

  console.log(result.messages[result.messages.length - 1].content);
}

main();
```

```typescript
// examples/advanced-usage.ts
import { createCustomerSupportAgent } from '@myorg/customer-support-agent';
import { ChatOpenAI } from '@langchain/openai';
import { createAskHumanTool } from '@agentforge/tools';

async function main() {
  // Advanced usage with custom configuration
  const agent = createCustomerSupportAgent({
    model: new ChatOpenAI({
      modelName: 'gpt-4-turbo',
      temperature: 0.5,
    }),
    tools: [
      createAskHumanTool(),
      // ... custom tools
    ],
    systemPrompt: `You are a senior customer support specialist...`,
    maxIterations: 15,
  });

  const result = await agent.invoke({
    messages: [
      { role: 'user', content: 'I need a refund for order #12345' }
    ],
  });

  console.log(result);
}

main();
```

## Complete Example

Here's a complete example of a reusable agent:

```typescript
// src/index.ts
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import { currentDateTime } from '@agentforge/tools';
import type { Tool } from '@agentforge/core';
import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import { z } from 'zod';

// Configuration schema
const ConfigSchema = z.object({
  model: z.custom<BaseLanguageModel>().optional(),
  tools: z.array(z.custom<Tool>()).optional(),
  systemPrompt: z.string().optional(),
  maxIterations: z.number().int().positive().max(50).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

export type CustomerSupportConfig = z.infer<typeof ConfigSchema>;

// Default system prompt
const DEFAULT_SYSTEM_PROMPT = `You are a helpful customer support agent.

Your responsibilities:
1. Greet customers warmly and professionally
2. Listen actively to understand their issue
3. Provide clear, actionable solutions
4. Follow up to ensure satisfaction

Guidelines:
- Always be polite and empathetic
- Ask clarifying questions when needed
- Escalate complex issues to human agents
- Never share sensitive customer data`;

// Agent factory function
export function createCustomerSupportAgent(
  config: CustomerSupportConfig = {}
): ReturnType<typeof createReActAgent> {
  // Validate configuration
  const validConfig = ConfigSchema.parse(config);

  // Apply defaults
  const {
    model = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: validConfig.temperature ?? 0.7,
    }),
    tools = [currentDateTime],
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    maxIterations = 10,
  } = validConfig;

  // Create and return agent
  return createReActAgent({
    model,
    tools,
    systemPrompt,
    maxIterations,
  });
}

// Export types and utilities
export type { CustomerSupportConfig };
export { DEFAULT_SYSTEM_PROMPT };
```

## Next Steps

- See [Publishing Checklist](#publishing-checklist) for pre-publish steps
- Review [Versioning Strategies](#versioning-strategies) for version management
- Check [TypeScript Best Practices](#typescript-best-practices) for type safety
- Explore [Tool Injection](#3-tool-injection-and-composition) for composability

## Related Guides

- [Tools Guide](../concepts/tools.md) - Creating custom tools
- [Patterns Guide](../concepts/patterns.md) - Agent patterns overview
- [Testing Guide](../../api/testing.md) - Testing agents
- [Deployment Guide](./deployment.md) - Deploying agents to production


