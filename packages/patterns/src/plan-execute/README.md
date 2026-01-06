# Plan-Execute Pattern Implementation

This directory contains the implementation of the Plan-Execute pattern for LangGraph.

## Overview

The Plan-Execute pattern separates planning from execution:
1. **Plan** - Create a structured, multi-step plan
2. **Execute** - Execute each step of the plan
3. **Replan** (optional) - Adjust the plan based on results
4. **Finish** - Synthesize results into final response

## Directory Structure

```
plan-execute/
├── index.ts              # Main exports
├── agent.ts              # Agent creation
├── nodes/
│   ├── planner.ts        # Planning node
│   ├── executor.ts       # Execution node
│   ├── replanner.ts      # Replanning node
│   └── finisher.ts       # Finisher node
├── state.ts              # State definitions
├── types.ts              # Type definitions
└── README.md             # This file
```

## Quick Start

```typescript
import { createPlanExecuteAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';

const agent = createPlanExecuteAgent({
  planner: {
    llm: new ChatOpenAI({ model: 'gpt-4' }),
    maxSteps: 5,
  },
  executor: {
    tools: [searchTool, calculatorTool],
  },
});

const result = await agent.invoke({
  input: 'Research topic X and calculate metric Y',
});
```

## Core Components

### 1. Agent (`agent.ts`)

Main entry point for creating Plan-Execute agents.

**Key Function:**
- `createPlanExecuteAgent(config)` - Creates a compiled agent

**Features:**
- Configurable planning, execution, and replanning
- Parallel execution support
- Customizable prompts and behavior

### 2. Planner Node (`nodes/planner.ts`)

Creates structured plans from user input.

**Responsibilities:**
- Analyze user input
- Generate step-by-step plan
- Identify dependencies
- Determine execution order

**Configuration:**
```typescript
{
  llm: BaseChatModel,
  systemPrompt?: string,
  maxSteps?: number,
  includeToolDescriptions?: boolean,
}
```

### 3. Executor Node (`nodes/executor.ts`)

Executes plan steps using available tools.

**Responsibilities:**
- Execute each step in order
- Handle dependencies
- Manage parallel execution
- Track progress

**Configuration:**
```typescript
{
  tools: Tool[],
  llm?: BaseChatModel,
  parallel?: boolean,
  stepTimeout?: number,
  maxParallelSteps?: number,
}
```

### 4. Replanner Node (`nodes/replanner.ts`)

Adapts the plan based on execution results.

**Responsibilities:**
- Evaluate execution results
- Decide if replanning needed
- Create updated plan
- Maintain progress

**Configuration:**
```typescript
{
  llm: BaseChatModel,
  replanThreshold?: number,
  systemPrompt?: string,
}
```

### 5. Finisher Node (`nodes/finisher.ts`)

Synthesizes results into final response.

**Responsibilities:**
- Collect all step results
- Synthesize into coherent response
- Format output
- Complete execution

## State Management

### State Structure

```typescript
interface PlanExecuteState {
  input: string;                    // Original query
  plan?: Plan;                      // Current plan
  pastSteps: CompletedStep[];       // Executed steps
  currentStepIndex?: number;        // Current step
  status: ExecutionStatus;          // Current status
  response?: string;                // Final response
  iteration: number;                // Current iteration
  error?: string;                   // Error message
}
```

### State Flow

```
1. Initial State
   { input, status: 'planning', iteration: 0 }

2. After Planning
   { input, plan, status: 'executing', iteration: 0 }

3. During Execution
   { input, plan, pastSteps: [...], currentStepIndex: N, status: 'executing' }

4. After Replanning (if needed)
   { input, plan: updatedPlan, pastSteps: [...], status: 'executing', iteration: 1 }

5. Final State
   { input, plan, pastSteps: [...], response, status: 'completed' }
```

## Type Definitions

### Plan

```typescript
interface Plan {
  steps: PlanStep[];
  goal: string;
  estimatedDuration?: number;
}
```

### PlanStep

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

### CompletedStep

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

## Usage Examples

### Basic Usage

```typescript
const agent = createPlanExecuteAgent({
  planner: {
    llm: new ChatOpenAI({ model: 'gpt-4' }),
    maxSteps: 5,
  },
  executor: {
    tools: [tool1, tool2],
  },
});
```

### With Replanning

```typescript
const agent = createPlanExecuteAgent({
  planner: { llm, maxSteps: 5 },
  executor: { tools },
  replanner: {
    llm,
    replanThreshold: 0.7,
  },
});
```

### With Parallel Execution

```typescript
const agent = createPlanExecuteAgent({
  planner: { llm, maxSteps: 10 },
  executor: {
    tools,
    parallel: true,
    maxParallelSteps: 5,
  },
});
```

### Custom Workflow

```typescript
import {
  createPlannerNode,
  createExecutorNode,
  createFinisherNode,
} from '@agentforge/patterns';

const plannerNode = createPlannerNode({ llm, maxSteps: 5 });
const executorNode = createExecutorNode({ tools });
const finisherNode = createFinisherNode();

// Build custom workflow with StateGraph
```

## Testing

Run tests:
```bash
npm test src/plan-execute
```

Run specific test:
```bash
npm test src/plan-execute/nodes/planner.test.ts
```

## Documentation

- [Pattern Guide](../../docs/plan-execute-pattern.md) - Comprehensive guide
- [Examples](../../examples/plan-execute/) - Usage examples
- [Tests](../../tests/plan-execute/) - Test examples

## Contributing

When contributing to the Plan-Execute pattern:

1. **Maintain backward compatibility**
2. **Add tests for new features**
3. **Update documentation**
4. **Follow existing code style**
5. **Add examples for new features**

## License

MIT License - see [LICENSE](../../LICENSE) for details.

