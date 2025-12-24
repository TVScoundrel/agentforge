# @agentforge/patterns

Agent patterns (ReAct, Planner-Executor) for the AgentForge framework.

## Status

🚧 **Phase 3 In Progress** - ReAct Pattern Complete

**65 tests passing** | **Full TypeScript support** | **Comprehensive documentation**

## Features

### ✅ ReAct Pattern (Phase 3.1)

The ReAct (Reasoning and Action) pattern implements a thought-action-observation loop where the agent:
1. **Thinks** about what to do next
2. **Acts** by calling a tool or responding
3. **Observes** the result
4. **Repeats** until the task is complete

**Components**:
- **State Management** - Type-safe state with Zod schemas (10 tests)
- **Node Implementations** - Reasoning, action, and observation nodes (9 tests)
- **Agent Factory** - `createReActAgent()` function (10 tests)
- **Fluent Builder** - `ReActAgentBuilder` with method chaining (19 tests)
- **Integration Tests** - End-to-end scenarios (7 tests)

### 📋 Coming Soon

**Phase 3.2: Plan-Execute Pattern**
- Planning phase with task decomposition
- Execution phase with step-by-step execution
- Re-planning based on results

**Phase 3.3: Reflection Pattern**
- Self-critique and improvement
- Iterative refinement
- Quality assessment

**Phase 3.4: Multi-Agent Pattern**
- Agent coordination
- Task delegation
- Collaborative problem solving

## Installation

```bash
pnpm add @agentforge/patterns @agentforge/core
```

## Quick Start

### ReAct Agent

```typescript
import { ReActAgentBuilder } from '@agentforge/patterns';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

// Create a tool
const calculatorTool = toolBuilder()
  .name('calculator')
  .description('Perform arithmetic operations')
  .category(ToolCategory.UTILITY)
  .schema(
    z.object({
      operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
      a: z.number(),
      b: z.number(),
    })
  )
  .implement(async ({ operation, a, b }) => {
    switch (operation) {
      case 'add': return a + b;
      case 'subtract': return a - b;
      case 'multiply': return a * b;
      case 'divide': return a / b;
    }
  })
  .build();

// Create the agent
const agent = new ReActAgentBuilder()
  .withLLM(new ChatOpenAI({ model: 'gpt-4' }))
  .withTools([calculatorTool])
  .withMaxIterations(10)
  .build();

// Use the agent
const result = await agent.invoke({
  messages: [{ role: 'user', content: 'What is 15 * 7?' }],
});

console.log(result.response); // "The result is 105"
```

## Documentation

- [ReAct Agent Guide](./docs/react-agent-guide.md) - Comprehensive usage guide
- [Phase 3.1 Summary](./docs/phase-3.1.4-summary.md) - Implementation details

## API Reference

### ReAct Pattern

```typescript
import {
  ReActAgentBuilder,
  createReActAgent,
  createReActAgentBuilder,
} from '@agentforge/patterns';
```

**Builder API**:
- `withLLM(llm)` - Set the language model (required)
- `withTools(tools)` - Set tools array or registry (required)
- `withSystemPrompt(prompt)` - Set system prompt (optional)
- `withMaxIterations(max)` - Set max iterations (optional, default: 10)
- `withReturnIntermediateSteps(value)` - Include reasoning steps (optional)
- `withStopCondition(fn)` - Custom termination logic (optional)
- `withVerbose(value)` - Enable verbose logging (optional)
- `withNodeNames(names)` - Customize node names (optional)
- `build()` - Build the agent

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm typecheck
```

## License

MIT

