# Advanced Patterns Tutorial

Learn how to combine agent patterns and create custom workflows for complex tasks.

## Overview

While individual patterns are powerful, combining them unlocks even more capabilities:

- **Pattern Composition** - Use multiple patterns together
- **Custom Workflows** - Build tailored agent workflows
- **Hybrid Approaches** - Mix pattern strengths
- **Advanced Techniques** - Optimize for complex scenarios

## Prerequisites

Before starting this tutorial, you should be familiar with:

- **[Your First Agent](/tutorials/first-agent)** - Basic agent creation
- **[Agent Patterns Overview](/guide/concepts/patterns)** - Understanding each pattern
- **[ReAct Pattern](/guide/patterns/react)** - ReAct details
- **[Plan-Execute Pattern](/guide/patterns/plan-execute)** - Plan-Execute details
- **[Reflection Pattern](/guide/patterns/reflection)** - Reflection details
- **[Multi-Agent Pattern](/guide/patterns/multi-agent)** - Multi-Agent details
- **[Custom Tools](/tutorials/custom-tools)** - Creating tools

## Pattern Combination Strategies

### Strategy 1: Plan-Execute + ReAct

Use Plan-Execute for overall structure, ReAct for complex steps.

**When to use:**
- Tasks need structured planning
- Some steps require exploratory reasoning
- Mix of predictable and unpredictable sub-tasks

**Example: Research and Analysis**

```typescript
import { createPlanExecuteAgent, createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { webSearch, webScraper, calculator } from '@agentforge/tools';
import { z } from 'zod';

const model = new ChatOpenAI({ model: 'gpt-4' });

// Create a ReAct agent for complex research
const researchAgent = createReActAgent({
  model,
  tools: [webSearch, webScraper, calculator],  // Real exports from @agentforge/tools
  maxIterations: 10
});

// Wrap ReAct agent as a tool
const complexResearchTool = toolBuilder()
  .name('complex-research')
  .description('Perform complex research using exploratory reasoning')
  .category(ToolCategory.WEB)  // Use WEB for search/research tools
  .schema(z.object({
    topic: z.string().describe('Research topic'),
    depth: z.enum(['shallow', 'deep']).describe('Research depth')
  }))
  .implement(async ({ topic, depth }) => {
    const result = await researchAgent.invoke({
      messages: [{ role: 'user', content: `Research: ${topic} (${depth})` }]
    });
    return result.response;
  })
  .build();

// Note: Define custom tools for summarization and reporting
// These are user-defined tools - replace with your own implementations
const customSummarizeTool = toolBuilder()
  .name('custom-summarize')
  .description('Summarize research findings')
  .category(ToolCategory.UTILITY)  // Use UTILITY for text processing tools
  .schema(z.object({ text: z.string() }))
  .implement(async ({ text }) => {
    // Your summarization logic here
    return `Summary of: ${text}`;
  })
  .build();

const customReportTool = toolBuilder()
  .name('custom-report')
  .description('Generate formatted report')
  .category(ToolCategory.UTILITY)  // Use UTILITY for text processing tools
  .schema(z.object({ content: z.string() }))
  .implement(async ({ content }) => {
    // Your report generation logic here
    return `Report: ${content}`;
  })
  .build();

// Use in Plan-Execute agent
const agent = createPlanExecuteAgent({
  planner: {
    model,
    maxSteps: 5,
    systemPrompt: 'Create a structured research and analysis plan'
  },
  executor: {
    tools: [
      complexResearchTool,  // Uses ReAct internally
      customSummarizeTool,  // Custom tool
      customReportTool      // Custom tool
    ],
    parallel: false
  }
});

// Execute
const result = await agent.invoke({
  input: 'Research AI trends and create a comprehensive report'
});
```

### Strategy 2: Reflection + Plan-Execute

Use Plan-Execute for execution, Reflection for quality improvement.

**When to use:**
- Quality is critical
- Output needs iterative refinement
- Multiple execution attempts acceptable

**Example: Content Creation Pipeline**

