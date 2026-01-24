# Plan-Execute Pattern Guide

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Usage Patterns](#usage-patterns)
- [Advanced Features](#advanced-features)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Monitoring & Debugging](#monitoring--debugging)
- [Error Handling](#error-handling)
- [Performance Optimization](#performance-optimization)
- [Testing](#testing)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

## Overview

The Plan-Execute pattern separates planning from execution, enabling better performance on complex tasks. The agent first creates a structured plan, then executes each step systematically.

### When to Use Plan-Execute

**Ideal for:**
- ✅ Well-defined, complex tasks
- ✅ Tasks that benefit from upfront planning
- ✅ Workflows with clear dependencies
- ✅ Tasks requiring parallel execution
- ✅ Structured, traceable execution

**Not ideal for:**
- ❌ Simple, single-step tasks
- ❌ Highly exploratory tasks
- ❌ Tasks where requirements are unclear
- ❌ Tasks requiring constant adaptation

### Key Benefits

1. **Structured Execution**: Clear plan provides structure and traceability
2. **Performance**: Parallel execution of independent steps
3. **Predictability**: Upfront planning makes execution predictable
4. **Debugging**: Easy to identify which step failed
5. **Progress Tracking**: Clear visibility into execution progress

## Architecture

### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  Plan-Execute Workflow                       │
│                                                              │
│  ┌──────────┐      ┌──────────┐      ┌──────────────┐      │
│  │          │      │          │      │              │      │
│  │ PLANNER  ├─────►│ EXECUTOR ├─────►│   FINISHER   │      │
│  │          │      │          │      │              │      │
│  └──────────┘      └────┬─────┘      └──────────────┘      │
│                         │                                   │
│                         │                                   │
│                    ┌────▼─────┐                             │
│                    │          │                             │
│                    │ REPLANNER│                             │
│                    │          │                             │
│                    └────┬─────┘                             │
│                         │                                   │
│                         └──────────┐                        │
│                                    │                        │
│                              Back to Executor               │
└─────────────────────────────────────────────────────────────┘
```

### State Structure

The Plan-Execute pattern maintains state across the workflow:

```typescript
interface PlanExecuteState {
  // Original user input
  input: string;
  
  // The current plan
  plan?: Plan;
  
  // Completed steps with results
  pastSteps: CompletedStep[];
  
  // Current step index
  currentStepIndex?: number;
  
  // Execution status
  status: ExecutionStatus;
  
  // Final response
  response?: string;
  
  // Current iteration
  iteration: number;
  
  // Error information
  error?: string;
}
```

### Node Responsibilities

#### 1. Planner Node
- Analyzes the input
- Creates structured plan
- Identifies dependencies
- Determines step order

#### 2. Executor Node
- Executes plan steps
- Manages tool calls
- Handles errors
- Updates progress

#### 3. Replanner Node (Optional)
- Evaluates execution results
- Decides if replanning needed
- Creates updated plan
- Adapts to new information

#### 4. Finisher Node
- Synthesizes results
- Creates final response
- Formats output
- Completes execution

## Quick Start

### Basic Example

```typescript
import { createPlanExecuteAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

// Create agent
const agent = createPlanExecuteAgent({
  planner: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    maxSteps: 5,
  },
  executor: {
    tools: [searchTool, calculatorTool],
  },
});

// Run agent
const result = await agent.invoke({
  input: 'Research topic X and calculate metric Y',
});

console.log(result.response);
```

### With Replanning

```typescript
const agent = createPlanExecuteAgent({
  planner: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    maxSteps: 5,
  },
  executor: {
    tools: [searchTool, calculatorTool],
  },
  replanner: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    replanThreshold: 0.7, // Replan if confidence < 0.7
  },
});
```

### With Parallel Execution

```typescript
const agent = createPlanExecuteAgent({
  planner: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    maxSteps: 10,
  },
  executor: {
    tools: [tool1, tool2, tool3],
    parallel: true, // Enable parallel execution
  },
});
```

## Core Concepts

### 1. Planning Phase

The planner creates a structured plan:

```typescript
interface Plan {
  steps: PlanStep[];
  goal: string;
  estimatedDuration?: number;
}

interface PlanStep {
  id: string;
  description: string;
  tool?: string;
  dependencies?: string[]; // IDs of steps this depends on
  parallel?: boolean;      // Can run in parallel
}
```

Example plan:
```typescript
{
  goal: "Research and analyze data",
  steps: [
    {
      id: "step1",
      description: "Fetch data from API",
      tool: "fetch_data",
      dependencies: [],
    },
    {
      id: "step2",
      description: "Validate data quality",
      tool: "validate_data",
      dependencies: ["step1"],
    },
    {
      id: "step3",
      description: "Analyze data",
      tool: "analyze",
      dependencies: ["step2"],
    },
  ],
}
```

### 2. Execution Phase

The executor runs each step:

```typescript
interface CompletedStep {
  id: string;
  description: string;
  tool?: string;
  result: any;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
  duration?: number;
  timestamp: string;
}
```

### 3. Replanning

Replanning adapts the plan based on results:

```typescript
// Replanning triggers
- Step failure
- Unexpected results
- Low confidence in current plan
- New information discovered

// Replanning process
1. Evaluate current progress
2. Identify issues
3. Create updated plan
4. Continue execution
```

### 4. Parallel Execution

Independent steps can run in parallel:

```typescript
// Sequential
Step 1 → Step 2 → Step 3 → Step 4
Total time: 4 units

// Parallel (steps 2 and 3 are independent)
Step 1 → [Step 2, Step 3] → Step 4
Total time: 3 units
```

## Usage Patterns

### Pattern 1: Simple Sequential Execution

For straightforward multi-step tasks:

```typescript
const agent = createPlanExecuteAgent({
  planner: {
    model: new ChatOpenAI({ model: 'gpt-4', temperature: 0 }),
    maxSteps: 5,
    systemPrompt: 'Create a clear, sequential plan.',
  },
  executor: {
    tools: [tool1, tool2, tool3],
    parallel: false,
  },
});
```

**Best for**: Linear workflows, simple multi-step tasks

### Pattern 2: Research and Synthesis

For gathering and synthesizing information:

```typescript
const agent = createPlanExecuteAgent({
  planner: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    maxSteps: 8,
    systemPrompt: `Create a research plan:
      1. Identify information sources
      2. Gather data from each source
      3. Validate and cross-reference
      4. Synthesize findings`,
  },
  executor: {
    tools: [searchTool, validateTool, synthesizeTool],
  },
  replanner: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    replanThreshold: 0.8,
  },
});
```

**Best for**: Research tasks, information gathering, synthesis

### Pattern 3: Data Pipeline

For ETL and data processing:

```typescript
const agent = createPlanExecuteAgent({
  planner: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    maxSteps: 10,
    systemPrompt: `Create a data pipeline plan:
      1. Extract data from sources
      2. Transform and clean data
      3. Validate data quality
      4. Load into destination`,
  },
  executor: {
    tools: [extractTool, transformTool, validateTool, loadTool],
    parallel: true, // Parallel extraction
    stepTimeout: 10000,
  },
});
```

**Best for**: ETL pipelines, data processing, batch operations

### Pattern 4: Complex Workflow Orchestration

For complex, multi-stage workflows:

```typescript
const agent = createPlanExecuteAgent({
  planner: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    maxSteps: 15,
    includeToolDescriptions: true,
    systemPrompt: `Create an optimized workflow:
      - Identify independent steps for parallelization
      - Minimize dependencies
      - Include validation checkpoints
      - Plan for error recovery`,
  },
  executor: {
    tools: [...allTools],
    parallel: true,
    stepTimeout: 5000,
  },
  replanner: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    replanThreshold: 0.7,
    systemPrompt: 'Replan if steps fail or produce unexpected results',
  },
  maxIterations: 5,
});
```

**Best for**: Complex workflows, orchestration, automation

## Advanced Features

### Custom Planning Prompts

Guide the planner's behavior:

```typescript
const plannerPrompt = `You are an expert workflow planner.

PLANNING GUIDELINES:
1. Break tasks into 3-7 clear steps
2. Identify dependencies explicitly
3. Mark independent steps for parallel execution
4. Include validation steps
5. Plan for error scenarios

STEP FORMAT:
- Description: Clear, actionable description
- Tool: Specific tool to use
- Dependencies: List of prerequisite steps
- Parallel: Can this run in parallel?

EXAMPLE PLAN:
Step 1: Fetch user data (no dependencies, can parallel)
Step 2: Fetch order data (no dependencies, can parallel)
Step 3: Merge data (depends on steps 1,2)
Step 4: Analyze merged data (depends on step 3)
Step 5: Generate report (depends on step 4)`;

