# Reflection Pattern Guide

## Overview

The Reflection pattern is an agentic workflow that iteratively improves outputs through self-critique and revision. It's inspired by how humans improve their work through reflection and iteration.

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Reflection Agent                          │
│                                                              │
│  ┌──────────┐    ┌───────────┐    ┌─────────┐    ┌────────┐│
│  │Generator │───▶│ Reflector │───▶│ Reviser │───▶│Finisher││
│  └──────────┘    └───────────┘    └─────────┘    └────────┘│
│       │               │                 │             │      │
│       │               │                 │             │      │
│       └───────────────┴─────────────────┴─────────────┘      │
│                    Reflection Loop                           │
└─────────────────────────────────────────────────────────────┘
```

### Workflow

1. **Generator**: Creates initial response based on input
2. **Reflector**: Evaluates response and provides critique
3. **Reviser**: Improves response based on critique
4. **Loop**: Repeat steps 2-3 until quality criteria met or max iterations reached
5. **Finisher**: Finalizes the output

## State Management

### ReflectionState

The state tracks the entire reflection process:

```typescript
interface ReflectionStateType {
  // Input
  input: string;                    // Original request
  
  // Output
  response: string;                 // Current/final response
  
  // Reflection tracking
  reflections: Reflection[];        // All critiques
  revisions: Revision[];            // All revisions
  
  // Control flow
  iteration: number;                // Current iteration
  maxIterations: number;            // Maximum iterations
  status: ReflectionStatus;         // Current status
  
  // Quality criteria
  qualityCriteria?: QualityCriteria;
  
  // Error handling
  error?: string;
}
```

### Reflection Schema

Each reflection contains:

```typescript
interface Reflection {
  critique: string;                 // Overall critique
  score: number;                    // Quality score (0-10)
  meetsStandards: boolean;          // Meets quality criteria?
  issues: string[];                 // Identified issues
  suggestions: string[];            // Improvement suggestions
  timestamp: string;                // When created
}
```

### Revision Schema

Each revision contains:

```typescript
interface Revision {
  content: string;                  // Revised content
  basedOn: Reflection;              // Which reflection it addresses
  changes: string[];                // What changed
  timestamp: string;                // When created
}
```

## Usage

### Quick Start

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { createReflectionAgent } from '@agentforge/patterns';

const llm = new ChatOpenAI({ modelName: 'gpt-4' });

const agent = createReflectionAgent({
  generator: { llm },
  reflector: { llm },
  reviser: { llm },
  maxIterations: 3,
});

const result = await agent.invoke({
  input: 'Write a brief explanation of quantum computing',
  qualityCriteria: {
    minScore: 8,
    criteria: ['Clear', 'Accurate', 'Concise'],
  },
});

console.log(result.response);
```

### Custom System Prompts

Tailor the agent to your specific use case:

```typescript
const agent = createReflectionAgent({
  generator: {
    llm,
    systemPrompt: `You are an expert technical writer. 
    Create clear, accurate documentation.`,
  },
  reflector: {
    llm,
    systemPrompt: `You are a senior technical reviewer.
    Evaluate documentation for clarity, accuracy, and completeness.`,
  },
  reviser: {
    llm,
    systemPrompt: `You are a documentation editor.
    Improve docs based on review feedback.`,
  },
  maxIterations: 4,
  verbose: true,
});
```

### Quality Criteria

Define what makes a good response:

```typescript
const result = await agent.invoke({
  input: 'Write a product description',
  qualityCriteria: {
    minScore: 9,                    // High quality threshold
    criteria: [
      'Engaging and persuasive',
      'Clear value proposition',
      'Addresses target audience',
      'Includes call-to-action',
    ],
    requireAll: true,               // All criteria must be met
  },
});
```

## Advanced Usage

### Custom Workflow

Build a custom workflow using individual nodes:

```typescript
import {
  ReflectionState,
  createGeneratorNode,
  createReflectorNode,
  createReviserNode,
  createFinisherNode,
} from '@agentforge/patterns';
import { StateGraph, END } from '@langchain/langgraph';

const workflow = new StateGraph(ReflectionState)
  .addNode('generator', createGeneratorNode({ llm }))
  .addNode('reflector', createReflectorNode({ llm }))
  .addNode('reviser', createReviserNode({ llm }))
  .addNode('finisher', createFinisherNode());

// Add custom routing logic
workflow
  .addEdge('__start__', 'generator')
  .addEdge('generator', 'reflector')
  .addConditionalEdges('reflector', customRouter)
  .addEdge('reviser', 'reflector')
  .addEdge('finisher', END);

const agent = workflow.compile();
```

