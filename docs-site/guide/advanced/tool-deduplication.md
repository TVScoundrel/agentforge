# Tool Call Deduplication

**Tool call deduplication** is a framework-level feature that prevents agents from calling the same tool with identical parameters multiple times during a single execution. This optimization improves efficiency, reduces costs, and prevents unnecessary API calls.

## Overview

When agents iterate through reasoning loops, they sometimes attempt to call the same tool with the same arguments multiple times. This can happen when:

- The agent doesn't effectively use previous observations
- Empty or null results trigger retry loops
- The LLM forgets what it already tried
- Complex multi-step tasks cause repeated searches

Deduplication automatically detects and prevents these duplicate calls by caching tool results and returning cached responses when duplicates are detected.

## Benefits

✅ **Reduced API Costs** - Avoid paying for duplicate tool calls  
✅ **Faster Execution** - Skip redundant operations  
✅ **Better Resource Usage** - Prevent unnecessary load on external services  
✅ **Automatic** - Works out-of-the-box with no code changes  
✅ **Transparent** - Agents receive the same results as if the tool was called  

## How It Works

### 1. Cache Key Generation

Each tool call is identified by a unique cache key:

```typescript
function generateCacheKey(toolName: string, args: any): string {
  const sortedArgs = JSON.stringify(args, Object.keys(args).sort());
  return `${toolName}:${sortedArgs}`;
}
```

**Example cache keys:**
- `search-confluence:{"query":"quantum encryption"}`
- `get-github-commits:{"owner":"acme","repo":"core-api"}`
- `calculator:{"a":5,"b":3,"operation":"add"}`

### 2. Execution Cache

The framework maintains a cache of previously executed tool calls:

```typescript
// ReAct Pattern: Built from actions and observations
const executionCache = new Map<string, ToolResult>();

// Plan-Execute Pattern: Built from pastSteps
const executionCache = new Map<string, CompletedStep>();
```

### 3. Duplicate Detection

Before executing a tool, the framework:
1. Generates a cache key for the current tool call
2. Checks if this key exists in the execution cache
3. If found, returns the cached result instead of executing
4. If not found, executes the tool and caches the result

## Pattern Support

| Pattern | Deduplication | Status |
|---------|--------------|--------|
| **ReAct** | ✅ Enabled | Action node |
| **Plan-Execute** | ✅ Enabled | Executor node |
| **Multi-Agent** | ✅ Inherited | Via ReAct workers |
| **Reflection** | ❌ N/A | No tool execution |

## Configuration

### ReAct Pattern

```typescript
import { createReActAgent } from '@agentforge/patterns';

const agent = createReActAgent({
  model,
  tools: [searchTool, calculatorTool],
  
  // Deduplication is enabled by default
  enableDeduplication: true  // Optional: set to false to disable
});
```

### Plan-Execute Pattern

```typescript
import { createPlanExecuteAgent } from '@agentforge/patterns';

const agent = createPlanExecuteAgent({
  planner: { model, maxSteps: 5 },
  executor: {
    tools: [searchTool, apiTool],
    
    // Deduplication is enabled by default
    enableDeduplication: true  // Optional: set to false to disable
  }
});
```

### Multi-Agent Pattern

Deduplication is automatically inherited by worker agents:

```typescript
import { createMultiAgentSystem } from '@agentforge/patterns';

const system = createMultiAgentSystem({
  supervisor: { model, strategy: 'llm-based' },
  workers: [
    {
      id: 'researcher',
      capabilities: {
        skills: ['research', 'search'],
        tools: ['web-search'],  // Real tool from @agentforge/tools
        available: true,
        currentWorkload: 0
      },
      agent: createReActAgent({
        model,
        tools: [webSearch],  // Use webSearch from @agentforge/tools
        // Deduplication enabled automatically
      })
    }
  ],
  aggregator: { model }
});
```

## Logging and Monitoring

Deduplication events are logged using the AgentForge logger:

```typescript
// Set log level to see deduplication in action
process.env.LOG_LEVEL = 'info';  // or 'debug' for more detail
```

### Log Output Examples

**Duplicate detected:**
```
[INFO] [agentforge:patterns:react] Duplicate tool call prevented {
  toolName: 'search-confluence',
  arguments: { query: 'quantum encryption' },
  iteration: 3,
  cacheHit: true
}
```