const agent = createPlanExecuteAgent({
  planner: {
    llm,
    systemPrompt: plannerPrompt,
    maxSteps: 7,
  },
  executor: { tools },
});
```

### Dependency Management

Explicitly manage step dependencies:

```typescript
// In planner prompt
systemPrompt: `When creating plans:
- Mark dependencies clearly
- Ensure dependencies are satisfied before execution
- Group independent steps for parallel execution
- Validate dependency chains`

// The executor automatically handles dependencies
// and executes steps in the correct order
```

### Progress Callbacks

Track execution progress:

```typescript
const agent = createPlanExecuteAgent({
  planner: { llm, maxSteps: 5 },
  executor: {
    tools,
    onStepStart: (step) => {
      console.log(`Starting: ${step.description}`);
    },
    onStepComplete: (step, result) => {
      console.log(`Completed: ${step.description}`);
      console.log(`Result: ${JSON.stringify(result)}`);
    },
    onStepError: (step, error) => {
      console.error(`Failed: ${step.description}`);
      console.error(`Error: ${error.message}`);
    },
  },
});
```

### Streaming Results

Stream intermediate results as they complete:

```typescript
for await (const event of await agent.stream({ input: query })) {
  if (event.plan) {
    console.log('Plan created:', event.plan);
  }
  if (event.pastSteps) {
    const latest = event.pastSteps[event.pastSteps.length - 1];
    console.log('Step completed:', latest);
  }
  if (event.response) {
    console.log('Final response:', event.response);
  }
}
```

## Best Practices

### 1. Planning Best Practices

**DO:**
- ✅ Create 3-7 steps for most tasks
- ✅ Make steps specific and actionable
- ✅ Identify dependencies clearly
- ✅ Include validation steps
- ✅ Plan for error scenarios

**DON'T:**
- ❌ Create overly granular plans (>15 steps)
- ❌ Make steps too vague
- ❌ Ignore dependencies
- ❌ Skip validation
- ❌ Assume perfect execution

Example:
```typescript
// ✅ GOOD PLAN
{
  steps: [
    { id: '1', description: 'Fetch user data from API', tool: 'fetch_api' },
    { id: '2', description: 'Validate data completeness', tool: 'validate', dependencies: ['1'] },
    { id: '3', description: 'Transform data to target format', tool: 'transform', dependencies: ['2'] },
    { id: '4', description: 'Save to database', tool: 'save_db', dependencies: ['3'] },
  ]
}