### Custom Nodes

Add custom nodes to the workflow:

```typescript
const customValidatorNode = async (state) => {
  // Custom validation logic
  const isValid = await validateResponse(state.response);
  
  if (!isValid) {
    return { error: 'Validation failed' };
  }
  
  return {};
};

workflow.addNode('validator', customValidatorNode);
```

## Best Practices

### 1. System Prompt Design

**Generator Prompts**:
- Be specific about output format
- Include examples if needed
- Set tone and style expectations

**Reflector Prompts**:
- Define evaluation criteria clearly
- Request specific, actionable feedback
- Include scoring guidelines

**Reviser Prompts**:
- Emphasize addressing all feedback
- Maintain original intent
- Improve without over-revising

### 2. Quality Criteria

**Good Criteria**:
- ✅ Specific and measurable
- ✅ Relevant to the task
- ✅ Achievable within iterations

**Poor Criteria**:
- ❌ Vague ("good quality")
- ❌ Subjective without guidelines
- ❌ Too many criteria

### 3. Iteration Management

**Choose max iterations based on**:
- Task complexity
- Quality requirements
- Cost/time constraints
- Typical improvement rate

**Typical values**:
- Simple tasks: 2-3 iterations
- Complex tasks: 3-5 iterations
- Critical tasks: 5-7 iterations

### 4. Temperature Settings

**Generator**:
- Creative writing: 0.7-0.9
- Technical content: 0.3-0.5
- Code generation: 0.2-0.4

**Reflector**:
- Always use: 0.3-0.5 (consistent evaluation)

**Reviser**:
- Match generator temperature
- Slightly lower for precision

## Common Patterns

### Pattern 1: Essay Writing

```typescript
const essayAgent = createReflectionAgent({
  generator: {
    llm,
    systemPrompt: 'Expert essay writer with academic style',
  },
  reflector: {
    llm,
    systemPrompt: 'Academic reviewer checking thesis, arguments, evidence',
  },
  reviser: {
    llm,
    systemPrompt: 'Essay editor improving structure and clarity',
  },
  maxIterations: 4,
});
```

### Pattern 2: Code Generation

```typescript
const codeAgent = createReflectionAgent({
  generator: {
    model: new ChatOpenAI({ temperature: 0.3 }),
    systemPrompt: 'Expert software engineer writing production code',
  },
  reflector: {
    model: new ChatOpenAI({ temperature: 0.3 }),
    systemPrompt: 'Senior code reviewer checking quality, security, performance',
  },
  reviser: {
    model: new ChatOpenAI({ temperature: 0.3 }),
    systemPrompt: 'Code refactorer improving based on review',
  },
  maxIterations: 3,
});
```

### Pattern 3: Content Marketing

```typescript
const marketingAgent = createReflectionAgent({
  generator: {
    llm,
    systemPrompt: 'Creative copywriter for marketing content',
  },
  reflector: {
    llm,
    systemPrompt: 'Marketing strategist evaluating persuasiveness and clarity',
  },
  reviser: {
    llm,
    systemPrompt: 'Content editor enhancing engagement and conversion',
  },
  maxIterations: 3,
});
```

## Monitoring and Debugging

### Enable Verbose Mode

```typescript
const agent = createReflectionAgent({
  generator: { llm, verbose: true },
  reflector: { llm, verbose: true },
  reviser: { llm, verbose: true },
  verbose: true,
});
```

### Track Progress

```typescript
const result = await agent.invoke({ input });

console.log(`Iterations: ${result.iteration}`);
console.log(`Status: ${result.status}`);

// View quality progression
result.reflections.forEach((r, i) => {
  console.log(`Iteration ${i + 1}: Score ${r.score}/10`);
});
```

### Analyze Reflections

```typescript
// Get all issues identified
const allIssues = result.reflections.flatMap(r => r.issues);

// Get all suggestions
const allSuggestions = result.reflections.flatMap(r => r.suggestions);

// Check if quality improved
const scores = result.reflections.map(r => r.score);
const improved = scores[scores.length - 1] > scores[0];
```

## Error Handling

### Handle Failures

```typescript
const result = await agent.invoke({ input });

if (result.status === 'failed') {
  console.error('Agent failed:', result.error);
  // Handle failure
}

if (result.status === 'max_iterations') {
  console.warn('Max iterations reached without meeting criteria');
  // Decide whether to accept result or retry
}
```

### Retry Logic

