# Agent Pattern Comparison Guide

This guide helps you choose the right pattern for your use case.

## Quick Decision Tree

```
Do you need multiple specialized agents?
├─ YES → Use Multi-Agent
└─ NO → Is your task well-defined with clear steps?
   ├─ YES → Can you plan upfront?
   │  ├─ YES → Use Plan-Execute
   │  └─ NO → Use ReAct
   └─ NO → Is it exploratory?
      ├─ YES → Use ReAct
      └─ NO → Need quality refinement?
         ├─ YES → Use Reflection
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

### Reflection

**Philosophy**: Generate, critique, revise, repeat

**Workflow**:
```
User Input → Generate → Reflect → Revise → (Repeat) → Finish
```

**Best for**:
- Quality-critical outputs
- Iterative improvement
- Self-critique
- Content creation

### Multi-Agent

**Philosophy**: Coordinate specialized agents

**Workflow**:
```
User Input → Supervisor → Worker(s) → Aggregator → Output
             ↓                ↓
        Routing Logic    Specialized
                         Execution
```

**Best for**:
- Specialized tasks
- Multiple expertise areas
- Customer support
- Complex coordination

## Detailed Comparison

### Architecture

| Aspect | ReAct | Plan-Execute | Reflection | Multi-Agent |
|--------|-------|--------------|------------|-------------|
| **Planning** | Dynamic, iterative | Upfront, structured | None | Routing-based |
| **Execution** | Opportunistic | Systematic | Iterative | Coordinated |
| **Adaptation** | Every iteration | Via replanning | Via revision | Via routing |
| **Structure** | Flexible loop | Fixed phases | Feedback loop | Hierarchical |
| **Transparency** | Reasoning visible | Plan visible | Critiques visible | Routing visible |
| **Coordination** | None | Low | None | High |

### Performance

| Aspect | ReAct | Plan-Execute | Reflection | Multi-Agent |
|--------|-------|--------------|------------|-------------|
| **Speed** | Sequential | Can parallelize | Slow (iterations) | Varies |
| **Efficiency** | May explore | Follows plan | Focused on quality | Optimized routing |
| **Predictability** | Lower | Higher | Medium | Medium |
| **Overhead** | Per iteration | Upfront planning | Per reflection | Coordination |
| **Latency** | Low | Medium | High | High |

### Use Cases

| Use Case | ReAct | Plan-Execute | Reflection | Multi-Agent |
|----------|-------|--------------|------------|-------------|
| **Research** | ✅ Good | ✅ Excellent | ⚠️ Possible | ✅ Excellent |
| **Data Pipeline** | ⚠️ Possible | ✅ Excellent | ❌ Poor | ✅ Good |
| **Q&A** | ✅ Excellent | ⚠️ Overkill | ❌ Overkill | ⚠️ Possible |
| **Complex Workflow** | ⚠️ Possible | ✅ Excellent | ❌ Poor | ✅ Excellent |
| **Exploration** | ✅ Excellent | ❌ Poor | ❌ Poor | ⚠️ Possible |
| **Debugging** | ✅ Good | ⚠️ Possible | ⚠️ Possible | ✅ Good |
| **Content Creation** | ⚠️ Possible | ❌ Poor | ✅ Excellent | ⚠️ Possible |
| **Customer Support** | ✅ Good | ⚠️ Possible | ❌ Poor | ✅ Excellent |
| **Specialized Tasks** | ⚠️ Possible | ⚠️ Possible | ❌ Poor | ✅ Excellent |

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

#### Reflection

**Strengths**:
- ✅ High-quality outputs
- ✅ Self-improving
- ✅ Catches errors
- ✅ Iterative refinement
- ✅ Quality-focused

**Weaknesses**:
- ❌ Slow (multiple iterations)
- ❌ Higher LLM costs
- ❌ May over-refine
- ❌ Not for time-critical tasks
- ❌ Requires good critique

#### Multi-Agent

**Strengths**:
- ✅ Specialized expertise
- ✅ Can parallelize workers
- ✅ Flexible routing
- ✅ Scalable coordination
- ✅ Clear separation of concerns

**Weaknesses**:
- ❌ High complexity
- ❌ Coordination overhead
- ❌ Higher latency
- ❌ Requires multiple LLMs
- ❌ Routing can fail

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
     planner: { model: llm, maxSteps: 7 },
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

### Use Reflection When:

1. **Quality is critical**
   ```typescript
   // Example: "Write a professional email to a client"
   const agent = createReflectionAgent({
     generator: { model: llm, systemPrompt: 'Write professional emails' },
     reflector: { model: llm, systemPrompt: 'Critique for professionalism' },
     reviser: { model: llm, systemPrompt: 'Revise based on feedback' },
     maxIterations: 3,
   });
   ```

2. **Need iterative improvement**
   ```typescript
   // Example: "Create a marketing copy"
   // Agent generates, critiques, and revises
   ```

3. **Self-critique is valuable**
   ```typescript
   // Example: "Write code and review it"
   // Agent can catch its own mistakes
   ```

4. **Content creation**
   ```typescript
   // Example: "Write a blog post"
   // Multiple revisions improve quality
   ```

### Use Multi-Agent When:

1. **Need specialized expertise**
   ```typescript
   // Example: "Handle customer support across technical and billing"
   const system = createMultiAgentSystem({
     supervisor: { model: llm, strategy: 'llm-based' },
     workers: [],
     aggregator: { model: llm },
   });

   registerWorkers(system, [
     {
       name: 'tech_support',
       capabilities: {
         skills: ['technical', 'troubleshooting'],
         tools: ['diagnostic'],
         available: true,
       },
       model: llm,
       tools: [diagnosticTool],
     },
     {
       name: 'billing_support',
       capabilities: {
         skills: ['billing', 'payments'],
         tools: ['account'],
         available: true,
       },
       model: llm,
       tools: [accountTool],
     },
   ]);
   ```

2. **Multiple distinct tasks**
   ```typescript
   // Example: "Research, analyze, and write report"
   // Each phase needs different expertise
   ```

3. **Parallel specialized execution**
   ```typescript
   // Example: "Process data with validation, enrichment, and analysis"
   // Different workers handle different aspects
   ```

4. **Complex coordination**
   ```typescript
   // Example: "Customer support with routing to specialists"
   // Supervisor routes to appropriate worker
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
  planner: { model: llm, maxSteps: 5 },
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
  planner: { model: llm, maxSteps: 5 },
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
  planner: { model: llm, maxSteps: 8 },
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

