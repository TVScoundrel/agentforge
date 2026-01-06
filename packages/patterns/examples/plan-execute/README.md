# Plan-Execute Pattern Examples

This directory contains comprehensive examples demonstrating the Plan-Execute pattern implementation in `@agentforge/patterns`.

## What is the Plan-Execute Pattern?

The Plan-Execute pattern separates planning from execution for better performance on complex tasks:
1. **Plan** - Create a structured, multi-step plan
2. **Execute** - Execute each step of the plan
3. **Replan** (optional) - Adjust the plan based on results
4. **Finish** - Synthesize results into final response

This pattern is particularly useful when you can plan the task upfront and want structured, traceable execution.

## Examples Overview

### 01-basic-plan-execute.ts
**Basic usage of the Plan-Execute pattern**

Demonstrates:
- Creating a simple Plan-Execute agent
- Sequential step execution
- Plan generation and tracking
- Viewing execution results

**Use case**: Multi-step tasks with clear structure

```bash
npx tsx packages/patterns/examples/plan-execute/01-basic-plan-execute.ts
```

### 02-research-task.ts
**Research tasks with information synthesis**

Demonstrates:
- Multi-source research
- Information gathering and synthesis
- Replanning based on results
- Report generation

**Use case**: Research, data gathering, synthesis tasks

```bash
npx tsx packages/patterns/examples/plan-execute/02-research-task.ts
```

### 03-complex-planning.ts
**Complex planning with parallel execution**

Demonstrates:
- Parallel execution of independent steps
- Dependency management
- Performance optimization
- Complex workflow orchestration

**Use case**: Data pipelines, complex workflows, performance-critical tasks

```bash
npx tsx packages/patterns/examples/plan-execute/03-complex-planning.ts
```

### 04-custom-workflow.ts
**Building custom Plan-Execute workflows**

Demonstrates:
- Using individual node creators
- Custom routing logic
- Adding custom nodes (validation, progress tracking)
- Fine-grained workflow control

**Use case**: Advanced workflows, custom integrations, specialized requirements

```bash
npx tsx packages/patterns/examples/plan-execute/04-custom-workflow.ts
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
npx tsx packages/patterns/examples/plan-execute/01-basic-plan-execute.ts
```

### Run all examples:
```bash
for file in packages/patterns/examples/plan-execute/*.ts; do
  echo "Running $file..."
  npx tsx "$file"
  echo ""
done
```

## Key Concepts

### Plan-Execute Workflow

The core workflow consists of:

```typescript
// 1. PLAN: Create structured plan
const plan = await planner(input);

// 2. EXECUTE: Execute each step
for (const step of plan.steps) {
  const result = await executor(step);
  pastSteps.push(result);
  
  // 3. REPLAN (optional): Adjust if needed
  if (shouldReplan(result)) {
    plan = await replanner(plan, pastSteps);
  }
}

// 4. FINISH: Synthesize results
const response = await finisher(pastSteps);
```

### Configuration Options

#### Basic Configuration
```typescript
const agent = createPlanExecuteAgent({
  planner: {
    llm: ChatOpenAI,        // LLM for planning
    maxSteps: 5,            // Max steps in plan
  },
  executor: {
    tools: Tool[],          // Available tools
    parallel: false,        // Sequential execution
  },
});
```

#### Advanced Configuration
```typescript
const agent = createPlanExecuteAgent({
  planner: {
    llm,
    maxSteps: 10,
    systemPrompt: 'Custom planning instructions',
    includeToolDescriptions: true,
  },
  executor: {
    tools,
    llm,                    // Optional LLM for sub-tasks
    parallel: true,         // Enable parallel execution
    stepTimeout: 5000,      // Timeout per step (ms)
  },
  replanner: {
    llm,
    replanThreshold: 0.7,   // Confidence threshold
    systemPrompt: 'Custom replanning logic',
  },
  maxIterations: 5,
  returnIntermediateSteps: true,
  verbose: true,
});
```

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

## Common Use Cases

### 1. Research & Analysis
- Multi-source research
- Data gathering
- Information synthesis
- Report generation

### 2. Data Processing
- ETL pipelines
- Data transformation
- Batch processing
- Workflow orchestration

### 3. Complex Calculations
- Multi-step computations
- Financial analysis
- Scientific calculations
- Statistical analysis

### 4. Content Generation
- Structured writing
- Report creation
- Documentation generation
- Multi-part content

### 5. Task Automation
- Workflow automation
- Process orchestration
- Batch operations
- Scheduled tasks

## Best Practices

1. **Clear Planning Prompts**: Guide the planner to create actionable steps
2. **Appropriate Step Count**: 3-10 steps is typically optimal
3. **Tool Granularity**: Tools should match plan step granularity
4. **Dependency Management**: Clearly define step dependencies
5. **Error Handling**: Tools should handle errors gracefully
6. **Parallel Execution**: Use for independent steps to improve performance
7. **Replanning**: Enable for adaptive workflows

## Troubleshooting

### Plan is too vague
- Improve planner system prompt
- Provide examples of good plans
- Reduce maxSteps to force specificity
- Include tool descriptions in planning

### Steps fail during execution
- Add error handling in tools
- Enable replanning
- Increase step timeout
- Validate inputs before execution

### Execution is slow
- Enable parallel execution
- Reduce number of steps
- Optimize tool performance
- Use caching where appropriate

### Plan doesn't match tools
- Include tool descriptions in planning
- Improve tool descriptions
- Add examples to planner prompt
- Use tool-aware planning

## Learn More

- [Plan-Execute Pattern Documentation](../../docs/plan-execute-pattern.md)
- [API Reference](../../src/plan-execute/README.md)
- [Test Examples](../../tests/plan-execute/)

## Contributing

Have a great example? Submit a PR with:
- Clear use case description
- Well-commented code
- Usage instructions
- Expected output example

