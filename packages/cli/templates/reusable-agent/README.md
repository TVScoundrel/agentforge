# {{AGENT_NAME_PASCAL}} Agent

{{AGENT_DESCRIPTION}}

A configurable, vertical AI agent built with AgentForge.

> **Vertical Agent**: A domain-specific, reusable agent optimized for specific use cases.

## Features

- ✅ **Factory Function Pattern** - Easy to instantiate with different configurations
- ✅ **External Prompt Templates** - Prompts stored in `.md` files for easy editing
- ✅ **Tool Injection** - Add custom tools via ToolRegistry or direct injection
- ✅ **Feature Flags** - Enable/disable capabilities as needed
- ✅ **Configuration Validation** - Type-safe configuration with Zod schemas
- ✅ **Comprehensive Tests** - Full test coverage demonstrating all features

## Installation

```bash
npm install @agentforge/core @agentforge/patterns @agentforge/tools @langchain/openai zod
```

## Quick Start

```typescript
import { create{{AGENT_NAME_PASCAL}}Agent } from './{{AGENT_NAME_KEBAB}}';

// Create with default configuration
const agent = create{{AGENT_NAME_PASCAL}}Agent();

// Invoke the agent
const result = await agent.invoke({
  input: 'Your query here',
});

console.log(result);
```

## Configuration

### Basic Configuration

```typescript
const agent = create{{AGENT_NAME_PASCAL}}Agent({
  organizationName: 'Acme Corp',
  temperature: 0.7,
  maxIterations: 10,
});
```

### With Custom Tools

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';

const customTool = toolBuilder()
  .name('my-custom-tool')
  .description('Does something specific')
  .category(ToolCategory.UTILITY)
  .schema(z.object({
    input: z.string().describe('Input parameter'),
  }))
  .implement(async ({ input }) => {
    return { result: `Processed: ${input}` };
  })
  .build();

const agent = create{{AGENT_NAME_PASCAL}}Agent({
  customTools: [customTool],
});
```

### With Tool Registry

```typescript
import { ToolRegistry, ToolCategory } from '@agentforge/core';

const registry = new ToolRegistry();
// ... register tools

const agent = create{{AGENT_NAME_PASCAL}}Agent({
  toolRegistry: registry,
  enabledCategories: [ToolCategory.UTILITY],
});
```

### Feature Flags

```typescript
const agent = create{{AGENT_NAME_PASCAL}}Agent({
  enableExampleFeature: true,  // Enable example feature
});
```

## Configuration Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `model` | `BaseLanguageModel` | `ChatOpenAI(gpt-4)` | LLM model to use |
| `temperature` | `number` | `0.7` | Model temperature (0-2) |
| `customTools` | `Tool[]` | `[]` | Custom tools to inject |
| `toolRegistry` | `ToolRegistry` | `undefined` | Tool registry for tool management |
| `enabledCategories` | `ToolCategory[]` | `undefined` | Filter tools by category |
| `enableExampleFeature` | `boolean` | `true` | Enable example feature |
| `maxIterations` | `number` | `10` | Maximum agent iterations |
| `systemPrompt` | `string` | (from file) | Custom system prompt |
| `organizationName` | `string` | `undefined` | Organization name for context |
| `description` | `string` | (default) | Agent description |

## Built-in Tools

### example-action
Perform an example action.

**Parameters:**
- `input` (string) - Input for the action

**Returns:**
- `result` (string) - Processed result
- `success` (boolean) - Success status

## Prompt Management

Prompts are stored in `prompts/system.md` and support variable substitution:

```markdown
# {{AGENT_NAME_PASCAL}} Agent

You are working for {{organizationName}}.

{{#if enableExampleFeature}}
You have access to example features.
{{/if}}
```

**Template Syntax:**
- Simple variables: `{{variableName}}`
- Conditional blocks: `{{#if variableName}}...{{/if}}`

## Testing

```bash
npm test
```

## License

MIT

