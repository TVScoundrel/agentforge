# Reflection Pattern

The **Reflection** pattern enables agents to critique and improve their own outputs through self-reflection. The agent generates an initial response, reflects on its quality, and iteratively refines it until it meets quality standards.

## Overview

Reflection agents follow an iterative improvement loop:

1. **Generate** - Create an initial response
2. **Reflect** - Critique the response for quality, accuracy, completeness
3. **Revise** - Improve the response based on the critique
4. **Repeat** - Continue until quality threshold is met or max iterations reached

This pattern is inspired by the [Reflexion paper](https://arxiv.org/abs/2303.11366) from Northeastern University and MIT.

## When to Use Reflection

✅ **Good for:**
- Content generation (writing, code, reports)
- Tasks requiring high quality output
- When accuracy and completeness are critical
- Creative tasks that benefit from iteration
- Self-improving systems

❌ **Not ideal for:**
- Simple lookup or calculation tasks (use [ReAct](/guide/patterns/react) instead)
- Real-time applications (adds latency) (use [ReAct](/guide/patterns/react) instead)
- When first-draft quality is sufficient (use [ReAct](/guide/patterns/react) or [Plan-Execute](/guide/patterns/plan-execute) instead)
- Tasks with objective, verifiable answers (use [ReAct](/guide/patterns/react) instead)

::: tip Pattern Comparison
Not sure which pattern to use? See the [Agent Patterns Overview](/guide/concepts/patterns) for a detailed comparison of all patterns.
:::

## Basic Usage

```typescript
import { createReflectionAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({ model: 'gpt-4' });

const agent = createReflectionAgent({
  generator: {
    model,
    systemPrompt: 'You are an expert technical writer. Create clear, comprehensive content.'
  },

  reflector: {
    model,
    systemPrompt: `Review the response and provide constructive criticism:

- Is it accurate and complete?
- Is it well-structured and clear?
- Are there any errors or omissions?
- How can it be improved?`,
    qualityCriteria: {
      accuracy: 0.8,
      completeness: 0.8,
      clarity: 0.8
    }
  },

  reviser: {
    model,
    systemPrompt: 'Improve the content based on the reflection feedback. Address all identified issues.'
  },

  maxIterations: 3
});

const result = await agent.invoke({
  input: 'Write a comprehensive guide to TypeScript generics'
});

console.log('Final response:', result.response);
console.log('Reflections:', result.reflections?.length);
console.log('Revisions:', result.revisions?.length);
console.log('Status:', result.status);
```

## Configuration Options

### Core Options

```typescript
interface ReflectionAgentConfig {
  // Required
  generator: GeneratorConfig;   // Initial response generator
  reflector: ReflectorConfig;   // Response critic
  reviser: ReviserConfig;       // Response improver

  // Optional
  maxIterations?: number;       // Max reflection cycles (default: 3)
  qualityCriteria?: QualityCriteria;  // Quality thresholds
  verbose?: boolean;            // Enable detailed logging
  checkpointer?: BaseCheckpointSaver;  // For human-in-the-loop
}

interface GeneratorConfig {
  model: BaseChatModel;         // The language model
  systemPrompt?: string;        // Custom system prompt
  verbose?: boolean;            // Enable logging
}

interface ReflectorConfig {
  model: BaseChatModel;         // The language model
  systemPrompt?: string;        // Custom reflection prompt
  qualityCriteria?: QualityCriteria;  // Quality criteria
  verbose?: boolean;            // Enable logging
}

interface ReviserConfig {
  model: BaseChatModel;         // The language model
  systemPrompt?: string;        // Custom revision prompt
  verbose?: boolean;            // Enable logging
}

interface QualityCriteria {
  accuracy?: number;            // Accuracy threshold (0-1)
  completeness?: number;        // Completeness threshold (0-1)
  clarity?: number;             // Clarity threshold (0-1)
  [key: string]: number | undefined;  // Custom criteria
}
```

### Advanced Configuration

```typescript
const model = new ChatOpenAI({ model: 'gpt-4', temperature: 0.7 });

const agent = createReflectionAgent({
  generator: {
    model,
    systemPrompt: 'You are an expert technical writer. Create comprehensive, accurate content.',
    verbose: true
  },

  reflector: {
    model,
    systemPrompt: `Critically evaluate this response:

1. Accuracy: Are all facts correct?
2. Completeness: Is anything missing?
3. Clarity: Is it easy to understand?
4. Structure: Is it well-organized?
5. Quality: Rate 0-1, where 1 is perfect

Provide specific suggestions for improvement.`,
    qualityCriteria: {
      accuracy: 0.9,
      completeness: 0.9,
      clarity: 0.9,
      structure: 0.9
    },
    verbose: true
  },

  reviser: {
    model,
    systemPrompt: `Improve the response based on the reflection feedback.
Create a better version that addresses all concerns.`,
    verbose: true
  },

  // Iteration control
  maxIterations: 5,
  verbose: true
});
```

## How It Works

### 1. Initial Generation

```typescript
// Agent generates first draft
const draft = await llm.invoke([
  { role: 'user', content: userMessage }
]);
```

### 2. Reflection

```typescript
// Agent critiques its own output
const reflection = await llm.invoke([
  { role: 'user', content: draft },
  { role: 'system', content: reflectionPrompt }
]);

// Example reflection:
{
  quality: 0.7,
  issues: [
    "Missing examples for advanced concepts",
    "Could explain type inference more clearly",
    "No mention of common pitfalls"
  ],
  suggestions: [
    "Add code examples for each concept",
    "Include a section on type inference",
    "Add a 'Common Mistakes' section"
  ]
}
```

### 3. Revision

```typescript
// Agent improves based on reflection
const revised = await llm.invoke([
  { role: 'user', content: userMessage },
  { role: 'assistant', content: draft },
  { role: 'user', content: `Reflection: ${reflection}` },
  { role: 'system', content: revisionPrompt }
]);
```

### 4. Iteration

```typescript
while (quality < threshold && iterations < maxIterations) {
  draft = revised;
  reflection = await reflect(draft);
  revised = await revise(draft, reflection);
  iterations++;
}
```

## Customization

### Custom Quality Criteria

```typescript
const generatorModel = new ChatOpenAI({ model: 'gpt-4' });
const reflectorModel = new ChatOpenAI({ model: 'gpt-4' });

const agent = createReflectionAgent({
  generator: {
    model: generatorModel,
    systemPrompt: 'Create high-quality content'
  },
  reflector: {
    model: reflectorModel,
    systemPrompt: 'Evaluate content quality across multiple dimensions',
    qualityCriteria: {
      accuracy: 0.9,
      completeness: 0.8,
      clarity: 0.85,
      style: 0.7
    }
  },
  reviser: {
    model: generatorModel,
    systemPrompt: 'Improve content based on feedback'
  },
  maxIterations: 3
});
```

### Separate Reflection Model

Use a different model for reflection:

```typescript
const generatorModel = new ChatOpenAI({ model: 'gpt-4', temperature: 0.7 });
const reflectorModel = new ChatOpenAI({ model: 'gpt-4', temperature: 0 });  // More critical/consistent

const agent = createReflectionAgent({
  generator: {
    model: generatorModel,  // For generation
    systemPrompt: 'Create comprehensive content'
  },
  reflector: {
    model: reflectorModel,  // For critique
    systemPrompt: 'Provide detailed, critical feedback'
  },
  reviser: {
    model: generatorModel,  // For revision
    systemPrompt: 'Improve based on feedback'
  }
});
```

### Domain-Specific Reflection

```typescript
// Code review reflection
const codeReflectionAgent = createReflectionAgent({
  generator: {
    model,
    systemPrompt: 'Generate clean, efficient code'
  },
  reflector: {
    model,
    systemPrompt: `Review this code:

1. Correctness: Does it work as intended?
2. Performance: Are there efficiency issues?
3. Security: Any vulnerabilities?
4. Maintainability: Is it clean and readable?
5. Best Practices: Does it follow conventions?

Provide specific improvements.`,
    qualityCriteria: {
      correctness: 0.95,
      performance: 0.8,
      security: 0.9,
      maintainability: 0.85
    }
  },
  reviser: {
    model,
    systemPrompt: 'Improve code based on review feedback'
  }
});

// Writing reflection
const writingReflectionAgent = createReflectionAgent({
  generator: {
    model,
    systemPrompt: 'Write engaging, clear content'
  },
  reflector: {
    model,
    systemPrompt: `Critique this writing:

1. Grammar and spelling
2. Tone and voice
3. Structure and flow
4. Clarity and conciseness
5. Engagement and impact

Suggest specific edits.`,
    qualityCriteria: {
      grammar: 0.95,
      clarity: 0.9,
      engagement: 0.8
    }
  },
  reviser: {
    model,
    systemPrompt: 'Revise writing based on critique'
  }
});
```

## Streaming

Monitor the reflection process in real-time:

```typescript
const stream = await agent.stream({
  input: 'Write a blog post about AI safety'
});

for await (const chunk of stream) {
  // Stream chunks are partial state updates
  if (chunk.currentResponse) {
    console.log('Current draft:', chunk.currentResponse);
  }
  if (chunk.reflections && chunk.reflections.length > 0) {
    const latest = chunk.reflections[chunk.reflections.length - 1];
    console.log('Latest reflection:', latest);
  }
  if (chunk.status) {
    console.log('Status:', chunk.status);
  }
  if (chunk.response) {
    console.log('Final response:', chunk.response);
  }
}
```

## Best Practices

### 1. Set Reasonable Iteration Limits

```typescript
const agent = createReflectionAgent({
  generator: { model },
  reflector: {
    model,
    qualityCriteria: {
      quality: 0.85  // Stop early if quality is good enough
    }
  },
  reviser: { model },
  maxIterations: 3  // Usually 2-4 iterations is optimal
});
```

### 2. Use Specific Reflection Criteria

```typescript
const agent = createReflectionAgent({
  generator: {
    model,
    systemPrompt: 'Generate technical content'
  },
  reflector: {
    model,
    systemPrompt: `Evaluate on these specific criteria:

1. Technical Accuracy (0-1)
2. Completeness (0-1)
3. Code Quality (0-1)

Overall Quality: (average of above)
Specific Issues: [list]
Improvement Suggestions: [list]`,
    qualityCriteria: {
      technicalAccuracy: 0.9,
      completeness: 0.85,
      codeQuality: 0.8
    }
  },
  reviser: {
    model,
    systemPrompt: 'Improve based on specific feedback'
  }
});
```

### 3. Balance Quality vs. Cost

```typescript
// Use cheaper model for drafts, expensive for final
const draftModel = new ChatOpenAI({ model: 'gpt-3.5-turbo' });
const critiqueModel = new ChatOpenAI({ model: 'gpt-4' });

const agent = createReflectionAgent({
  generator: {
    model: draftModel,  // Fast drafts
    systemPrompt: 'Create initial draft'
  },
  reflector: {
    model: critiqueModel,  // Quality critique
    systemPrompt: 'Provide detailed critique'
  },
  reviser: {
    model: draftModel,  // Fast revisions
    systemPrompt: 'Improve based on feedback'
  },
  maxIterations: 2  // Limit iterations to control cost
});
```

### 4. Track Improvement Over Iterations

```typescript
const result = await agent.invoke({
  input: 'Your task here'
});

// Access reflections directly from result
result.reflections?.forEach((reflection, i) => {
  console.log(`Iteration ${i + 1}:`, reflection);
});

console.log('Final response:', result.response);
console.log('Total iterations:', result.iteration);
console.log('Status:', result.status);
```

## Common Patterns

### Content Generation

```typescript
const model = new ChatOpenAI({ model: 'gpt-4' });

const contentAgent = createReflectionAgent({
  generator: {
    model,
    systemPrompt: 'Create engaging, well-written content'
  },
  reflector: {
    model,
    systemPrompt: `Review this content:

1. Is it engaging and well-written?
2. Is the information accurate?
3. Is it appropriate for the target audience?
4. Are there grammar or style issues?
5. How can it be improved?

Provide specific feedback.`,
    qualityCriteria: {
      engagement: 0.8,
      accuracy: 0.9,
      grammar: 0.95
    }
  },
  reviser: {
    model,
    systemPrompt: 'Improve content based on feedback'
  },
  maxIterations: 3
});
```

### Code Generation

```typescript
const model = new ChatOpenAI({ model: 'gpt-4' });

const codeAgent = createReflectionAgent({
  generator: {
    model,
    systemPrompt: 'Generate clean, efficient code'
  },
  reflector: {
    model,
    systemPrompt: `Review this code:

1. Correctness: Does it solve the problem?
2. Efficiency: Is it performant?
3. Readability: Is it clean and clear?
4. Best Practices: Does it follow conventions?
5. Edge Cases: Are they handled?

Provide specific feedback on bugs and improvements.`,
    qualityCriteria: {
      correctness: 0.95,
      efficiency: 0.8,
      readability: 0.85,
      bestPractices: 0.9
    }
  },
  reviser: {
    model,
    systemPrompt: 'Fix issues and improve the code based on feedback. Provide complete, improved code.'
  },
  maxIterations: 4
});
```

### Research & Analysis

```typescript
const model = new ChatOpenAI({ model: 'gpt-4' });

const researchAgent = createReflectionAgent({
  generator: {
    model,
    systemPrompt: 'Conduct thorough research and analysis'
  },
  reflector: {
    model,
    systemPrompt: `Evaluate this research:

1. Accuracy: Are facts correct and cited?
2. Completeness: Is anything missing?
3. Balance: Are multiple perspectives considered?
4. Clarity: Is it well-organized?
5. Depth: Is the analysis thorough?

Identify gaps and suggest improvements.`,
    qualityCriteria: {
      accuracy: 0.95,
      completeness: 0.85,
      balance: 0.8,
      depth: 0.85
    }
  },
  reviser: {
    model,
    systemPrompt: 'Improve research based on feedback'
  },
  maxIterations: 3
});
```

## Debugging

### Inspect Reflection History

```typescript
const result = await agent.invoke({
  input: 'Your task here'
});

console.log('Reflection History:');
result.reflections?.forEach((reflection, i) => {
  console.log(`\nIteration ${i + 1}:`, reflection);
});

console.log('Revisions:', result.revisions);
console.log('Final Response:', result.response);
console.log('Status:', result.status);
console.log('Total Iterations:', result.iteration);
```

### Track Quality Improvement

```typescript
const result = await agent.invoke({
  input: 'Your task here'
});

// Analyze improvement over iterations
console.log('Reflection count:', result.reflections?.length);
console.log('Revision count:', result.revisions?.length);
console.log('Final status:', result.status);

// Access individual reflections and revisions
result.reflections?.forEach((reflection, i) => {
  console.log(`Reflection ${i + 1}:`, reflection);
});

result.revisions?.forEach((revision, i) => {
  console.log(`Revision ${i + 1}:`, revision);
});
```

### Compare Iterations

```typescript
const result = await agent.invoke({
  input: 'Your task here'
});

// Compare revisions over iterations
if (result.revisions && result.revisions.length > 1) {
  for (let i = 1; i < result.revisions.length; i++) {
    console.log(`\nRevision ${i}:`, result.revisions[i]);
  }
}

console.log('\nFinal response:', result.response);
```

## Performance Optimization

### 1. Limit Iterations

```typescript
const agent = createReflectionAgent({
  generator: { model },
  reflector: {
    model,
    qualityCriteria: {
      quality: 0.9  // Target quality threshold
    }
  },
  reviser: { model },
  maxIterations: 3  // Limit to control cost and latency
});
```

### 2. Use Quality Criteria

Set specific quality thresholds to guide the reflection process:

```typescript
const agent = createReflectionAgent({
  generator: { model },
  reflector: {
    model,
    systemPrompt: 'Evaluate content across multiple dimensions',
    qualityCriteria: {
      accuracy: 0.9,
      completeness: 0.85,
      clarity: 0.8,
      style: 0.75
    }
  },
  reviser: { model },
  maxIterations: 5
});
```

### 3. Use Verbose Mode for Debugging

Enable verbose logging to understand the reflection process:

```typescript
const agent = createReflectionAgent({
  generator: {
    model,
    systemPrompt: 'Generate content',
    verbose: true  // Enable logging
  },
  reflector: {
    model,
    systemPrompt: 'Critique content',
    verbose: true
  },
  reviser: {
    model,
    systemPrompt: 'Improve content',
    verbose: true
  },
  verbose: true  // Enable overall logging
});
```

## Comparison with Other Patterns

| Feature | Reflection | ReAct | Plan-Execute |
|---------|-----------|-------|--------------|
| Iteration | Self-improvement | Tool usage | Plan execution |
| Quality | High (iterative refinement) | Medium | Medium-High |
| Speed | Slower (multiple iterations) | Fast | Medium |
| Best for | Content/code generation | General tasks | Complex workflows |
| Token usage | High | Low-Medium | Medium-High |

## Advanced: Multi-Agent Reflection

Combine with multi-agent for peer review:

```typescript
import { createMultiAgentSystem, createReflectionAgent } from '@agentforge/patterns';

const writerAgent = createReflectionAgent({
  generator: { model, systemPrompt: 'Create content' },
  reflector: { model, systemPrompt: 'Self-critique' },
  reviser: { model, systemPrompt: 'Self-improve' }
});

const reviewerAgent = createReflectionAgent({
  generator: { model, systemPrompt: 'Review content critically' },
  reflector: { model, systemPrompt: 'Evaluate review quality' },
  reviser: { model, systemPrompt: 'Improve review' }
});

const system = createMultiAgentSystem({
  supervisor: {
    strategy: 'supervisor',
    model,
    systemPrompt: 'Coordinate writing and review process'
  },
  workers: [
    {
      id: 'writer',
      capabilities: {
        skills: ['writing', 'content-creation'],
        tools: [],
        available: true,
        currentWorkload: 0
      },
      agent: writerAgent
    },
    {
      id: 'reviewer',
      capabilities: {
        skills: ['reviewing', 'critique'],
        tools: [],
        available: true,
        currentWorkload: 0
      },
      agent: reviewerAgent
    }
  ],
  aggregator: {
    model,
    systemPrompt: 'Combine writer and reviewer outputs'
  }
});
```

## Next Steps

- [ReAct Pattern](/guide/patterns/react) - For tool-using agents
- [Plan-Execute Pattern](/guide/patterns/plan-execute) - For structured workflows
- [Multi-Agent Pattern](/guide/patterns/multi-agent) - For collaborative reflection
- [API Reference](/api/patterns#reflection) - Complete API documentation

## Further Reading

- [Reflexion Paper](https://arxiv.org/abs/2303.11366) - Original research
- [Self-Refine Paper](https://arxiv.org/abs/2303.17651) - Related work
- [Examples](/examples/reflection) - Working code examples


