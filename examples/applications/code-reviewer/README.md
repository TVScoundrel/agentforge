# Code Reviewer Example

An AI-powered code review assistant that analyzes code quality, identifies issues, and suggests improvements using the Reflection pattern for thorough analysis.

## Features

- 🔍 **Code Quality Analysis**: Evaluate code readability, maintainability, and style
- 📊 **Complexity Metrics**: Calculate cyclomatic complexity and nesting depth
- ✅ **Best Practices**: Check adherence to coding standards and patterns
- 🐛 **Bug Detection**: Identify potential bugs and edge cases
- 🔒 **Security Review**: Spot security vulnerabilities
- ⚡ **Performance Analysis**: Find performance bottlenecks
- 💡 **Improvement Suggestions**: Get specific, actionable recommendations

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

Review any code file:

```bash
# From the repository root
pnpm tsx examples/applications/code-reviewer/src/index.ts <file-path>
```

### Examples

```bash
# Review a TypeScript file
pnpm tsx examples/applications/code-reviewer/src/index.ts packages/core/src/tools/builder.ts

# Review a JavaScript file
pnpm tsx examples/applications/code-reviewer/src/index.ts examples/applications/research-assistant/src/index.ts

# Review the code reviewer itself (meta!)
pnpm tsx examples/applications/code-reviewer/src/index.ts examples/applications/code-reviewer/src/index.ts
```

## How It Works

This example uses the **Reflection Pattern** for thorough code review:

1. **Initial Analysis**: The agent analyzes the code using available tools
2. **Complexity Check**: Calculates metrics like cyclomatic complexity
3. **Best Practices**: Checks against common patterns and standards
4. **Reflection Phase**: Reviews its own analysis for completeness
5. **Final Report**: Generates comprehensive review with prioritized recommendations

## Tools Used

- `analyze_complexity` - Custom tool for complexity metrics
- `check_best_practices` - Custom tool for best practice validation
- `fileReader` - Reads additional files if needed

## Review Criteria

The code reviewer checks for:

### Code Quality
- Readability and clarity
- Naming conventions
- Code organization
- Documentation quality

### Complexity
- Cyclomatic complexity
- Nesting depth
- Function length
- Code duplication

### Best Practices
- Type safety (TypeScript)
- Error handling
- Logging practices
- Modern syntax usage

### Security
- Input validation
- SQL injection risks
- XSS vulnerabilities
- Sensitive data exposure

### Performance
- Inefficient algorithms
- Memory leaks
- Unnecessary computations
- Optimization opportunities

## Customization

### Adjust Review Depth

Modify the `maxIterations` for more thorough reviews:

```typescript
const agent = createReflectionAgent({
  model,
  tools: [...],
  maxIterations: 15, // More iterations = deeper analysis
});
```

### Add Custom Checks

Create custom tools for specific checks:

```typescript
const checkSecurityTool = createTool()
  .name('check_security')
  .description('Check for security vulnerabilities')
  .schema(z.object({ code: z.string() }))
  .implement(async ({ code }) => {
    // Custom security checks
    const issues = [];
    if (code.includes('eval(')) {
      issues.push('Dangerous eval() usage detected');
    }
    return JSON.stringify(issues);
  })
  .build();
```

### Customize Review Focus

Modify the system prompt to focus on specific aspects:

```typescript
systemPrompt: `You are a security-focused code reviewer.
Prioritize security vulnerabilities and data protection issues.
Check for OWASP Top 10 vulnerabilities.`,
```

## Integration with CI/CD

Use this code reviewer in your CI/CD pipeline:

```yaml
# .github/workflows/code-review.yml
name: AI Code Review
on: [pull_request]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: |
          for file in $(git diff --name-only origin/main...HEAD | grep '\.ts$'); do
            pnpm tsx examples/applications/code-reviewer/src/index.ts "$file"
          done
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## Learn More

- [AgentForge Documentation](../../../docs-site/)
- [Reflection Pattern Guide](../../../docs-site/api/patterns.md#reflection-agent)
- [Custom Tools Guide](../../../docs-site/tutorials/custom-tools.md)

## License

MIT

