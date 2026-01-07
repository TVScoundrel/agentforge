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

const agent = createReflectionAgent({
  llm: new ChatOpenAI({ model: 'gpt-4' }),
  maxIterations: 3,
  reflectionPrompt: `Review the response and provide constructive criticism:
  
- Is it accurate and complete?
- Is it well-structured and clear?
- Are there any errors or omissions?
- How can it be improved?`
});

const result = await agent.invoke({
  messages: [{
    role: 'user',
    content: 'Write a comprehensive guide to TypeScript generics'
  }]
});

console.log('Final response:', result.messages[result.messages.length - 1].content);
console.log('Iterations:', result.iterations);
```

## Configuration Options

### Core Options

```typescript
interface ReflectionConfig {
  // Required
  llm: BaseChatModel;           // The language model
  
  // Optional
  maxIterations?: number;       // Max reflection cycles (default: 3)
  reflectionPrompt?: string;    // Custom reflection prompt
  revisionPrompt?: string;      // Custom revision prompt
  qualityThreshold?: number;    // Stop when quality score >= threshold
  returnReflections?: boolean;  // Include reflection history
}
```

### Advanced Configuration

```typescript
const agent = createReflectionAgent({
  llm: new ChatOpenAI({ model: 'gpt-4', temperature: 0.7 }),
  
  // Iteration control
  maxIterations: 5,
  qualityThreshold: 0.9,  // Stop when 90% quality achieved
  
  // Custom prompts
  reflectionPrompt: `Critically evaluate this response:
  
1. Accuracy: Are all facts correct?
2. Completeness: Is anything missing?
3. Clarity: Is it easy to understand?
4. Structure: Is it well-organized?
5. Quality: Rate 0-1, where 1 is perfect

Provide specific suggestions for improvement.`,
  
  revisionPrompt: `Improve the response based on this feedback:
{reflection}

Create a better version that addresses all concerns.`,
  
  // Return full reflection history
  returnReflections: true
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

### Custom Quality Metrics

```typescript
const agent = createReflectionAgent({
  llm,
  qualityMetrics: {
    accuracy: { weight: 0.4, threshold: 0.9 },
    completeness: { weight: 0.3, threshold: 0.8 },
    clarity: { weight: 0.2, threshold: 0.85 },
    style: { weight: 0.1, threshold: 0.7 }
  },
  qualityThreshold: 0.85  // Weighted average
});
```

### Separate Reflection Model

Use a different model for reflection:

```typescript
const agent = createReflectionAgent({
  llm: new ChatOpenAI({ model: 'gpt-4' }),  // For generation
  reflectionLLM: new ChatOpenAI({ 
    model: 'gpt-4',  // For critique
    temperature: 0  // More critical/consistent
  })
});
```

### Domain-Specific Reflection

```typescript
// Code review reflection
const codeReflectionAgent = createReflectionAgent({
  llm,
  reflectionPrompt: `Review this code:
  
1. Correctness: Does it work as intended?
2. Performance: Are there efficiency issues?
3. Security: Any vulnerabilities?
4. Maintainability: Is it clean and readable?
5. Best Practices: Does it follow conventions?

Provide specific improvements.`
});

// Writing reflection
const writingReflectionAgent = createReflectionAgent({
  llm,
  reflectionPrompt: `Critique this writing:
  
1. Grammar and spelling
2. Tone and voice
3. Structure and flow
4. Clarity and conciseness
5. Engagement and impact

Suggest specific edits.`
});
```

## Streaming

Monitor the reflection process in real-time:

```typescript
const stream = await agent.stream({
  messages: [{ role: 'user', content: 'Write a blog post about AI safety' }]
});

for await (const chunk of stream) {
  if (chunk.generation) {
    console.log('Draft:', chunk.generation.content);
  }
  if (chunk.reflection) {
    console.log('Reflection:', chunk.reflection.critique);
    console.log('Quality:', chunk.reflection.quality);
  }
  if (chunk.revision) {
    console.log('Revision:', chunk.revision.content);
  }
}
```

## Best Practices

### 1. Set Reasonable Iteration Limits

```typescript
const agent = createReflectionAgent({
  llm,
  maxIterations: 3,  // Usually 2-4 iterations is optimal
  qualityThreshold: 0.85  // Stop early if quality is good enough
});
```

### 2. Use Specific Reflection Criteria

```typescript
const agent = createReflectionAgent({
  llm,
  reflectionPrompt: `Evaluate on these specific criteria:

1. Technical Accuracy (0-1): ${criterion1}
2. Completeness (0-1): ${criterion2}
3. Code Quality (0-1): ${criterion3}

Overall Quality: (average of above)
Specific Issues: [list]
Improvement Suggestions: [list]`
});
```

### 3. Balance Quality vs. Cost

```typescript
// Use cheaper model for drafts, expensive for final
const agent = createReflectionAgent({
  llm: new ChatOpenAI({ model: 'gpt-3.5-turbo' }),  // Fast drafts
  reflectionLLM: new ChatOpenAI({ model: 'gpt-4' }),  // Quality critique
  maxIterations: 2  // Limit iterations to control cost
});
```

### 4. Track Improvement Over Iterations

```typescript
const result = await agent.invoke(input, {
  returnReflections: true
});

result.reflections.forEach((reflection, i) => {
  console.log(`Iteration ${i + 1}:`);
  console.log('Quality:', reflection.quality);
  console.log('Issues:', reflection.issues);
});
```

## Common Patterns

### Content Generation

```typescript
const contentAgent = createReflectionAgent({
  llm: new ChatOpenAI({ model: 'gpt-4' }),
  maxIterations: 3,
  reflectionPrompt: `Review this content:

1. Is it engaging and well-written?
2. Is the information accurate?
3. Is it appropriate for the target audience?
4. Are there grammar or style issues?
5. How can it be improved?

Quality score (0-1):
Issues:
Suggestions:`
});
```

### Code Generation

```typescript
const codeAgent = createReflectionAgent({
  llm: new ChatOpenAI({ model: 'gpt-4' }),
  maxIterations: 4,
  reflectionPrompt: `Review this code:

1. Correctness: Does it solve the problem?
2. Efficiency: Is it performant?
3. Readability: Is it clean and clear?
4. Best Practices: Does it follow conventions?
5. Edge Cases: Are they handled?

Quality score (0-1):
Bugs/Issues:
Improvements:`,

  revisionPrompt: `Fix the issues and improve the code:
{reflection}

Provide the complete, improved code.`
});
```

### Research & Analysis

```typescript
const researchAgent = createReflectionAgent({
  llm: new ChatOpenAI({ model: 'gpt-4' }),
  maxIterations: 3,
  reflectionPrompt: `Evaluate this research:

1. Accuracy: Are facts correct and cited?
2. Completeness: Is anything missing?
3. Balance: Are multiple perspectives considered?
4. Clarity: Is it well-organized?
5. Depth: Is the analysis thorough?

Quality score (0-1):
Gaps:
Improvements:`
});
```

## Debugging

### Inspect Reflection History

```typescript
const result = await agent.invoke(input, {
  returnReflections: true
});

console.log('Reflection History:');
result.reflections.forEach((reflection, i) => {
  console.log(`\nIteration ${i + 1}:`);
  console.log('Quality:', reflection.quality);
  console.log('Critique:', reflection.critique);
  console.log('Draft:', reflection.draft.substring(0, 200) + '...');
});

console.log('\nFinal Output:', result.finalOutput);
```

### Visualize Quality Improvement

```typescript
import { visualizeReflectionProgress } from '@agentforge/core';

const result = await agent.invoke(input, {
  returnReflections: true
});

// Generate chart showing quality over iterations
const chart = visualizeReflectionProgress(result);
console.log(chart);
```

### Compare Iterations

```typescript
const result = await agent.invoke(input, {
  returnReflections: true
});

// Show diff between iterations
for (let i = 1; i < result.reflections.length; i++) {
  const prev = result.reflections[i - 1].draft;
  const curr = result.reflections[i].draft;

  console.log(`\nChanges from iteration ${i} to ${i + 1}:`);
  console.log(generateDiff(prev, curr));
}
```

## Performance Optimization

### 1. Early Stopping

```typescript
const agent = createReflectionAgent({
  llm,
  qualityThreshold: 0.9,  // Stop when quality is good enough
  maxIterations: 5,  // But don't exceed this

  // Custom stopping condition
  shouldStop: (reflection, iteration) => {
    return reflection.quality >= 0.9 ||
           reflection.issues.length === 0 ||
           iteration >= 3;
  }
});
```

### 2. Parallel Reflection

Reflect on multiple aspects simultaneously:

```typescript
const agent = createReflectionAgent({
  llm,
  parallelReflection: true,
  reflectionAspects: [
    'accuracy',
    'completeness',
    'clarity',
    'style'
  ]
});
```

### 3. Incremental Revision

Only revise parts that need improvement:

```typescript
const agent = createReflectionAgent({
  llm,
  revisionStrategy: 'incremental',  // Only revise problematic sections
  minQualityForSection: 0.8  // Don't revise sections above this
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
import { createMultiAgentSystem } from '@agentforge/patterns';

const system = createMultiAgentSystem({
  agents: {
    writer: createReflectionAgent({
      llm,
      role: 'content creator'
    }),
    reviewer: createReflectionAgent({
      llm,
      role: 'critical reviewer'
    }),
    editor: createReflectionAgent({
      llm,
      role: 'final editor'
    })
  },
  workflow: 'sequential'  // writer -> reviewer -> editor
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