**Summary with metrics:**
```
[INFO] [agentforge:patterns:react] Action node complete {
  iteration: 3,
  toolsExecuted: 2,
  duplicatesSkipped: 1,
  totalObservations: 3,
  deduplicationSavings: '33%'
}
```

## Real-World Example

### Problem: Confluence Agent Retry Loop

**Before deduplication:**
```
Iteration 1: search-confluence("quantum encryption") → No results
Iteration 2: search-confluence("quantum encryption") → No results (duplicate!)
Iteration 3: search-confluence("quantum encryption") → No results (duplicate!)
Iteration 4: search-confluence("quantum encryption") → No results (duplicate!)
Iteration 5: Max iterations reached

Total searches: 13
Execution time: 202s
```

**After deduplication:**
```
Iteration 1: search-confluence("quantum encryption") → No results
Iteration 2: search-confluence("quantum encryption") → Cached (duplicate prevented)
Iteration 3: Different approach taken

Total searches: 3
Execution time: 138s
Improvement: 77% fewer calls, 32% faster
```

## Advanced Usage

### Disabling Deduplication

In rare cases, you may want to disable deduplication:

```typescript
const agent = createReActAgent({
  model,
  tools: [timestampTool, randomNumberTool],
  
  // Disable if tools should return different results each time
  enableDeduplication: false
});
```

::: warning When to Disable
Only disable deduplication for tools that are:
- **Non-deterministic** - Return different results for same inputs
- **Time-sensitive** - Results change based on when they're called
- **Stateful** - Have side effects that must execute every time
:::

### Custom Tool Behavior

If a specific tool should never be cached, handle it in the tool itself:

```typescript
const timestampTool = {
  metadata: {
    name: 'get-timestamp',
    description: 'Get current timestamp'
  },
  execute: async () => {
    // This will be cached by deduplication, but returns current time
    // Consider disabling deduplication for the entire agent if needed
    return Date.now();
  }
};
```

## Performance Impact

### Metrics from Real Tests

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Tool calls | 13 | 3 | **77% reduction** |
| Duplicates | 10 | 0 | **100% elimination** |
| Execution time | 202s | 138s | **32% faster** |
| Iterations used | 5/5 | 2/5 | **60% fewer** |

### Token Savings

Deduplication also reduces token usage:
- Fewer tool call requests to LLM
- Fewer observation results in context
- Shorter conversation history

## Best Practices

1. **Keep deduplication enabled** - It's beneficial for most use cases
2. **Monitor logs** - Use `LOG_LEVEL=info` to track deduplication savings
3. **Design deterministic tools** - Tools should return consistent results for same inputs
4. **Handle empty results** - Ensure agents don't retry on empty/null results
5. **Use appropriate prompts** - Guide agents to try different approaches instead of retrying

## Troubleshooting

### Deduplication Not Working

**Check configuration:**
```typescript
// Make sure it's enabled
const agent = createReActAgent({
  model,
  tools,
  enableDeduplication: true  // Should be true (default)
});
```

**Check logs:**
```bash
LOG_LEVEL=debug node your-agent.js
```

Look for messages like:
- `Deduplication cache built`
- `Duplicate tool call prevented`

### Tool Should Execute Every Time

If a tool needs to execute on every call:

```typescript
// Option 1: Disable deduplication for the agent
const agent = createReActAgent({
  model,
  tools: [alwaysExecuteTool],
  enableDeduplication: false
});

// Option 2: Make tool arguments unique
const tool = {
  execute: async (args) => {
    // Add timestamp to make each call unique
    const uniqueArgs = { ...args, _timestamp: Date.now() };
    return performAction(uniqueArgs);
  }
};
```

## Next Steps

- [ReAct Pattern](/guide/patterns/react) - Learn about the ReAct pattern
- [Plan-Execute Pattern](/guide/patterns/plan-execute) - Learn about Plan-Execute
- [Monitoring](/guide/advanced/monitoring) - Set up comprehensive monitoring
- [Performance Optimization](/guide/advanced/resources) - Other optimization techniques

## Further Reading

- [AgentForge Logger](/guide/concepts/logging) - Understanding the logging system
- [Tool Development](/tutorials/custom-tools) - Creating efficient tools
- [Production Deployment](/tutorials/production-deployment) - Deploying optimized agents

