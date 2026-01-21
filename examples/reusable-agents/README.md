# Reusable Agent Examples

This directory contains production-ready examples of reusable AI agents built with AgentForge. Each agent demonstrates best practices for creating flexible, configurable agents that can be customized for different use cases.

## 📦 Available Agents

### [Customer Support Agent](./customer-support/)
A configurable customer support agent with escalation capabilities.

**Key Features:**
- Human escalation for complex issues
- Ticket creation and tracking
- Knowledge base integration
- Company branding customization
- **24 tests passing** ✅

**Use Cases:**
- E-commerce support
- SaaS customer service
- Help desk automation
- FAQ handling

[View Documentation →](./customer-support/README.md)

---

### [Code Review Agent](./code-review/)
An automated code review agent with security and performance analysis.

**Key Features:**
- Security vulnerability detection
- Performance optimization suggestions
- Strict mode for critical code
- Auto-approve for trivial changes
- Language-specific review rules
- **26 tests passing** ✅

**Use Cases:**
- Pull request automation
- Security audits
- Performance optimization
- Code quality enforcement

[View Documentation →](./code-review/README.md)

---

### [Data Analyst Agent](./data-analyst/)
A flexible data analysis agent with statistical methods and visualization.

**Key Features:**
- Statistical analysis (mean, median, correlation, etc.)
- Data quality validation
- Chart and graph generation
- Confidential data handling
- Analysis depth configuration (quick/standard/deep)
- **28 tests passing** ✅

**Use Cases:**
- Business intelligence
- Research data analysis
- Data quality monitoring
- Report generation

[View Documentation →](./data-analyst/README.md)

---

## 🎯 Common Patterns

All three agents demonstrate these production-ready patterns:

### 1. Factory Function Pattern

Each agent exports a factory function that creates a configured agent:

```typescript
import { createCustomerSupportAgent } from './customer-support';

const agent = createCustomerSupportAgent({
  companyName: 'Acme Corp',
  supportEmail: 'support@acme.com',
  enableHumanEscalation: true,
});
```

**Benefits:**
- Easy to instantiate with different configurations
- Type-safe configuration with Zod validation
- Sensible defaults for quick setup
- Flexible customization for advanced use cases

### 2. External Prompt Pattern

Prompts are stored in `.md` files with variable placeholders:

```markdown
# Customer Support Agent

You are a professional customer support agent{{#if companyName}} representing {{companyName}}{{/if}}.

{{#if enableHumanEscalation}}
- **Escalate complex issues** to human agents when appropriate
{{/if}}
```

**Benefits:**
- Separation of concerns (prompts vs. code)
- Easier to read and edit
- Version control for prompt changes
- Non-developers can contribute
- Reusable across agents

**Template Syntax:**
- Simple variables: `{{variableName}}`
- Conditional blocks: `{{#if variableName}}...{{/if}}`

### 3. Tool Injection

All agents support custom tool injection via ToolRegistry:

```typescript
import { ToolRegistry, toolBuilder, ToolCategory } from '@agentforge/core';

const registry = new ToolRegistry();

const customTool = toolBuilder()
  .name('my-custom-tool')
  .description('Does something specific to my use case')
  .category(ToolCategory.UTILITY)
  .schema(z.object({ input: z.string() }))
  .implement(async ({ input }) => ({ result: 'done' }))
  .build();

registry.register(customTool);

const agent = createCustomerSupportAgent({
  toolRegistry: registry,
  enabledCategories: [ToolCategory.UTILITY],
});
```

**Benefits:**
- Extend agents with domain-specific tools
- Compose tools from multiple sources
- Filter tools by category
- Easy to test with mock tools

### 4. Feature Flags

Enable/disable capabilities based on your needs:

```typescript
const agent = createCodeReviewAgent({
  enableSecurityChecks: true,    // Enable security analysis
  enablePerformanceChecks: false, // Disable performance checks
  strictMode: true,               // Flag even minor issues
  autoApprove: false,             // Require manual approval
});
```

**Benefits:**
- Customize behavior without code changes
- Progressive feature adoption
- A/B testing different configurations
- Environment-specific settings

### 5. Configuration Validation

All configurations are validated with Zod schemas:

```typescript
export const CustomerSupportConfigSchema = z.object({
  model: z.custom<BaseLanguageModel>().optional(),
  temperature: z.number().min(0).max(2).optional(),
  companyName: z.string().optional(),
  // ... more fields
});

export type CustomerSupportConfig = z.infer<typeof CustomerSupportConfigSchema>;
```

**Benefits:**
- Type safety at runtime
- Clear error messages for invalid configs
- Auto-generated TypeScript types
- Self-documenting configuration

## 🚀 Getting Started

### 1. Choose an Agent

Pick the agent that best matches your use case:
- **Customer Support** - For user-facing support automation
- **Code Review** - For development workflow automation
- **Data Analyst** - For data analysis and insights

### 2. Install Dependencies

```bash
npm install @agentforge/core @agentforge/patterns @agentforge/tools @langchain/openai zod
```

### 3. Create Your Agent

```typescript
import { createCustomerSupportAgent } from './customer-support';

const agent = createCustomerSupportAgent({
  companyName: 'Your Company',
  supportEmail: 'support@yourcompany.com',
});
```

### 4. Customize as Needed

- **Modify prompts**: Edit `prompts/system.md`
- **Add tools**: Inject custom tools via `customTools` or `toolRegistry`
- **Adjust behavior**: Use feature flags and configuration options
- **Override completely**: Pass custom `systemPrompt` or `model`

### 5. Test Thoroughly

Each agent includes comprehensive tests. Run them to ensure everything works:

```bash
cd customer-support  # or code-review, or data-analyst
npm test
```

## 📚 Using as Templates

These agents are designed to be used as templates for your own agents:

### Option 1: Copy and Modify

1. Copy the entire agent directory
2. Rename files and functions
3. Modify the prompt in `prompts/system.md`
4. Add/remove tools in `buildTools()`
5. Update configuration schema
6. Update tests

### Option 2: Extend with Custom Tools

1. Use the agent as-is
2. Create custom tools for your domain
3. Inject via `customTools` or `toolRegistry`
4. Configure with feature flags

### Option 3: Fork and Customize

1. Fork the repository
2. Modify the agents to fit your needs
3. Publish as your own package
4. Share with your team

## 🧪 Testing Patterns

All agents demonstrate comprehensive testing:

### Configuration Validation Tests
```typescript
it('should reject invalid temperature', () => {
  const config = { temperature: 3.0 }; // Invalid: > 2
  expect(() => ConfigSchema.parse(config)).toThrow();
});
```

### Tool Injection Tests
```typescript
it('should accept custom tools', () => {
  const customTool = toolBuilder()
    .name('my-tool')
    // ... tool definition
    .build();

  const agent = createAgent({ customTools: [customTool] });
  expect(agent).toBeDefined();
});
```

### Reusability Scenario Tests
```typescript
it('should create security-focused review agent', () => {
  const agent = createCodeReviewAgent({
    enableSecurityChecks: true,
    strictMode: true,
  });
  expect(agent).toBeDefined();
});
```

## 📖 Documentation

Each agent includes:
- **README.md** - Complete usage guide
- **Configuration reference** - All options documented
- **Built-in tools** - Tool descriptions and parameters
- **Examples** - Common use cases
- **Tests** - Demonstrating all features

## 🔗 Related Resources

- [Reusable Agents Guide](../../docs-site/guide/advanced/reusable-agents.md) - Comprehensive guide
- [Tool Builder API](../../packages/core/README.md) - Creating custom tools
- [Agent Patterns](../../packages/patterns/README.md) - ReAct, Plan-Execute, etc.
- [AgentForge Tools](../../packages/tools/README.md) - 70+ reusable tools

## 💡 Best Practices

### 1. Start Simple
Begin with default configuration and add complexity as needed.

### 2. Use External Prompts
Keep prompts in `.md` files for easier maintenance and collaboration.

### 3. Validate Configuration
Always use Zod schemas for runtime validation.

### 4. Test Reusability
Write tests that demonstrate different configurations and use cases.

### 5. Document Everything
Include clear README with examples, configuration reference, and usage patterns.

### 6. Version Carefully
Follow semantic versioning when publishing reusable agents.

## 🤝 Contributing

These examples are meant to inspire and guide. If you create interesting reusable agents:
1. Follow the same patterns demonstrated here
2. Include comprehensive tests
3. Write clear documentation
4. Share with the community!

## 📝 License

MIT