// ❌ BAD PLAN
{
  steps: [
    { id: '1', description: 'Get data' }, // Too vague
    { id: '2', description: 'Process it' }, // No tool specified
    { id: '3', description: 'Save somewhere' }, // Unclear destination
  ]
}
```

### 2. Tool Design for Plan-Execute

Tools should match plan step granularity:

```typescript
// ✅ GOOD: Tools match plan steps
const fetchUserTool = {
  name: 'fetch_user',
  description: 'Fetch user data by ID',
  schema: z.object({ userId: z.string() }),
  execute: async ({ userId }) => {
    // Focused, single-purpose tool
    return await db.users.findOne({ id: userId });
  },
};

// ❌ BAD: Tool too complex for single step
const processEverythingTool = {
  name: 'process_all',
  description: 'Fetch, validate, transform, and save data',
  // Too many responsibilities
};
```

### 3. Dependency Management

Clearly define and validate dependencies:

```typescript
const plannerPrompt = `When creating plans:

DEPENDENCY RULES:
1. List all prerequisite steps explicitly
2. Ensure no circular dependencies
3. Group independent steps together
4. Validate dependency chain is complete

EXAMPLE:
Step 1: Fetch data A (no deps)
Step 2: Fetch data B (no deps) [can parallel with 1]
Step 3: Merge A and B (deps: 1, 2)
Step 4: Analyze merged data (deps: 3)`;
```

### 4. Error Handling

Handle errors at multiple levels:

```typescript
// Tool-level error handling
const robustTool = {
  name: 'api_call',
  description: 'Call external API',
  schema: z.object({ endpoint: z.string() }),
  execute: async ({ endpoint }) => {
    try {
      const response = await fetch(endpoint, { timeout: 5000 });
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}`,
          canRetry: response.status >= 500,
        };
      }
      return { success: true, data: await response.json() };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        canRetry: true,
      };
    }
  },
};

// Agent-level error handling
const agent = createPlanExecuteAgent({
  planner: { llm, maxSteps: 5 },
  executor: {
    tools: [robustTool],
    onStepError: async (step, error) => {
      // Log error
      console.error(`Step failed: ${step.description}`, error);

      // Decide whether to continue or abort
      if (error.canRetry) {
        return 'retry';
      }
      return 'abort';
    },
  },
  replanner: {
    llm,
    // Replan on errors
    replanThreshold: 0.5,
  },
});
```

### 5. Performance Optimization

Optimize for performance:

```typescript
const agent = createPlanExecuteAgent({
  planner: {
    model: new ChatOpenAI({ model: 'gpt-4', temperature: 0 }),
    maxSteps: 10,
    systemPrompt: `Optimize for performance:
      - Identify steps that can run in parallel
      - Minimize sequential dependencies
      - Group related operations
      - Avoid redundant steps`,
  },
  executor: {
    tools,
    parallel: true,           // Enable parallelization
    stepTimeout: 5000,        // Prevent hanging
    maxParallelSteps: 5,      // Limit concurrency
  },
});
```

## Common Patterns

### Pattern: ETL Pipeline

```typescript
const etlAgent = createPlanExecuteAgent({
  planner: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    maxSteps: 8,
    systemPrompt: `Create an ETL pipeline plan:
      1. Extract from sources (can parallel)
      2. Validate extracted data
      3. Transform data
      4. Validate transformed data
      5. Load to destination`,
  },
  executor: {
    tools: [extractTool, validateTool, transformTool, loadTool],
    parallel: true,
  },
});
```

### Pattern: Research Synthesis

```typescript
const researchAgent = createPlanExecuteAgent({
  planner: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    maxSteps: 10,
    systemPrompt: `Create a research plan:
      1. Identify key topics
      2. Search each topic (parallel)
      3. Validate sources
      4. Extract key information
      5. Cross-reference findings
      6. Synthesize into report`,
  },
  executor: {
    tools: [searchTool, validateTool, extractTool, synthesizeTool],
    parallel: true,
  },
  replanner: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    replanThreshold: 0.8,
  },
});
```

### Pattern: Multi-Stage Workflow

```typescript
const workflowAgent = createPlanExecuteAgent({
  planner: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    maxSteps: 15,
    systemPrompt: `Create a multi-stage workflow:
      Stage 1: Data Collection (parallel)
      Stage 2: Data Processing (sequential)
      Stage 3: Analysis (parallel)
      Stage 4: Reporting (sequential)`,
  },
  executor: {
    tools: [...allTools],
    parallel: true,
    stepTimeout: 10000,
  },
});
```

## Monitoring & Debugging

### Structured Logging

The Plan-Execute pattern uses AgentForge's structured logging system with three dedicated loggers:

- `agentforge:patterns:plan-execute:planner` - Plan generation
- `agentforge:patterns:plan-execute:executor` - Step execution
- `agentforge:patterns:plan-execute:replanner` - Plan revision

### Enable Debug Logging

```bash
# See everything (most verbose)
LOG_LEVEL=debug npm start

# See important events only (recommended for production)
LOG_LEVEL=info npm start
```

### Example Debug Output

```
[2026-01-24T10:15:33.163Z] [DEBUG] [agentforge:patterns:plan-execute:planner] Planner node executing
[2026-01-24T10:15:33.164Z] [INFO] [agentforge:patterns:plan-execute:planner] Plan generated data={"stepCount":5,"duration":234}
[2026-01-24T10:15:33.165Z] [DEBUG] [agentforge:patterns:plan-execute:executor] Executing step data={"stepIndex":0,"description":"Fetch data"}
[2026-01-24T10:15:33.166Z] [INFO] [agentforge:patterns:plan-execute:executor] Step complete data={"stepIndex":0,"status":"completed","duration":156}
```

### Track Progress

```typescript
const result = await agent.invoke({ input: query });

// Check progress
console.log('Plan:', result.plan);
console.log('Completed:', result.pastSteps.length);
console.log('Total:', result.plan?.steps.length);
console.log('Progress:',
  `${Math.round((result.pastSteps.length / result.plan.steps.length) * 100)}%`
);

// Check for issues
const failedSteps = result.pastSteps.filter(s => s.status === 'failed');
if (failedSteps.length > 0) {
  console.warn('Failed steps:', failedSteps);
}
```

### Common Debugging Scenarios

#### Plan Too Vague

```bash
LOG_LEVEL=debug npm start
```

Look for "Plan generated" logs to see the plan structure:
```
[INFO] [agentforge:patterns:plan-execute:planner] Plan generated data={"stepCount":5}
```

#### Step Execution Failing

```bash
LOG_LEVEL=debug npm start
```

Look for "Step complete" logs with status:
```
[INFO] [agentforge:patterns:plan-execute:executor] Step complete data={"status":"failed","error":"..."}
```

#### Slow Performance

```bash
LOG_LEVEL=info npm start
```

Check `duration` fields:
```
[INFO] [agentforge:patterns:plan-execute:executor] Step complete data={"duration":5234}
```

### LangSmith Integration

```typescript
import { Client } from 'langsmith';

const client = new Client({
  apiKey: process.env.LANGSMITH_API_KEY,
});

// Traces automatically captured
const result = await agent.invoke(
  { input: query },
  {
    runName: 'plan-execute-run',
    tags: ['plan-execute', 'production'],
    metadata: { taskType: 'research' },
  }
);
```

For more debugging techniques, see the [Debugging Guide](../../../docs/DEBUGGING_GUIDE.md).

## Error Handling

### Step-Level Errors

```typescript
const agent = createPlanExecuteAgent({
  planner: { llm, maxSteps: 5 },
  executor: {
    tools,
    onStepError: async (step, error) => {
      console.error(`Step "${step.description}" failed:`, error);

      // Decide how to handle
      if (error.canRetry) {
        console.log('Retrying step...');
        return 'retry';
      }

      if (error.canSkip) {
        console.log('Skipping step...');
        return 'skip';
      }

      console.log('Aborting execution...');
      return 'abort';
    },
  },
  replanner: {
    llm,
    // Trigger replanning on errors
    replanThreshold: 0.5,
  },
});
```

### Plan-Level Errors

```typescript
try {
  const result = await agent.invoke({ input: query });

  if (result.status === 'failed') {
    console.error('Execution failed:', result.error);

    // Check which step failed
    const failedStep = result.pastSteps.find(s => s.status === 'failed');
    console.error('Failed at step:', failedStep);
  }

} catch (error) {
  console.error('Agent error:', error);
  // Fallback logic
}
```

### Graceful Degradation

```typescript
const agent = createPlanExecuteAgent({
  planner: { llm, maxSteps: 5 },
  executor: {
    tools,
    continueOnError: true, // Continue even if steps fail
  },
  replanner: {
    llm,
    replanThreshold: 0.6,
    systemPrompt: `If steps fail:
      - Skip non-critical steps
      - Find alternative approaches
      - Provide partial results if needed`,
  },
});
```

## Performance Optimization

### 1. Parallel Execution

```typescript
const agent = createPlanExecuteAgent({
  planner: {
    llm,
    maxSteps: 10,
    systemPrompt: `Identify independent steps for parallel execution.
      Mark steps that can run concurrently.`,
  },
  executor: {
    tools,
    parallel: true,
    maxParallelSteps: 5, // Limit concurrency
  },
});
```

### 2. Caching

```typescript
import { InMemoryCache } from '@langchain/core/caches';

// Cache LLM responses
const llm = new ChatOpenAI({
  model: 'gpt-4',
  cache: new InMemoryCache(),
});

// Cache tool results
const cache = new Map();
const cachedTool = {
  name: 'cached_search',
  description: 'Search with caching',
  schema: z.object({ query: z.string() }),
  execute: async ({ query }) => {
    if (cache.has(query)) {
      return cache.get(query);
    }
    const result = await search(query);
    cache.set(query, result);
    return result;
  },
};
```

### 3. Optimize Plan Size

```typescript
const agent = createPlanExecuteAgent({
  planner: {
    llm,
    maxSteps: 7, // Limit plan size
    systemPrompt: `Create concise plans:
      - Combine related operations
      - Avoid redundant steps
      - Focus on essential steps only`,
  },
  executor: { tools },
});
```

### 4. Timeouts

```typescript
const agent = createPlanExecuteAgent({
  planner: { llm, maxSteps: 5 },
  executor: {
    tools,
    stepTimeout: 5000,      // 5s per step
    totalTimeout: 30000,    // 30s total
  },
});
```

## Testing

### Unit Testing Nodes

```typescript
import { describe, it, expect } from 'vitest';
import { createPlannerNode } from '@agentforge/patterns';

describe('PlannerNode', () => {
  it('should create a valid plan', async () => {
    const node = createPlannerNode({
      llm,
      maxSteps: 5,
    });

    const state = {
      input: 'Research topic X and summarize findings',
      status: 'planning',
      pastSteps: [],
      iteration: 0,
    };

    const result = await node(state);

    expect(result.plan).toBeDefined();
    expect(result.plan.steps.length).toBeGreaterThan(0);
    expect(result.plan.steps.length).toBeLessThanOrEqual(5);
  });
});
```

### Integration Testing

```typescript
describe('Plan-Execute Agent Integration', () => {
  it('should execute complete workflow', async () => {
    const agent = createPlanExecuteAgent({
      planner: {
        model: new ChatOpenAI({ model: 'gpt-4', temperature: 0 }),
        maxSteps: 5,
      },
      executor: {
        tools: [searchTool, summarizeTool],
      },
    });

    const result = await agent.invoke({
      input: 'Search for AI news and summarize',
    });

    // Verify plan was created
    expect(result.plan).toBeDefined();
    expect(result.plan.steps.length).toBeGreaterThan(0);

    // Verify steps were executed
    expect(result.pastSteps.length).toBe(result.plan.steps.length);

    // Verify all steps succeeded
    const allSucceeded = result.pastSteps.every(s => s.status === 'success');
    expect(allSucceeded).toBe(true);

    // Verify final response
    expect(result.response).toBeDefined();
    expect(result.response.length).toBeGreaterThan(0);
  });

  it('should handle step failures with replanning', async () => {
    const failingTool = {
      name: 'failing_tool',
      description: 'A tool that fails',
      schema: z.object({ input: z.string() }),
      execute: async () => {
        throw new Error('Tool failed');
      },
    };

    const agent = createPlanExecuteAgent({
      planner: { llm, maxSteps: 3 },
      executor: { tools: [failingTool] },
      replanner: { llm, replanThreshold: 0.5 },
    });

    const result = await agent.invoke({
      input: 'Use the failing tool',
    });

    // Should have attempted replanning
    expect(result.iteration).toBeGreaterThan(1);
  });
});
```

### Testing with Mock LLM

```typescript
import { FakeListChatModel } from '@langchain/core/utils/testing';

describe('Plan-Execute with Mock LLM', () => {
  it('should work with predetermined responses', async () => {
    const mockLLM = new FakeListChatModel({
      responses: [
        JSON.stringify({
          steps: [
            { id: '1', description: 'Step 1', tool: 'tool1' },
            { id: '2', description: 'Step 2', tool: 'tool2' },
          ],
        }),
        'Final response',
      ],
    });

    const agent = createPlanExecuteAgent({
      planner: { llm: mockLLM, maxSteps: 5 },
      executor: { tools: [tool1, tool2] },
    });

    const result = await agent.invoke({ input: 'Test query' });

    expect(result.plan).toBeDefined();
    expect(result.response).toBeDefined();
  });
});
```

## API Reference

### createPlanExecuteAgent()

Creates a compiled Plan-Execute agent.

```typescript
function createPlanExecuteAgent(
  config: PlanExecuteAgentConfig
): CompiledStateGraph
```

#### Parameters

**config: PlanExecuteAgentConfig**

**planner: PlannerConfig**
- `llm: BaseChatModel` - Language model for planning
- `systemPrompt?: string` - Custom planning prompt
- `maxSteps?: number` - Maximum steps in plan (default: 10)
- `includeToolDescriptions?: boolean` - Include tool info in planning

**executor: ExecutorConfig**
- `tools: Tool[]` - Available tools
- `llm?: BaseChatModel` - Optional LLM for sub-tasks
- `parallel?: boolean` - Enable parallel execution (default: false)
- `stepTimeout?: number` - Timeout per step in ms
- `maxParallelSteps?: number` - Max concurrent steps
- `continueOnError?: boolean` - Continue if steps fail

**replanner?: ReplannerConfig**
- `llm: BaseChatModel` - LLM for replanning
- `replanThreshold?: number` - Confidence threshold (0-1)
- `systemPrompt?: string` - Custom replanning prompt

**Other Options**
- `maxIterations?: number` - Max planning iterations (default: 5)
- `returnIntermediateSteps?: boolean` - Return step details
- `verbose?: boolean` - Enable logging

#### Returns

`CompiledStateGraph` - Compiled LangGraph agent

#### Example

```typescript
const agent = createPlanExecuteAgent({
  planner: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    maxSteps: 7,
    systemPrompt: 'Create efficient plans',
  },
  executor: {
    tools: [tool1, tool2],
    parallel: true,
    stepTimeout: 5000,
  },
  replanner: {
    model: new ChatOpenAI({ model: 'gpt-4' }),
    replanThreshold: 0.7,
  },
  verbose: true,
});
```

### createPlannerNode()

Creates the planner node for custom workflows.

```typescript
function createPlannerNode(
  config: PlannerConfig
): (state: PlanExecuteStateType) => Promise<Partial<PlanExecuteStateType>>
```

### createExecutorNode()

Creates the executor node for custom workflows.

```typescript
function createExecutorNode(
  config: ExecutorConfig
): (state: PlanExecuteStateType) => Promise<Partial<PlanExecuteStateType>>
```

### createReplannerNode()

Creates the replanner node for custom workflows.

```typescript
function createReplannerNode(
  config: ReplannerConfig
): (state: PlanExecuteStateType) => Promise<Partial<PlanExecuteStateType>>
```

### createFinisherNode()

Creates the finisher node for custom workflows.

```typescript
function createFinisherNode(): (
  state: PlanExecuteStateType
) => Promise<Partial<PlanExecuteStateType>>
```

### State Types

#### PlanExecuteStateType

```typescript
interface PlanExecuteStateType {
  input: string;
  plan?: Plan;
  pastSteps: CompletedStep[];
  currentStepIndex?: number;
  status: ExecutionStatus;
  response?: string;
  iteration: number;
  error?: string;
}
```

#### Plan

```typescript
interface Plan {
  steps: PlanStep[];
  goal: string;
  estimatedDuration?: number;
}
```

#### PlanStep

```typescript
interface PlanStep {
  id: string;
  description: string;
  tool?: string;
  arguments?: Record<string, any>;
  dependencies?: string[];
  parallel?: boolean;
}
```

#### CompletedStep

```typescript
interface CompletedStep {
  id: string;
  description: string;
  tool?: string;
  result: any;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
  duration?: number;
  timestamp: string;
}
```

#### ExecutionStatus

```typescript
type ExecutionStatus =
  | 'planning'
  | 'executing'
  | 'replanning'
  | 'completed'
  | 'failed';
```

## Troubleshooting

### Plan is too vague or generic

**Symptoms:**
- Steps lack specificity
- No tools specified
- Unclear dependencies

**Solutions:**
```typescript
// 1. Improve planner prompt
systemPrompt: `Create specific, actionable plans.
Each step must:
- Have a clear, specific description
- Specify which tool to use
- List dependencies explicitly
- Be independently executable

BAD: "Get data"
GOOD: "Fetch user data from API using fetch_user tool"`

// 2. Include tool descriptions
planner: {
  llm,
  includeToolDescriptions: true,
  systemPrompt: 'Use the available tools to create your plan',
}

// 3. Provide examples
systemPrompt: `Example plan:
Step 1: Fetch data from API (tool: fetch_api, deps: none)
Step 2: Validate data (tool: validate, deps: [1])
Step 3: Transform data (tool: transform, deps: [2])`
```

### Steps fail during execution

**Symptoms:**
- Multiple step failures
- Execution aborts early
- Error messages in results

**Solutions:**
```typescript
// 1. Add error handling in tools
execute: async (args) => {
  try {
    const result = await operation(args);
    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      canRetry: true,
    };
  }
}

// 2. Enable replanning
replanner: {
  llm,
  replanThreshold: 0.7,
  systemPrompt: 'If steps fail, create alternative plan',
}

// 3. Add step timeouts
executor: {
  tools,
  stepTimeout: 10000, // 10 seconds
  continueOnError: true,
}
```

### Execution is too slow

**Symptoms:**
- Long execution times
- Sequential execution of independent steps
- Waiting for slow tools

**Solutions:**
```typescript
// 1. Enable parallel execution
executor: {
  tools,
  parallel: true,
  maxParallelSteps: 5,
}

// 2. Optimize planner for parallelization
planner: {
  llm,
  systemPrompt: `Identify independent steps that can run in parallel.
    Mark steps with no dependencies as parallel: true`,
}

// 3. Add timeouts
executor: {
  tools,
  stepTimeout: 5000,
  totalTimeout: 30000,
}

// 4. Cache expensive operations
const cachedTool = {
  execute: async (args) => {
    const cacheKey = JSON.stringify(args);
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    const result = await expensiveOperation(args);
    cache.set(cacheKey, result);
    return result;
  },
};
```

### Plan doesn't match available tools

**Symptoms:**
- Steps reference non-existent tools
- Tool names don't match
- Missing required tools

**Solutions:**
```typescript
// 1. Include tool descriptions in planning
planner: {
  llm,
  includeToolDescriptions: true,
  systemPrompt: `Available tools:
    ${tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

    Only use these tools in your plan.`,
}

// 2. Validate plan before execution
const validatePlan = (plan: Plan, tools: Tool[]) => {
  const toolNames = new Set(tools.map(t => t.name));
  for (const step of plan.steps) {
    if (step.tool && !toolNames.has(step.tool)) {
      throw new Error(`Unknown tool: ${step.tool}`);
    }
  }
};

// 3. Improve tool descriptions
const tool = {
  name: 'search_api',
  description: 'Search for information using external API. Use this when you need current information.',
  // Clear, specific description
};
```

### Too many replanning iterations

**Symptoms:**
- Agent keeps replanning
- Never completes execution
- Hits max iterations

**Solutions:**
```typescript
// 1. Adjust replan threshold
replanner: {
  llm,
  replanThreshold: 0.5, // Lower = less replanning
}

// 2. Limit iterations
maxIterations: 3,

// 3. Improve replanning logic
replanner: {
  llm,
  systemPrompt: `Only replan if:
    - Critical step failed
    - Results are completely unexpected
    - Current plan is impossible to complete

    Do NOT replan for minor issues.`,
}
```

## Comparison with Other Patterns

### Plan-Execute vs ReAct

| Aspect | Plan-Execute | ReAct |
|--------|--------------|-------|
| Planning | Upfront, structured | Dynamic, iterative |
| Execution | Follows plan | Opportunistic |
| Flexibility | Lower - follows plan | Higher - adapts freely |
| Transparency | Plan shows structure | Reasoning shows thinking |
| Best for | Well-defined tasks | Exploratory tasks |
| Performance | Can parallelize | Sequential |
| Predictability | High | Lower |

**Use Plan-Execute when:**
- Task is well-defined
- Can plan upfront
- Want structured execution
- Need parallel execution
- Want predictable flow

**Use ReAct when:**
- Task is exploratory
- Requirements unclear
- Need to adapt dynamically
- Want transparent reasoning

### Plan-Execute vs Reflection

| Aspect | Plan-Execute | Reflection |
|--------|--------------|------------|
| Focus | Execution structure | Output quality |
| Iterations | Plan-driven | Critique-driven |
| Output | Task completion | Refined answer |
| Best for | Complex workflows | Quality-critical tasks |
| Complexity | Medium | Higher |

**Use Plan-Execute when:**
- Focus on task execution
- Need structured workflow
- Want parallel execution

**Use Reflection when:**
- Quality is critical
- Need iterative refinement
- Want self-critique

## Advanced Topics

### Combining Patterns

Plan-Execute can be combined with other patterns:

```typescript
// Plan-Execute + Reflection
const planExecuteAgent = createPlanExecuteAgent({ ... });
const reflectionAgent = createReflectionAgent({ ... });

async function planExecuteWithReflection(query: string) {
  // 1. Execute plan
  const executionResult = await planExecuteAgent.invoke({ input: query });

  // 2. Refine result with reflection
  const refinedResult = await reflectionAgent.invoke({
    messages: [new HumanMessage(executionResult.response)],
  });

  return refinedResult;
}
```

### Hierarchical Planning

Multi-level plans for complex tasks:

```typescript
const hierarchicalAgent = createPlanExecuteAgent({
  planner: {
    llm,
    systemPrompt: `Create hierarchical plans:
      - High-level phases
      - Detailed steps within each phase
      - Dependencies between phases`,
  },
  executor: {
    tools: [...allTools],
    // Each step can itself be a sub-plan
  },
});
```

### Dynamic Tool Selection

Select tools based on plan requirements:

```typescript
const dynamicAgent = createPlanExecuteAgent({
  planner: {
    llm,
    systemPrompt: 'Identify required tools for each step',
  },
  executor: {
    tools: allTools,
    toolSelector: (step) => {
      // Dynamically select tools for each step
      return allTools.filter(t =>
        step.description.toLowerCase().includes(t.name)
      );
    },
  },
});
```

## Resources

### Documentation
- [Examples](../examples/plan-execute/)
- [API Reference](#api-reference)
- [Test Suite](../tests/plan-execute/)

### Papers
- [Plan-and-Solve Prompting](https://arxiv.org/abs/2305.04091)
- [Least-to-Most Prompting](https://arxiv.org/abs/2205.10625)

### Related Patterns
- [ReAct Pattern](./react-pattern.md)
- [Reflection Pattern](./reflection-pattern.md)

## Changelog

### v1.0.0
- Initial Plan-Execute pattern implementation
- Planner, executor, replanner, finisher nodes
- Parallel execution support
- Dependency management
- Comprehensive documentation

### Future Enhancements
- [ ] Automatic dependency detection
- [ ] Advanced parallelization strategies
- [ ] Plan visualization
- [ ] Cost estimation
- [ ] Plan templates

## Contributing

We welcome contributions! Areas for improvement:
- Additional examples
- Performance optimizations
- Better planning prompts
- Documentation improvements
- Test coverage

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../LICENSE) for details.

---

**Need help?** Check the [Troubleshooting](#troubleshooting) section or open an issue on GitHub.


