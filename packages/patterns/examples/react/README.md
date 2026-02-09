# ReAct Pattern Examples

This directory contains comprehensive examples demonstrating the ReAct (Reasoning and Action) pattern implementation in `@agentforge/patterns`.

## What is the ReAct Pattern?

The ReAct pattern is an agentic workflow that combines reasoning and action in an iterative loop:
1. **Think** - Reason about what to do next
2. **Act** - Execute a tool or provide a final answer
3. **Observe** - Examine the tool's result
4. **Repeat** - Continue until the task is complete

This pattern is particularly useful when you need transparent, step-by-step problem-solving with tool usage.

## Examples Overview

### 01-basic-react.ts
**Basic usage of the ReAct pattern**

Demonstrates:
- Creating a simple ReAct agent
- Using basic tools (calculator, weather)
- Viewing thoughts, actions, and observations
- Understanding the reasoning loop

**Use case**: Simple queries requiring one or two tool calls

```bash
npx tsx packages/patterns/examples/react/01-basic-react.ts
```

### 02-multi-step-reasoning.ts
**Complex queries with multiple reasoning steps**

Demonstrates:
- Multi-step problem solving
- Chaining multiple tool calls
- Complex travel planning scenario
- Dependency management between steps

**Use case**: Complex tasks requiring multiple data sources and calculations

```bash
npx tsx packages/patterns/examples/react/02-multi-step-reasoning.ts
```

### 03-tool-chaining.ts
**Tool chaining and data flow**

Demonstrates:
- Sequential tool execution
- Data transformation pipelines
- Output of one tool as input to another
- Building complex workflows from simple tools

**Use case**: Data processing pipelines, API composition

```bash
npx tsx packages/patterns/examples/react/03-tool-chaining.ts
```

### 04-custom-workflow.ts
**Building custom ReAct workflows**

Demonstrates:
- Using individual node creators
- Custom routing logic
- Adding custom nodes (validation)
- Custom stop conditions
- Fine-grained control over the loop

**Use case**: Advanced workflows, custom integrations, specialized requirements

```bash
npx tsx packages/patterns/examples/react/04-custom-workflow.ts
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
npx tsx packages/patterns/examples/react/01-basic-react.ts
```

### Run all examples:
```bash
for file in packages/patterns/examples/react/*.ts; do
  echo "Running $file..."
  npx tsx "$file"
  echo ""
done
```

## Key Concepts

### ReAct Loop
The core of the pattern is the thought-action-observation loop:

```typescript
while (!done) {
  // 1. THINK: Reason about what to do
  const thought = await reasoning(state);
  
  // 2. ACT: Execute a tool or respond
  const action = await executeAction(thought);
  
  // 3. OBSERVE: Process the result
  const observation = await observe(action);
  
  // 4. Update state and check if done
  state = update(state, thought, action, observation);
  done = checkCompletion(state);
}
```

### Configuration Options

#### Basic Configuration
```typescript
const agent = createReActAgent({
  model: ChatOpenAI,            // LLM instance
  tools: ToolRegistry | Tool[], // Available tools
  systemPrompt: string,         // System prompt
  maxIterations: number,        // Max iterations (default: 10)
  returnIntermediateSteps: boolean, // Return thoughts/actions (default: false)
});
```

#### Advanced Options
```typescript
const agent = createReActAgent(
  {
    llm,
    tools,
    stopCondition: (state) => {
      // Custom stop logic
      return state.iteration > 5 && hasAnswer(state);
    },
  },
  {
    verbose: true,              // Enable logging
    nodeNames: {                // Custom node names
      reasoning: 'think',
      action: 'act',
      observation: 'observe',
    },
  }
);
```

### Tool Definition

Tools follow the standard `@agentforge/core` format:

```typescript
const myTool = {
  name: 'tool_name',
  description: 'What the tool does',
  schema: z.object({
    param: z.string().describe('Parameter description'),
  }),
  invoke: async ({ param }) => {
    // Tool implementation
    return { result: 'value' };
  },
};
```

## Common Use Cases

### 1. Question Answering
- Factual queries
- Research tasks
- Information retrieval
- Data lookup

### 2. Calculations
- Math problems
- Financial calculations
- Unit conversions
- Statistical analysis

### 3. Data Processing
- API calls
- Data transformation
- Format conversion
- Aggregation

### 4. Multi-Step Tasks
- Travel planning
- Research synthesis
- Complex workflows
- Decision trees

### 5. Tool Composition
- Chaining APIs
- Data pipelines
- Sequential processing
- Workflow automation

## Best Practices

1. **Clear Tool Descriptions**: Make tool descriptions specific and actionable
2. **Appropriate Max Iterations**: Set based on task complexity (5-15 typical)
3. **System Prompt Design**: Guide the agent's reasoning style
4. **Tool Granularity**: Keep tools focused on single responsibilities
5. **Error Handling**: Tools should handle errors gracefully
6. **Return Intermediate Steps**: Enable for debugging and transparency

## Troubleshooting

### Agent loops without completing
- Check if tools return clear results
- Verify system prompt guides toward completion
- Reduce max iterations to force termination
- Add custom stop condition

### Tools not being called
- Ensure tool descriptions are clear
- Check tool schema matches expected inputs
- Verify tools are registered correctly
- Review system prompt for tool usage guidance

### Poor reasoning quality
- Improve system prompt specificity
- Use lower temperature (0-0.3)
- Provide examples in system prompt
- Use more capable LLM (GPT-4 vs GPT-3.5)

### Too many iterations
- Set appropriate max iterations
- Add stop conditions
- Simplify the task
- Improve tool descriptions

## Learn More

- [ReAct Pattern Documentation](../../docs/react-pattern.md)
- [API Reference](../../src/react/README.md)
- [Test Examples](../../tests/react/)
- [Original ReAct Paper](https://arxiv.org/abs/2210.03629)

## Contributing

Have a great example? Submit a PR with:
- Clear use case description
- Well-commented code
- Usage instructions
- Expected output example

