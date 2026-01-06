# Agent Pattern Comparison Guide

This guide helps you choose the right pattern for your use case.

## Quick Decision Tree

```
Is your task well-defined with clear steps?
├─ YES → Can you plan upfront?
│  ├─ YES → Use Plan-Execute
│  └─ NO → Use ReAct
└─ NO → Is it exploratory?
   ├─ YES → Use ReAct
   └─ NO → Need quality refinement?
      ├─ YES → Use Reflection (coming soon)
      └─ NO → Use ReAct
```

## Pattern Overview

### ReAct (Reasoning and Action)

**Philosophy**: Think, act, observe, repeat

**Workflow**:
```
User Input → Reasoning → Action → Observation → Reasoning → ...
```

**Best for**:
- Exploratory tasks
- Unclear requirements
- Dynamic problem-solving
- Transparent reasoning

### Plan-Execute

**Philosophy**: Plan first, execute systematically

**Workflow**:
```
User Input → Plan → Execute Steps → (Replan if needed) → Finish
```

**Best for**:
- Well-defined tasks
- Multi-step workflows
- Parallel execution
- Structured processes

## Detailed Comparison

### Architecture

| Aspect | ReAct | Plan-Execute |
|--------|-------|--------------|
| **Planning** | Dynamic, iterative | Upfront, structured |
| **Execution** | Opportunistic | Systematic |
| **Adaptation** | Every iteration | Via replanning |
| **Structure** | Flexible loop | Fixed phases |
| **Transparency** | Reasoning visible | Plan visible |

### Performance

| Aspect | ReAct | Plan-Execute |
|--------|-------|--------------|
| **Speed** | Sequential | Can parallelize |
| **Efficiency** | May explore | Follows plan |
| **Predictability** | Lower | Higher |
| **Overhead** | Per iteration | Upfront planning |

### Use Cases

| Use Case | ReAct | Plan-Execute |
|----------|-------|--------------|
| **Research** | ✅ Good | ✅ Excellent |
| **Data Pipeline** | ⚠️ Possible | ✅ Excellent |
| **Q&A** | ✅ Excellent | ⚠️ Overkill |
| **Complex Workflow** | ⚠️ Possible | ✅ Excellent |
| **Exploration** | ✅ Excellent | ❌ Poor |
| **Debugging** | ✅ Good | ⚠️ Possible |

### Strengths & Weaknesses

#### ReAct

**Strengths**:
- ✅ Flexible and adaptive
- ✅ Transparent reasoning
- ✅ Good for exploration
- ✅ Handles uncertainty well
- ✅ Simple to understand

**Weaknesses**:
- ❌ Sequential execution only
- ❌ May be inefficient
- ❌ Less predictable
- ❌ Can get stuck in loops
- ❌ Harder to track progress

#### Plan-Execute

**Strengths**:
- ✅ Structured execution
- ✅ Can parallelize
- ✅ Predictable flow
- ✅ Easy to track progress
- ✅ Efficient for known tasks

**Weaknesses**:
- ❌ Requires upfront planning
- ❌ Less flexible
- ❌ May need replanning
- ❌ Overkill for simple tasks
- ❌ Depends on plan quality

## When to Use Each Pattern

### Use ReAct When:

1. **Task is exploratory**
   ```typescript
   // Example: "Find information about X and tell me something interesting"
   const agent = new ReActAgentBuilder()
     .withLLM(llm)
     .withTools([searchTool, analyzeTool])
     .build();
   ```

2. **Requirements are unclear**
   ```typescript
   // Example: "Help me debug this issue"
   // Agent needs to explore and adapt
   ```

3. **Need transparent reasoning**
   ```typescript
   // Example: "Explain your thinking as you solve this"
   // ReAct shows reasoning at each step
   ```

4. **Simple, interactive tasks**
   ```typescript
   // Example: "What's the weather in Paris?"
   // Overkill to plan this
   ```

### Use Plan-Execute When:

1. **Task is well-defined**
   ```typescript
   // Example: "Fetch data from 3 sources, validate, and create report"
   const agent = createPlanExecuteAgent({
     planner: { llm, maxSteps: 7 },
     executor: { tools, parallel: true },
   });
   ```

2. **Multi-step workflow**
   ```typescript
   // Example: ETL pipeline
   // Clear steps: Extract → Transform → Load
   ```

3. **Need parallel execution**
   ```typescript
   // Example: "Analyze data from multiple sources"
   // Independent steps can run in parallel
   ```

4. **Want structured progress**
   ```typescript
   // Example: "Process 100 records"
   // Clear plan makes progress trackable
   ```

## Real-World Examples

### Example 1: Research Task

**Task**: "Research AI developments in 2024 and create a summary"

**ReAct Approach**:
```typescript
const agent = new ReActAgentBuilder()
  .withLLM(llm)
  .withTools([searchTool, summarizeTool])
  .build();

// Agent will:
// 1. Think: "I should search for AI developments"
// 2. Act: Search("AI developments 2024")
// 3. Observe: [results]
// 4. Think: "I should search for more specific topics"
// 5. Act: Search("GPT-4 2024")
// ... continues iteratively
```

