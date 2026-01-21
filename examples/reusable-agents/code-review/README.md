# Code Review Agent

A configurable, reusable code review agent built with AgentForge. This agent demonstrates best practices for creating flexible, production-ready AI agents that can be customized for different code review scenarios.

## Features

- ✅ **Configurable**: Customize model, tools, prompts, and review criteria
- 🔧 **Tool Injection**: Add custom tools for linting, testing, and analysis
- 🎯 **Feature Flags**: Enable/disable security checks, performance analysis, strict mode
- 📝 **Type-Safe**: Full TypeScript support with Zod validation
- 🧪 **Testable**: Easy to test with dependency injection
- 📦 **Reusable**: Use as-is or customize for your needs
- 📄 **External Prompts**: Prompts stored in `.md` files with `{{variable}}` placeholders

## Installation

```bash
npm install @agentforge/core @agentforge/patterns @agentforge/tools @langchain/openai zod
```

## Quick Start

```typescript
import { createCodeReviewAgent } from './index.js';

// Basic usage with defaults
const agent = createCodeReviewAgent();

// Run a code review
const result = await agent.invoke({
  messages: [{
    role: 'user',
    content: 'Review this TypeScript function: function add(a, b) { return a + b; }'
  }]
});
```

## Configuration

### Basic Configuration

```typescript
const agent = createCodeReviewAgent({
  teamName: 'Platform Team',
  languages: 'TypeScript, Python, Go',
  enableSecurityChecks: true,
  enablePerformanceChecks: true,
});
```

### Security-Focused Review

```typescript
const securityAgent = createCodeReviewAgent({
  teamName: 'Security Team',
  languages: 'TypeScript, Python',
  enableSecurityChecks: true,
  strictMode: true,
  reviewDepth: 'thorough',
});
```

### Performance-Focused Review

```typescript
const performanceAgent = createCodeReviewAgent({
  teamName: 'Performance Team',
  languages: 'C++, Rust, Go',
  enablePerformanceChecks: true,
  reviewDepth: 'thorough',
});
```

### With Custom Tools

```typescript
import { toolBuilder, ToolCategory } from '@agentforge/core';

const eslintTool = toolBuilder()
  .name('run-eslint')
  .description('Run ESLint on TypeScript/JavaScript code')
  .category(ToolCategory.UTILITY)
  .schema(z.object({
    code: z.string().describe('Code to lint'),
  }))
  .implement(async ({ code }) => {
    // Run ESLint and return results
    return { errors: [], warnings: [] };
  })
  .build();

const agent = createCodeReviewAgent({
  customTools: [eslintTool],
  languages: 'TypeScript, JavaScript',
});
```

### With ToolRegistry

```typescript
import { ToolRegistry } from '@agentforge/core';

const registry = new ToolRegistry();
registry.registerMany([eslintTool, prettierTool, jestTool]);

const agent = createCodeReviewAgent({
  toolRegistry: registry,
  enabledCategories: [ToolCategory.UTILITY],
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `model` | `BaseLanguageModel` | `ChatOpenAI(gpt-4)` | Language model to use |
| `temperature` | `number` | `0.3` | Model temperature (0-2) |
| `customTools` | `Tool[]` | `[]` | Additional tools to provide |
| `toolRegistry` | `ToolRegistry` | `undefined` | Tool registry for advanced composition |
| `enabledCategories` | `ToolCategory[]` | `undefined` | Filter tools by category |
| `enableSecurityChecks` | `boolean` | `true` | Enable security vulnerability checks |
| `enablePerformanceChecks` | `boolean` | `true` | Enable performance analysis |
| `enableHumanEscalation` | `boolean` | `false` | Enable human-in-the-loop for complex decisions |
| `strictMode` | `boolean` | `false` | Strict review mode (flag even minor issues) |
| `autoApprove` | `boolean` | `false` | Auto-approve trivial changes |
| `maxIterations` | `number` | `15` | Maximum agent iterations |
| `systemPrompt` | `string` | `undefined` | Custom system prompt override |
| `teamName` | `string` | `undefined` | Team name for context |
| `languages` | `string` | `undefined` | Supported languages (e.g., "TypeScript, Python") |
| `reviewDepth` | `'quick' \| 'standard' \| 'thorough'` | `'standard'` | Review thoroughness level |

## Built-in Tools

The agent includes these built-in tools:

### `analyze-code`
Analyze code for quality, security, and performance issues. Returns detailed analysis with severity levels.

**Parameters:**
- `code` (string): The code to analyze
- `language` (string): Programming language
- `context` (string, optional): Additional context

### `check-security`
Check code for security vulnerabilities and best practices.

**Parameters:**
- `code` (string): The code to check
- `language` (string): Programming language

### `check-performance`
Analyze code for performance issues and optimization opportunities.

**Parameters:**
- `code` (string): The code to analyze
- `language` (string): Programming language

### `ask-human` (when `enableHumanEscalation: true`)
Escalate complex architectural decisions to a human reviewer.

## Prompt Management

This agent demonstrates the **external prompt pattern** - a best practice for managing agent prompts:

### Why External Prompts?

- **Separation of Concerns**: Keep prompts separate from code logic
- **Easier to Read**: Prompts are in markdown, not embedded in strings
- **Version Control**: Track prompt changes independently
- **Team Collaboration**: Non-developers can edit prompts
- **Reusability**: Share prompts across agents

### Prompt Structure

Prompts are stored in `prompts/system.md` with variable placeholders:

```markdown
# Code Review Agent

You are an expert code reviewer{{#if teamName}} for the {{teamName}} team{{/if}}.

## Your Responsibilities

1. **Review code quality** - Check for bugs, code smells, and anti-patterns
...

{{#if enableSecurityChecks}}
### Security Focus
- **Input validation**: All user inputs are properly validated
...
{{/if}}
```

### Variable Substitution

The prompt loader supports:
- **Simple variables**: `{{teamName}}` → replaced with value
- **Conditional blocks**: `{{#if variable}}...{{/if}}` → included if truthy

### Custom Prompts

You can either:
1. **Modify the template**: Edit `prompts/system.md` directly
2. **Override completely**: Pass `systemPrompt` in config
3. **Add new templates**: Create new `.md` files and load them

```typescript
import { loadPrompt } from './prompt-loader';

// Load custom prompt
const customPrompt = loadPrompt('my-custom-prompt', {
  teamName: 'Security Team',
  strictMode: true,
});
```

## Examples

See the test file for more usage examples:
- Basic code review
- Security-focused review
- Performance-focused review
- Junior-friendly review (less strict)
- Custom linting tools integration

## Testing

```bash
npm test
```

All 26 tests passing, demonstrating:
- Configuration validation
- Tool injection patterns
- Feature flag combinations
- Reusability scenarios

## License

MIT