```typescript
async function invokeWithRetry(agent, input, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const result = await agent.invoke({ input });

    if (result.status === 'completed') {
      return result;
    }

    console.log(`Attempt ${i + 1} failed, retrying...`);
  }

  throw new Error('Max retries exceeded');
}
```

## Performance Optimization

### 1. Reduce Iterations

```typescript
// Start with fewer iterations
maxIterations: 2

// Increase only if needed
```

### 2. Use Smaller Models

```typescript
// Use GPT-3.5 for initial iterations
const cheapLLM = new ChatOpenAI({ modelName: 'gpt-3.5-turbo' });

// Use GPT-4 only for final reflection
const expensiveLLM = new ChatOpenAI({ modelName: 'gpt-4' });
```

### 3. Parallel Processing

```typescript
// Process multiple inputs in parallel
const results = await Promise.all(
  inputs.map(input => agent.invoke({ input }))
);
```

### 4. Caching

```typescript
// Cache LLM responses
const llm = new ChatOpenAI({
  cache: true,
  modelName: 'gpt-4',
});
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { createReflectionAgent } from '@agentforge/patterns';

describe('ReflectionAgent', () => {
  it('should improve response quality', async () => {
    const agent = createReflectionAgent({ /* config */ });

    const result = await agent.invoke({
      input: 'Test input',
      qualityCriteria: { minScore: 8 },
    });

    expect(result.status).toBe('completed');
    expect(result.reflections.length).toBeGreaterThan(0);

    const finalScore = result.reflections[result.reflections.length - 1].score;
    expect(finalScore).toBeGreaterThanOrEqual(8);
  });
});
```

### Integration Tests

```typescript
it('should handle complex workflows', async () => {
  const agent = createReflectionAgent({ /* config */ });

  const result = await agent.invoke({
    input: 'Complex task',
    qualityCriteria: {
      minScore: 9,
      criteria: ['Criterion 1', 'Criterion 2'],
      requireAll: true,
    },
  });

  expect(result.status).toBe('completed');
  expect(result.reflections.every(r => r.meetsStandards)).toBe(true);
});
```

## API Reference

### createReflectionAgent(config)

Creates a complete reflection agent.

**Parameters**:
- `config.generator`: Generator node configuration
- `config.reflector`: Reflector node configuration
- `config.reviser`: Reviser node configuration
- `config.maxIterations`: Maximum iterations (default: 3)
- `config.verbose`: Enable logging (default: false)

**Returns**: Compiled LangGraph agent

### createGeneratorNode(config)

Creates a generator node.

**Parameters**:
- `config.llm`: LLM instance
- `config.systemPrompt`: System prompt (optional)
- `config.verbose`: Enable logging (default: false)

**Returns**: Generator node function

### createReflectorNode(config)

Creates a reflector node.

**Parameters**:
- `config.llm`: LLM instance
- `config.systemPrompt`: System prompt (optional)
- `config.verbose`: Enable logging (default: false)

**Returns**: Reflector node function

### createReviserNode(config)

Creates a reviser node.

**Parameters**:
- `config.llm`: LLM instance
- `config.systemPrompt`: System prompt (optional)
- `config.verbose`: Enable logging (default: false)

**Returns**: Reviser node function

### createFinisherNode()

Creates a finisher node.

**Returns**: Finisher node function

## Examples

See the [examples directory](../examples/reflection/) for complete, runnable examples:

- **01-basic-reflection.ts**: Basic usage
- **02-essay-writing.ts**: Essay writing with quality criteria
- **03-code-generation.ts**: Code generation with review
- **04-custom-workflow.ts**: Custom workflow with additional nodes

## Troubleshooting

### Issue: Agent doesn't improve

**Possible causes**:
- Reflector not providing actionable feedback
- Reviser not addressing feedback
- Quality criteria too vague

**Solutions**:
- Improve reflector system prompt
- Add specific evaluation criteria
- Review reflection output for quality

### Issue: Too many iterations

**Possible causes**:
- Quality criteria too strict
- Reflector too critical
- Reviser making minimal changes

**Solutions**:
- Adjust quality threshold
- Refine system prompts
- Review iteration history

### Issue: Inconsistent quality

**Possible causes**:
- High temperature settings
- Vague system prompts
- Unclear quality criteria

**Solutions**:
- Lower temperature (0.3-0.5)
- Make prompts more specific
- Define measurable criteria

## Learn More

- [Examples](../examples/reflection/)
- [Tests](../tests/reflection/)
- [Source Code](../src/reflection/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraphjs/)

## Contributing

Contributions welcome! Please:
1. Add tests for new features
2. Update documentation
3. Follow existing code style
4. Add examples for new patterns