```typescript
import { createPlanExecuteAgent, createReflectionAgent } from '@agentforge/patterns';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { webSearch } from '@agentforge/tools';
import { z } from 'zod';

// Note: Define custom tools for content creation workflow
// These are user-defined tools - replace with your own implementations
const customResearchTool = toolBuilder()
  .name('custom-research')
  .description('Research topic')
  .category(ToolCategory.WEB)  // Use WEB for search/research tools
  .schema(z.object({ topic: z.string() }))
  .implement(async ({ topic }) => {
    // Your research logic here (could use webSearch internally)
    return `Research on: ${topic}`;
  })
  .build();

const customOutlineTool = toolBuilder()
  .name('custom-outline')
  .description('Create content outline')
  .category(ToolCategory.UTILITY)  // Use UTILITY for text processing tools
  .schema(z.object({ topic: z.string() }))
  .implement(async ({ topic }) => {
    // Your outline logic here
    return `Outline for: ${topic}`;
  })
  .build();

const customDraftTool = toolBuilder()
  .name('custom-draft')
  .description('Write content draft')
  .category(ToolCategory.UTILITY)  // Use UTILITY for text processing tools
  .schema(z.object({ outline: z.string() }))
  .implement(async ({ outline }) => {
    // Your drafting logic here
    return `Draft based on: ${outline}`;
  })
  .build();

const customFormatTool = toolBuilder()
  .name('custom-format')
  .description('Format content')
  .category(ToolCategory.UTILITY)  // Use UTILITY for text processing tools
  .schema(z.object({ content: z.string() }))
  .implement(async ({ content }) => {
    // Your formatting logic here
    return `Formatted: ${content}`;
  })
  .build();

// Step 1: Execute content creation plan
const executionAgent = createPlanExecuteAgent({
  planner: {
    model,
    maxSteps: 4,
    systemPrompt: 'Plan content creation: research, outline, draft, format'
  },
  executor: {
    tools: [customResearchTool, customOutlineTool, customDraftTool, customFormatTool]  // Custom tools
  }
});

// Step 2: Refine with reflection
const reflectionAgent = createReflectionAgent({
  generator: { model },
  reflector: {
    model,
    systemPrompt: 'Critique content for clarity, accuracy, and engagement'
  },
  reviser: { model },
  maxIterations: 3
});

// Combined workflow
async function createQualityContent(topic: string) {
  // Execute plan
  const draft = await executionAgent.invoke({
    input: `Create content about: ${topic}`
  });

  // Refine with reflection
  const refined = await reflectionAgent.invoke({
    input: draft.response || ''
  });

  return refined.response;
}

const content = await createQualityContent('AI in Healthcare');
```

### Strategy 3: Multi-Agent + Specialized Patterns

Use Multi-Agent for coordination, specialized patterns for workers.

**When to use:**
- Multiple specialized capabilities needed
- Tasks can be parallelized
- Different approaches for different sub-tasks

**Example: Software Development Team**

```typescript
import { createMultiAgentSystem, createReflectionAgent, createPlanExecuteAgent, createReActAgent } from '@agentforge/patterns';

// Create specialized worker agents
const codeReviewAgent = createReflectionAgent({
  generator: { model },
  reflector: {
    model,
    systemPrompt: 'Review code for bugs, style, and best practices'
  },
  reviser: {
    model,
    systemPrompt: 'Improve code based on review feedback'
  },
  maxIterations: 2
});

const testingAgent = createPlanExecuteAgent({
  planner: {
    model,
    systemPrompt: 'Plan comprehensive testing strategy'
  },
  executor: {
    tools: [unitTestTool, integrationTestTool, e2eTestTool]
  }
});

const documentationAgent = createReActAgent({
  model,
  tools: [codeAnalysisTool, exampleGeneratorTool, markdownTool]
});

// Create multi-agent system with workers
const system = createMultiAgentSystem({
  supervisor: {
    model,
    strategy: 'skill-based'
  },
  workers: [
    {
      id: 'code-reviewer',
      capabilities: {
        skills: ['code-review', 'quality-check', 'reflection'],
        tools: [],
        available: true,
        currentWorkload: 0
      },
      agent: codeReviewAgent
    },
    {
      id: 'tester',
      capabilities: {
        skills: ['testing', 'qa', 'planning'],
        tools: ['custom-unit-test', 'custom-integration-test', 'custom-e2e-test'],  // Custom tools
        available: true,
        currentWorkload: 0
      },
      agent: testingAgent
    },
    {
      id: 'documenter',
      capabilities: {
        skills: ['documentation', 'examples', 'code-analysis'],
        tools: ['custom-code-analysis', 'custom-example-generator', 'custom-markdown'],  // Custom tools
        available: true,
        currentWorkload: 0
      },
      agent: documentationAgent
    }
  ],
  aggregator: { model }
});

// Use the system
const result = await system.invoke({
  input: 'Review, test, and document the authentication module'
});
```

## Custom Workflows

### Building Custom LangGraph Workflows

Create completely custom workflows by composing nodes manually:

```typescript
import { StateGraph, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';

// Initialize model
const model = new ChatOpenAI({ model: 'gpt-4' });

// Define custom state
interface CustomState {
  input: string;
  plan?: string[];
  currentStep?: number;
  results: string[];
  finalOutput?: string;
}

// Helper function to execute a step
async function executeTool(step: string): Promise<string> {
  // In a real implementation, this would call actual tools
  const response = await model.invoke(`Execute this step: ${step}`);
  return response.content as string;
}

// Create custom nodes
async function planningNode(state: CustomState): Promise<CustomState> {
  const response = await model.invoke(`Create a plan for: ${state.input}`);
  const plan = (response.content as string).split('\n').filter(line => line.trim());
  return {
    ...state,
    plan,
    currentStep: 0
  };
}

async function executionNode(state: CustomState): Promise<CustomState> {
  const step = state.plan![state.currentStep!];
  const result = await executeTool(step);

  return {
    ...state,
    results: [...state.results, result],
    currentStep: state.currentStep! + 1
  };
}

async function aggregationNode(state: CustomState): Promise<CustomState> {
  const response = await model.invoke(
    `Summarize results: ${state.results.join('\n')}`
  );
  return { ...state, finalOutput: response.content as string };
}

// Build workflow
const workflow = new StateGraph<CustomState>({
  channels: {
    input: { value: (x, y) => y ?? x },
    plan: { value: (x, y) => y ?? x },
    currentStep: { value: (x, y) => y ?? x },
    results: { value: (x, y) => y ?? x },
    finalOutput: { value: (x, y) => y ?? x }
  }
});

workflow
  .addNode('planning', planningNode)
  .addNode('execution', executionNode)
  .addNode('aggregation', aggregationNode);

workflow.addEdge('__start__', 'planning');

workflow.addConditionalEdges(
  'planning',
  (state) => state.plan && state.plan.length > 0 ? 'execution' : END
);

workflow.addConditionalEdges(
  'execution',
  (state) => {
    if (state.currentStep! < state.plan!.length) {
      return 'execution'; // Continue executing
    }
    return 'aggregation'; // Done executing
  }
);

workflow.addEdge('aggregation', END);

const agent = workflow.compile();
```

### Adding Validation and Error Handling

Enhance custom workflows with validation:

```typescript
async function validationNode(state: CustomState): Promise<CustomState> {
  const isValid = await validateResults(state.results);

  if (!isValid) {
    return {
      ...state,
      currentStep: 0, // Restart
      results: []
    };
  }

  return state;
}

// Add to workflow
workflow.addNode('validation', validationNode);

workflow.addConditionalEdges(
  'execution',
  (state) => {
    if (state.currentStep! < state.plan!.length) {
      return 'execution';
    }
    return 'validation'; // Validate before aggregation
  }
);

workflow.addConditionalEdges(
  'validation',
  (state) => state.results.length > 0 ? 'aggregation' : 'planning'
);
```

## Advanced Techniques

### Technique 1: Dynamic Tool Selection

Dynamically select tools based on context:

```typescript
import { ToolRegistry } from '@agentforge/core';

const registry = new ToolRegistry();
registry.registerMany([...allTools]);

async function selectTools(task: string): Promise<Tool[]> {
  // Use model to select relevant tools
  const selection = await model.invoke(
    `Which tools are needed for: ${task}?\nAvailable: ${registry.getAll().map(t => t.metadata.name).join(', ')}`
  );

  const toolNames = parseToolNames(selection);
  return toolNames.map(name => registry.get(name));
}

// Use in agent
const tools = await selectTools('Research and analyze data');
const agent = createReActAgent({ model, tools });
```

### Technique 2: Adaptive Iteration Limits

Adjust iteration limits based on task complexity:

```typescript
function estimateComplexity(task: string): number {
  const keywords = ['complex', 'comprehensive', 'detailed', 'thorough'];
  const matches = keywords.filter(k => task.toLowerCase().includes(k));
  return Math.min(5 + matches.length * 2, 15);
}

const maxIterations = estimateComplexity(userInput);

const agent = createReActAgent({
  model,
  tools,
  maxIterations
});
```

### Technique 3: Hierarchical Planning

Break complex tasks into hierarchical plans:

```typescript
async function hierarchicalPlanning(task: string, depth: number = 0): Promise<Plan> {
  if (depth > 2) return { steps: [task] }; // Max depth

  const plan = await model.invoke(`Break down: ${task}`);
  const steps = parsePlan(plan);

  const subPlans = await Promise.all(
    steps.map(step =>
      isComplex(step) ? hierarchicalPlanning(step, depth + 1) : { steps: [step] }
    )
  );

  return { steps, subPlans };
}
```

### Technique 4: Result Caching and Reuse

Cache intermediate results for efficiency:

