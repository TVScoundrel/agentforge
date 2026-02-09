# Reflection Pattern Examples

This directory contains comprehensive examples demonstrating the Reflection pattern implementation in `@agentforge/patterns`.

## What is the Reflection Pattern?

The Reflection pattern is an agentic workflow that iteratively improves outputs through a cycle of:
1. **Generation** - Create an initial response
2. **Reflection** - Critically evaluate the response
3. **Revision** - Improve the response based on feedback
4. **Repeat** - Continue until quality criteria are met or max iterations reached

This pattern is particularly useful when you need high-quality outputs that meet specific standards.

## Examples Overview

### 01-basic-reflection.ts
**Basic usage of the Reflection pattern**

Demonstrates:
- Creating a simple reflection agent
- Setting quality criteria
- Viewing reflection history
- Understanding the iteration process

**Use case**: General-purpose content improvement

```bash
npx tsx packages/patterns/examples/reflection/01-basic-reflection.ts
```

### 02-essay-writing.ts
**Essay writing with iterative improvement**

Demonstrates:
- Academic writing with the Reflection pattern
- Strict quality criteria for essays
- Tracking quality progression
- Multiple revision cycles

**Use case**: Academic writing, content creation, documentation

```bash
npx tsx packages/patterns/examples/reflection/02-essay-writing.ts
```

### 03-code-generation.ts
**Code generation with self-review**

Demonstrates:
- Generating production-quality code
- Code review and refactoring
- Type safety and error handling
- Best practices enforcement

**Use case**: Code generation, refactoring, algorithm implementation

```bash
npx tsx packages/patterns/examples/reflection/03-code-generation.ts
```

### 04-custom-workflow.ts
**Building custom reflection workflows**

Demonstrates:
- Using individual node creators
- Custom routing logic
- Adding custom nodes to the workflow
- Fine-grained control over the reflection process

**Use case**: Advanced workflows, custom integrations, specialized requirements

```bash
npx tsx packages/patterns/examples/reflection/04-custom-workflow.ts
```

## Prerequisites

All examples require:
- Node.js 18+
- OpenAI API key set as environment variable

```bash
export OPENAI_API_KEY=your-key-here
```

## Running Examples

### Run a specific example:
```bash
npx tsx packages/patterns/examples/reflection/01-basic-reflection.ts
```

### Run all examples:
```bash
for file in packages/patterns/examples/reflection/*.ts; do
  echo "Running $file..."
  npx tsx "$file"
  echo ""
done
```

## Key Concepts

### Quality Criteria
Define what makes a good response:
```typescript
qualityCriteria: {
  minScore: 8,              // Minimum score (0-10) to meet standards
  criteria: [               // Specific criteria to evaluate
    'Clear and concise',
    'Technically accurate',
    'Well-structured'
  ],
  requireAll: true          // All criteria must be met
}
```

### Configuration Options

#### Generator Config
```typescript
generator: {
  model: ChatOpenAI,        // LLM instance
  systemPrompt: string,     // System prompt for generation
  verbose: boolean          // Enable logging
}
```

#### Reflector Config
```typescript
reflector: {
  model: ChatOpenAI,        // LLM instance
  systemPrompt: string,     // System prompt for reflection
  verbose: boolean          // Enable logging
}
```

#### Reviser Config
```typescript
reviser: {
  model: ChatOpenAI,        // LLM instance
  systemPrompt: string,     // System prompt for revision
  verbose: boolean          // Enable logging
}
```

#### Agent Config
```typescript
{
  generator: GeneratorConfig,
  reflector: ReflectorConfig,
  reviser: ReviserConfig,
  maxIterations: number,    // Maximum reflection cycles (default: 3)
  verbose: boolean          // Enable logging (default: false)
}
```

## Common Use Cases

### 1. Content Creation
- Blog posts
- Marketing copy
- Technical documentation
- Social media content

### 2. Code Generation
- Algorithm implementation
- Code refactoring
- API design
- Test generation

### 3. Academic Writing
- Essays
- Research papers
- Reports
- Proposals

### 4. Creative Writing
- Stories
- Scripts
- Poetry
- Dialogue

### 5. Data Analysis
- Report generation
- Insight extraction
- Recommendation creation
- Summary writing

## Best Practices

1. **Set Clear Quality Criteria**: Define specific, measurable criteria for success
2. **Use Appropriate System Prompts**: Tailor prompts to your specific use case
3. **Adjust Max Iterations**: Balance quality vs. cost/time
4. **Monitor Reflections**: Review feedback to understand improvement areas
5. **Lower Temperature for Code**: Use lower temperature (0.2-0.4) for code generation
6. **Higher Temperature for Creative**: Use higher temperature (0.7-0.9) for creative writing

## Troubleshooting

### Agent doesn't improve after iterations
- Check if quality criteria are too strict
- Review reflection feedback for actionable suggestions
- Adjust system prompts to be more specific
- Increase max iterations

### Quality score doesn't increase
- Ensure reflector provides specific, actionable feedback
- Check if reviser is addressing the feedback
- Review system prompts for clarity
- Consider using a more capable LLM

### Too many iterations
- Set stricter quality criteria
- Reduce max iterations
- Use early stopping based on score plateaus

## Learn More

- [Reflection Pattern Documentation](../../docs/reflection-pattern.md)
- [API Reference](../../src/reflection/README.md)
- [Test Examples](../../tests/reflection/)

## Contributing

Have a great example? Submit a PR with:
- Clear use case description
- Well-commented code
- Usage instructions
- Expected output example

