# Plan-Execute Agent Example

A Plan-Execute agent that creates a plan first, then executes each step systematically.

## Overview

The Plan-Execute pattern:
1. **Plan** - Create a detailed plan to solve the task
2. **Execute** - Execute each step sequentially
3. **Verify** - Check if the goal is achieved
4. **Replan** - Adjust plan if needed

## Complete Example

```typescript
import { createPlanExecuteAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import {
  webScraper,
  fileWriter,
  jsonParser
} from '@agentforge/tools';

const model = new ChatOpenAI({ model: 'gpt-4' });

const agent = createPlanExecuteAgent({
  planner: {
    model,
    systemPrompt: `Create a detailed step-by-step plan to accomplish the task.
Each step should be clear and actionable.
Consider dependencies between steps.`,
    maxSteps: 10
  },

  executor: {
    tools: [webScraper, fileWriter, jsonParser],
    model,
    parallel: false,  // Execute steps sequentially
    stepTimeout: 60000  // 60 second timeout per step
  },

  maxIterations: 3  // Allow up to 3 replanning cycles
});

// Use the agent
const result = await agent.invoke({
  input: 'Research the top 5 AI frameworks and create a comparison report'
});

console.log('Final Report:', result.response);
console.log('Completed Steps:', result.pastSteps?.length);
```

## Output Example

```
📋 Plan Created:
1. Search for top AI frameworks
2. Gather information about each framework
3. Compare features, pros, and cons
4. Create structured comparison
5. Write report to file

⚙️ Executing Step 1: Search for top AI frameworks
✅ Found: TensorFlow, PyTorch, LangChain, Hugging Face, JAX

⚙️ Executing Step 2: Gather information about each framework
✅ Collected detailed information

⚙️ Executing Step 3: Compare features
✅ Comparison complete

⚙️ Executing Step 4: Create structured comparison
✅ JSON structure created

⚙️ Executing Step 5: Write report
✅ Report saved to ai-frameworks-comparison.md

📄 Final Report: Successfully created comparison report...
```

## When to Use Plan-Execute

Best for:
- Research tasks
- Multi-step workflows
- Report generation
- Data analysis
- Complex problem-solving

## Key Features

- ✅ **Structured Planning** - Clear step-by-step approach
- ✅ **Sequential Execution** - One step at a time
- ✅ **Progress Tracking** - Monitor execution
- ✅ **Replanning** - Adjust if needed
- ✅ **Verification** - Check goal achievement

## Next Steps

- [Reflection Pattern](/examples/reflection) - Add self-improvement
- [Multi-Agent System](/examples/multi-agent) - Coordinate multiple agents