```typescript
import { withCache } from '@agentforge/core';

const cachedResearchTool = withCache(researchTool, {
  ttl: 3600000, // 1 hour
  keyGenerator: (input) => `research:${input.topic}`
});

const agent = createPlanExecuteAgent({
  planner: {
    model,
    systemPrompt: 'Create a research plan'
  },
  executor: {
    tools: [cachedResearchTool, ...otherTools],
    model
  }
});
```

## Best Practices

### 1. Start Simple, Then Compose

```typescript
// ✅ Good - start with simple pattern
const simpleAgent = createReActAgent({ model, tools });

// Then enhance if needed
const enhancedAgent = createPlanExecuteAgent({
  planner: {
    model,
    systemPrompt: 'Create a plan to solve the task'
  },
  executor: {
    tools: [wrapAgentAsTool(simpleAgent), ...otherTools],
    model
  }
});

// ❌ Bad - over-engineering from the start
const overEngineered = createMultiAgentSystem({
  supervisor: {
    strategy: 'skill-based',
    model
  },
  workers: [
    {
      id: 'complex-worker',
      capabilities: {
        skills: ['everything'],
        tools: [],
        available: true,
        currentWorkload: 0
      },
      agent: createReflectionAgent({
        generator: { model },
        reflector: { model },
        reviser: { model }
        // Too complex and unnecessary!
      })
    }
  ],
  aggregator: { model }
});
```

### 2. Monitor and Debug

Add logging to understand workflow:

```typescript
import { withLogging } from '@agentforge/core';

const loggedNode = withLogging({
  name: 'custom-node',
  level: 'debug',
  logInput: true,
  logOutput: true
})(myNode);
```

### 3. Handle Failures Gracefully

```typescript
import { withRetry, withErrorHandler } from '@agentforge/core';

const resilientNode = compose(
  (n) => withRetry(n, { maxAttempts: 3 }),
  (n) => withErrorHandler(n, {
    onError: (error, state) => {
      console.error('Node failed:', error);
      return { ...state, error: error.message };
    }
  })
)(myNode);
```

### 4. Test Each Component

Test patterns individually before combining:

```typescript
import { testing } from '@agentforge/core';

// Test individual node components
const testNode = testing(myNode, {
  nodeName: 'my-node',
  mockResponse: { result: 'test' },
  trackInvocations: true
});

// Call the wrapped node directly
await testNode({ input: 'test' });
console.log(testNode.invocations); // Verify behavior
```

## Complete Example: AI Research Assistant

Putting it all together:

```typescript
import {
  createPlanExecuteAgent,
  createReActAgent,
  createReflectionAgent,
  createMultiAgentSystem
} from '@agentforge/patterns';
import { webSearch, webScraper, calculator, jsonParser } from '@agentforge/tools';

// 1. Create specialized agents
const webResearcher = createReActAgent({
  model,
  tools: [webSearch, webScraper],  // Real exports from @agentforge/tools
  maxIterations: 10
});

const dataAnalyzer = createPlanExecuteAgent({
  planner: { model, maxSteps: 5 },
  executor: { tools: [calculator, jsonParser] }  // Real exports from @agentforge/tools
});

const reportWriter = createReflectionAgent({
  generator: { model },
  reflector: { model },
  reviser: { model },
  maxIterations: 3
});

// 2. Combine in multi-agent system
const researchSystem = createMultiAgentSystem({
  supervisor: {
    model,
    strategy: 'skill-based'
  },
  workers: [
    {
      id: 'researcher',
      capabilities: {
        skills: ['search', 'gather', 'web-research'],
        tools: [],
        available: true,
        currentWorkload: 0
      },
      agent: webResearcher
    },
    {
      id: 'analyzer',
      capabilities: {
        skills: ['analyze', 'visualize', 'data-processing'],
        tools: [],
        available: true,
        currentWorkload: 0
      },
      agent: dataAnalyzer
    },
    {
      id: 'writer',
      capabilities: {
        skills: ['write', 'report', 'documentation'],
        tools: [],
        available: true,
        currentWorkload: 0
      },
      agent: reportWriter
    }
  ],
  aggregator: { model }
});

// 3. Use the system
const result = await researchSystem.invoke({
  input: 'Research AI trends, analyze data, and create a comprehensive report'
});

console.log(result.response);
```

## Next Steps

- [Production Deployment](/tutorials/production-deployment) - Deploy your agents
- [Testing Strategies](/tutorials/testing) - Test complex workflows
- [Monitoring Guide](/guide/advanced/monitoring) - Monitor agent performance
- [Pattern Guides](/guide/concepts/patterns) - Deep dive into each pattern


