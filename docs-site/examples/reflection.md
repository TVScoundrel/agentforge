# Reflection Agent Example

A Reflection agent that critiques and improves its own outputs through self-reflection.

## Overview

The Reflection pattern:
1. **Generate** - Create initial response
2. **Reflect** - Critique the response
3. **Improve** - Generate improved version
4. **Repeat** - Continue until quality threshold met

## Complete Example

```typescript
import { createReflectionAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({ model: 'gpt-4' });

const agent = createReflectionAgent({
  generator: {
    model,
    systemPrompt: 'You are an expert content writer. Create high-quality, comprehensive content.',
    verbose: true
  },

  reflector: {
    model,
    systemPrompt: `Critique the previous response:
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

  maxIterations: 3,  // Maximum reflection cycles
  verbose: true
});

// Use the agent
const result = await agent.invoke({
  input: 'Write a comprehensive blog post about the future of AI'
});

console.log('Final Output:', result.response);
console.log('Reflections:', result.reflections?.length);
console.log('Revisions:', result.revisions?.length);
```

## Output Example

```
📝 Initial Draft:
AI is transforming industries...

🤔 Reflection 1:
The draft is too generic. It needs:
- Specific examples
- Recent developments
- Expert opinions
- Future predictions

✍️ Improved Version 1:
AI is transforming industries with recent breakthroughs like GPT-4...

🤔 Reflection 2:
Better, but still needs:
- More concrete data
- Balanced perspective
- Actionable insights

✍️ Final Version:
[Comprehensive, well-researched blog post with examples, data, and insights]

✅ Quality threshold met (0.85)
```

## When to Use Reflection

Best for:
- Content creation
- Code generation
- Report writing
- Quality-critical tasks
- Creative work

## Key Features

- ✅ **Self-Critique** - Identify weaknesses
- ✅ **Iterative Improvement** - Multiple refinement cycles
- ✅ **Quality Control** - Meet quality thresholds
- ✅ **Learning** - Improve over iterations

## Next Steps

- [Multi-Agent System](/examples/multi-agent) - Combine with other patterns

