# ReAct Agent Integration for Multi-Agent Pattern

## Goal
Enable Multi-Agent pattern to automatically detect and integrate ReAct agents without requiring manual wrapper functions.

## Current State

### Problem
When using ReAct agents as workers in the Multi-Agent pattern, users must manually wrap them:

```typescript
// Current workaround (verbose and error-prone)
workers: [
  {
    id: "hr",
    capabilities: hrAgentMetadata,
    executeFn: async (state: MultiAgentStateType) => {
      const task = state.messages[state.messages.length - 1]?.content || state.input;
      const result: any = await hrAgent.invoke({
        messages: [{ role: "user", content: task }],
      });
      return {
        completedTasks: [{
          assignmentId: state.activeAssignments[0]?.id || "unknown",
          workerId: "hr",
          result: result.messages?.[result.messages.length - 1]?.content || "No response",
          completedAt: Date.now(),
          success: true,
        }],
      };
    }
  }
]
```

### Why This Happens
- **Multi-Agent workers** expect: `(state: MultiAgentStateType) => Promise<Partial<MultiAgentStateType>>`
- **ReAct agents** use: `.invoke({ messages: [...] })` and return `{ messages: [...] }`
- Different state shapes and interfaces

## Proposed Solution

### Option 1: Automatic Detection (RECOMMENDED)

Enhance `WorkerConfig` to accept either:
1. `executeFn` (current approach - function-based workers)
2. `agent` (new approach - ReAct agent instances)

The Multi-Agent pattern will automatically detect ReAct agents and wrap them.

### Implementation Plan

#### 1. Update `WorkerConfig` Type
**File**: `packages/patterns/src/multi-agent/types.ts`

```typescript
export interface WorkerConfig {
  id: string;
  capabilities: WorkerCapabilities;
  
  // Option 1: Custom execution function (existing)
  executeFn?: (state: MultiAgentStateType) => Promise<Partial<MultiAgentStateType>>;
  
  // Option 2: ReAct agent instance (NEW)
  agent?: CompiledStateGraph<any, any>;
  
  // Optional: LLM and tools (for non-ReAct workers)
  model?: BaseChatModel;
  tools?: Tool[];
  systemPrompt?: string;
  verbose?: boolean;
}
```

#### 2. Create ReAct Agent Detection Utility
**File**: `packages/patterns/src/multi-agent/utils.ts` (new file)

```typescript
/**
 * Check if an object is a ReAct agent (CompiledStateGraph)
 */
export function isReActAgent(obj: any): boolean {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.invoke === 'function' &&
    typeof obj.stream === 'function'
  );
}

/**
 * Wrap a ReAct agent to work as a Multi-Agent worker
 */
export function wrapReActAgent(
  workerId: string,
  agent: CompiledStateGraph<any, any>
): (state: MultiAgentStateType) => Promise<Partial<MultiAgentStateType>> {
  return async (state: MultiAgentStateType) => {
    // Extract task from state
    const task = state.messages[state.messages.length - 1]?.content || state.input;
    
    // Find current assignment
    const currentAssignment = state.activeAssignments.find(
      assignment => assignment.workerId === workerId
    );
    
    // Invoke ReAct agent
    const result: any = await agent.invoke({
      messages: [{ role: "user", content: task }],
    });
    
    // Extract response from ReAct agent's messages
    const response = result.messages?.[result.messages.length - 1]?.content || "No response";
    
    // Return in Multi-Agent format
    return {
      completedTasks: [{
        assignmentId: currentAssignment?.id || "unknown",
        workerId,
        result: response,
        completedAt: Date.now(),
        success: true,
      }],
    };
  };
}
```

#### 3. Update `createWorkerNode` Function
**File**: `packages/patterns/src/multi-agent/nodes.ts`

Modify the worker node creation to detect and wrap ReAct agents:

```typescript
export function createWorkerNode(config: WorkerConfig) {
  const { id, agent, executeFn, ... } = config;
  
  return async (state: MultiAgentStateType): Promise<Partial<MultiAgentStateType>> => {
    // ... existing code ...
    
    // Priority 1: Use custom executeFn if provided
    if (executeFn) {
      return await executeFn(state);
    }
    
    // Priority 2: Use ReAct agent if provided (NEW)
    if (agent && isReActAgent(agent)) {
      const wrappedFn = wrapReActAgent(id, agent);
      return await wrappedFn(state);
    }
    
    // Priority 3: Use default LLM-based execution (existing)
    // ... existing default implementation ...
  };
}
```

## Benefits

✅ **No breaking changes** - existing code continues to work
✅ **Automatic detection** - no manual wrapping needed
✅ **Type-safe** - full TypeScript support
✅ **Cleaner API** - more intuitive for users
✅ **Flexible** - supports both function workers and ReAct agents

## Usage After Implementation

```typescript
// Clean and simple!
const system = createMultiAgentSystem({
  supervisor: { ... },
  workers: [
    {
      id: "hr",
      capabilities: hrAgentMetadata,
      agent: hrAgent,  // Just pass the agent directly!
    },
    {
      id: "security",
      capabilities: securityAgentMetadata,
      agent: securityAgent,
    }
  ],
  aggregator: { ... }
});
```

## Complexity Assessment

**Difficulty**: 🟢 LOW
**Estimated Time**: 30-45 minutes
**Risk**: 🟢 LOW (no breaking changes)

### Why It's Simple
1. Only 3 files to modify
2. Backward compatible (no breaking changes)
3. Clear detection logic (check for `.invoke()` method)
4. Wrapper function is straightforward
5. No changes to state management or routing

## Testing Plan

1. Update existing Multi-Agent tests to use both approaches
2. Add specific tests for ReAct agent detection
3. Test error handling for invalid agents
4. Verify backward compatibility with function-based workers