### Example 4: Customer Support

**Task**: "Handle customer inquiry about billing and technical issues"

**ReAct Approach**:
```typescript
const agent = new ReActAgentBuilder()
  .withLLM(llm)
  .withTools([checkAccountTool, diagnosticTool, createTicketTool])
  .build();

// Agent will:
// 1. Think: "Customer has billing and technical issues"
// 2. Act: CheckAccount()
// 3. Observe: [account info]
// 4. Think: "Now check technical issue"
// 5. Act: RunDiagnostic()
// ... handles both sequentially
```

**Multi-Agent Approach**:
```typescript
const system = createMultiAgentSystem({
  supervisor: { model: llm, strategy: 'llm-based' },
  workers: [],
  aggregator: { model: llm },
});

registerWorkers(system, [
  {
    name: 'billing_support',
    capabilities: {
      skills: ['billing', 'payments'],
      tools: ['checkAccount', 'processRefund'],
      available: true,
    },
    model: llm,
    tools: [checkAccountTool, processRefundTool],
  },
  {
    name: 'tech_support',
    capabilities: {
      skills: ['technical', 'troubleshooting'],
      tools: ['diagnostic', 'troubleshoot'],
      available: true,
    },
    model: llm,
    tools: [diagnosticTool, troubleshootTool],
  },
]);

// System will:
// 1. Supervisor analyzes inquiry
// 2. Routes billing aspect to billing_support
// 3. Routes technical aspect to tech_support
// 4. Aggregator combines both responses
```

**Recommendation**: **Multi-Agent** - Requires specialized expertise, can handle both aspects in parallel

### Example 5: Content Creation

**Task**: "Write a professional blog post about AI"

**ReAct Approach**:
```typescript
const agent = new ReActAgentBuilder()
  .withLLM(llm)
  .withTools([researchTool, writeTool])
  .build();

// Agent will:
// 1. Think: "I should research AI topics"
// 2. Act: Research("AI trends")
// 3. Observe: [findings]
// 4. Think: "Now I'll write the post"
// 5. Act: Write(content)
// ... single iteration
```

**Reflection Approach**:
```typescript
const agent = createReflectionAgent({
  generator: {
    llm,
    systemPrompt: 'Write engaging blog posts',
  },
  reflector: {
    llm,
    systemPrompt: 'Critique for clarity, engagement, and professionalism',
  },
  maxIterations: 3,
});

// Agent will:
// 1. Generate initial blog post
// 2. Reflect: "The introduction is weak, examples needed"
// 3. Revise: Improve introduction, add examples
// 4. Reflect: "Better, but conclusion could be stronger"
// 5. Revise: Strengthen conclusion
// ... iterative improvement
```

**Recommendation**: **Reflection** - Quality-critical content, benefits from iterative refinement

## Combining Patterns

You can combine patterns for complex tasks:

### Plan-Execute + ReAct

Use Plan-Execute for overall structure, ReAct for complex steps:

```typescript
const planExecuteAgent = createPlanExecuteAgent({
  planner: { model: llm, maxSteps: 5 },
  executor: {
    tools: [
      // Some steps use ReAct internally
      complexResearchTool, // Uses ReAct
      simpleTransformTool,
    ],
  },
});
```

### Plan-Execute + Reflection

Use Plan-Execute for execution, Reflection for quality:

```typescript
// 1. Execute plan
const executionResult = await planExecuteAgent.invoke({ input: query });

// 2. Refine with reflection
const refinedResult = await reflectionAgent.invoke({
  messages: [new HumanMessage(executionResult.response)],
});
```

### Multi-Agent + ReAct

Use Multi-Agent for coordination, ReAct for worker execution:

```typescript
const system = createMultiAgentSystem({
  supervisor: { model: llm, strategy: 'skill-based' },
  workers: [],
  aggregator: { model: llm },
});

registerWorkers(system, [
  {
    name: 'researcher',
    capabilities: ['research'],
    tools: [searchTool], // Worker uses ReAct internally
  },
  {
    name: 'analyst',
    capabilities: ['analysis'],
    tools: [analyzeTool], // Worker uses ReAct internally
  },
]);
```

### Multi-Agent + Reflection

Use Multi-Agent for specialized generation, Reflection for quality:

```typescript
// 1. Multi-agent generates content
const generationResult = await multiAgentSystem.invoke({ input: query });

// 2. Reflection refines the output
const refinedResult = await reflectionAgent.invoke({
  messages: [new HumanMessage(generationResult.response)],
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
  planner: { model: llm, maxSteps: 5 },
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
  planner: { model: llm, maxSteps: 5 },
  executor: { tools },
  replanner: { model: llm, replanThreshold: 0.3 }, // Replanning often
});

// After (ReAct)
const agent = new ReActAgentBuilder()
  .withLLM(llm)
  .withTools(tools)
  .build();
```

### To Multi-Agent

If your task requires:
- Multiple specialized capabilities
- Coordination between different expertise areas
- Routing to appropriate specialists

Consider using Multi-Agent:

```typescript
// Before (ReAct with many tools)
const agent = new ReActAgentBuilder()
  .withLLM(llm)
  .withTools([
    techTool1, techTool2,
    billingTool1, billingTool2,
    generalTool1, generalTool2,
  ])
  .build();

// After (Multi-Agent with specialized workers)
const system = createMultiAgentSystem({
  supervisor: { model: llm, strategy: 'skill-based' },
  workers: [],
  aggregator: { model: llm },
});

registerWorkers(system, [
  {
    name: 'tech_support',
    capabilities: ['technical'],
    tools: [techTool1, techTool2],
  },
  {
    name: 'billing_support',
    capabilities: ['billing'],
    tools: [billingTool1, billingTool2],
  },
  {
    name: 'general_support',
    capabilities: ['general'],
    tools: [generalTool1, generalTool2],
  },
]);
```

### To Reflection

If your output quality needs improvement:
- Content creation tasks
- Quality-critical outputs
- Iterative refinement needed

Consider using Reflection:

```typescript
// Before (ReAct single-pass)
const agent = new ReActAgentBuilder()
  .withLLM(llm)
  .withTools([writeTool])
  .build();

// After (Reflection with iterative improvement)
const agent = createReflectionAgent({
  generator: {
    llm,
    systemPrompt: 'Generate high-quality content',
  },
  reflector: {
    llm,
    systemPrompt: 'Critique and suggest improvements',
  },
  maxIterations: 3,
});
```

## Summary

| Pattern | Best For | Key Strength | Main Limitation |
|---------|----------|--------------|-----------------|
| **ReAct** | Exploration, flexibility | Dynamic adaptation | Sequential only |
| **Plan-Execute** | Structured workflows | Parallel execution | Requires planning |
| **Reflection** | Quality-critical outputs | Iterative improvement | Slow, expensive |
| **Multi-Agent** | Specialized tasks | Coordinated expertise | High complexity |

### Quick Selection Guide

| Choose... | When you need... |
|-----------|------------------|
| **ReAct** | Exploration, flexibility, transparency |
| **Plan-Execute** | Structure, efficiency, parallel execution |
| **Reflection** | Quality, refinement, self-critique |
| **Multi-Agent** | Specialization, coordination, routing |

## Resources

- [ReAct Pattern Guide](./react-agent-guide.md)
- [Plan-Execute Pattern Guide](./plan-execute-pattern.md)
- [Reflection Pattern Guide](./reflection-pattern.md)
- [Multi-Agent Pattern Guide](./multi-agent-pattern.md)
- [ReAct Examples](../examples/react/)
- [Plan-Execute Examples](../examples/plan-execute/)
- [Reflection Examples](../examples/reflection/)
- [Multi-Agent Examples](../examples/multi-agent/)