**Plan-Execute Approach**:
```typescript
const agent = createPlanExecuteAgent({
  planner: { llm, maxSteps: 5 },
  executor: { tools: [searchTool, summarizeTool], parallel: true },
});

// Agent will:
// 1. Plan:
//    - Search for AI developments
//    - Search for major releases
//    - Search for research papers
//    - Synthesize findings
//    - Create summary
// 2. Execute all searches in parallel
// 3. Synthesize and summarize
```

**Recommendation**: **Plan-Execute** - Task is well-defined, benefits from parallel searches

### Example 2: Debugging

**Task**: "Why is my API returning 500 errors?"

**ReAct Approach**:
```typescript
const agent = new ReActAgentBuilder()
  .withLLM(llm)
  .withTools([checkLogsTool, checkDatabaseTool, checkConfigTool])
  .build();

// Agent will:
// 1. Think: "I should check the logs first"
// 2. Act: CheckLogs()
// 3. Observe: [error messages]
// 4. Think: "The error mentions database, let me check that"
// 5. Act: CheckDatabase()
// ... adapts based on findings
```

**Plan-Execute Approach**:
```typescript
const agent = createPlanExecuteAgent({
  planner: { llm, maxSteps: 5 },
  executor: { tools: [checkLogsTool, checkDatabaseTool, checkConfigTool] },
});

// Agent will:
// 1. Plan:
//    - Check logs
//    - Check database
//    - Check config
//    - Analyze findings
// 2. Execute plan
// 3. May need to replan based on findings
```

**Recommendation**: **ReAct** - Exploratory task, needs to adapt based on findings

### Example 3: Data Pipeline

**Task**: "Extract data from 3 APIs, transform, validate, and load to database"

**ReAct Approach**:
```typescript
const agent = new ReActAgentBuilder()
  .withLLM(llm)
  .withTools([extractTool, transformTool, validateTool, loadTool])
  .build();

// Agent will:
// 1. Think: "I should extract from API 1"
// 2. Act: Extract(API1)
// 3. Observe: [data]
// 4. Think: "Now API 2"
// 5. Act: Extract(API2)
// ... sequential execution
```

**Plan-Execute Approach**:
```typescript
const agent = createPlanExecuteAgent({
  planner: { llm, maxSteps: 8 },
  executor: {
    tools: [extractTool, transformTool, validateTool, loadTool],
    parallel: true,
  },
});

// Agent will:
// 1. Plan:
//    - Extract from API 1 (parallel)
//    - Extract from API 2 (parallel)
//    - Extract from API 3 (parallel)
//    - Transform data
//    - Validate data
//    - Load to database
// 2. Execute extractions in parallel
// 3. Transform, validate, load sequentially
```

**Recommendation**: **Plan-Execute** - Well-defined workflow, benefits from parallel extraction

## Combining Patterns

You can combine patterns for complex tasks:

### Plan-Execute + ReAct

Use Plan-Execute for overall structure, ReAct for complex steps:

```typescript
const planExecuteAgent = createPlanExecuteAgent({
  planner: { llm, maxSteps: 5 },
  executor: {
    tools: [
      // Some steps use ReAct internally
      complexResearchTool, // Uses ReAct
      simpleTransformTool,
    ],
  },
});
```

### Plan-Execute + Reflection (Coming Soon)

Use Plan-Execute for execution, Reflection for quality:

```typescript
// 1. Execute plan
const executionResult = await planExecuteAgent.invoke({ input: query });

// 2. Refine with reflection
const refinedResult = await reflectionAgent.invoke({
  messages: [new HumanMessage(executionResult.response)],
});
```

## Migration Guide

### From ReAct to Plan-Execute

If you have a ReAct agent that:
- Follows predictable patterns
- Could benefit from parallelization
- Has clear, repeatable steps

Consider migrating to Plan-Execute:

```typescript
// Before (ReAct)
const agent = new ReActAgentBuilder()
  .withLLM(llm)
  .withTools([tool1, tool2, tool3])
  .build();

// After (Plan-Execute)
const agent = createPlanExecuteAgent({
  planner: { llm, maxSteps: 5 },
  executor: { tools: [tool1, tool2, tool3], parallel: true },
});
```

### From Plan-Execute to ReAct

If your Plan-Execute agent:
- Frequently needs replanning
- Has unpredictable requirements
- Struggles with upfront planning

Consider using ReAct:

```typescript
// Before (Plan-Execute)
const agent = createPlanExecuteAgent({
  planner: { llm, maxSteps: 5 },
  executor: { tools },
  replanner: { llm, replanThreshold: 0.3 }, // Replanning often
});

// After (ReAct)
const agent = new ReActAgentBuilder()
  .withLLM(llm)
  .withTools(tools)
  .build();
```

## Summary

| Choose ReAct for: | Choose Plan-Execute for: |
|-------------------|--------------------------|
| Exploration | Execution |
| Flexibility | Structure |
| Transparency | Efficiency |
| Uncertainty | Predictability |
| Simple tasks | Complex workflows |
| Dynamic adaptation | Parallel execution |

## Resources

- [ReAct Pattern Guide](./react-agent-guide.md)
- [Plan-Execute Pattern Guide](./plan-execute-pattern.md)
- [ReAct Examples](../examples/react/)
- [Plan-Execute Examples](../examples/plan-execute/)

