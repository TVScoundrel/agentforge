# AgentForge Logging Standards

**Version:** 1.0  
**Last Updated:** 2026-01-24

This document defines the logging standards for all AgentForge framework code.

## Quick Reference

```typescript
import { createPatternLogger } from '@agentforge/patterns';

// Create logger with hierarchical name
const logger = createPatternLogger('agentforge:patterns:react:action');

// Log at appropriate levels
logger.debug('Detailed execution info', { iteration: 1, state: {...} });
logger.info('High-level milestone', { result: 'success' });
logger.warn('Recoverable issue', { fallback: 'default' });
logger.error('Failure occurred', { error: error.message });
```

## Logger Naming Convention

Use hierarchical naming with colons to enable filtering:

```
agentforge:<package>:<module>:<component>
```

### Examples

| Component | Logger Name |
|-----------|-------------|
| ReAct action node | `agentforge:patterns:react:action` |
| ReAct reasoning node | `agentforge:patterns:react:reasoning` |
| Plan-Execute planner | `agentforge:patterns:plan-execute:planner` |
| Plan-Execute executor | `agentforge:patterns:plan-execute:executor` |
| Multi-Agent supervisor | `agentforge:patterns:multi-agent:supervisor` |
| Multi-Agent worker | `agentforge:patterns:multi-agent:worker` |
| Multi-Agent routing | `agentforge:patterns:multi-agent:routing` |
| Reflection generator | `agentforge:patterns:reflection:generator` |
| Reflection reflector | `agentforge:patterns:reflection:reflector` |
| Tool registry | `agentforge:core:tools:registry` |
| Retry middleware | `agentforge:core:middleware:retry` |

## Log Levels

### DEBUG - Detailed Execution Flow

**When to use:**
- Internal state changes
- Decision-making logic
- Cache operations
- Iteration progress
- Tool call details

**Examples:**
```typescript
logger.debug('Checking cache for tool call', {
  toolName: 'search',
  cacheKey: 'search:{"query":"test"}',
  cacheSize: 5
});

logger.debug('Routing decision made', {
  strategy: 'llm-based',
  targetAgent: 'researcher',
  reasoning: 'Best match for research task',
  confidence: 0.95
});

logger.debug('Processing iteration', {
  iteration: 3,
  maxIterations: 10,
  actionsCount: 2,
  observationsCount: 2
});
```

### INFO - High-Level Operations

**When to use:**
- Agent/node invocation start/complete
- Major milestones
- Performance metrics
- Successful completions

**Examples:**
```typescript
logger.info('Agent invocation started', {
  agentType: 'ReActAgent',
  maxIterations: 10,
  toolCount: 5
});

logger.info('Action node complete', {
  iteration: 3,
  toolsExecuted: 1,
  cacheHits: 2,
  observationCount: 3,
  duration: 1250
});

logger.info('Deduplication metrics', {
  toolsExecuted: 3,
  duplicatesSkipped: 10,
  deduplicationSavings: '77%'
});
```

### WARN - Recoverable Issues

**When to use:**
- Max iterations reached
- Fallback behavior triggered
- Deprecated features used
- Missing optional configuration
- Retries triggered

**Examples:**
```typescript
logger.warn('Max iterations reached', {
  iteration: 10,
  maxIterations: 10,
  status: 'incomplete'
});

logger.warn('Tool not found, using fallback', {
  requestedTool: 'advanced-search',
  fallbackTool: 'basic-search'
});

logger.warn('Deprecated feature used', {
  feature: 'verbose mode',
  alternative: 'Use LOG_LEVEL=debug instead',
  deprecatedIn: '0.7.0',
  removedIn: '1.0.0'
});
```

### ERROR - Failures

**When to use:**
- Tool execution failures
- Agent execution failures
- Invalid configuration
- Unrecoverable errors
- Exceptions

**Examples:**
```typescript
logger.error('Tool execution failed', {
  toolName: 'search',
  error: error.message,
  args: { query: 'test' }
});

logger.error('Agent execution failed', {
  agentType: 'ReActAgent',
  iteration: 5,
  error: error.message,
  duration: 3500
});

logger.error('Invalid configuration', {
  field: 'maxIterations',
  value: -1,
  expected: 'positive integer'
});
```

## Context Data Standards

Always include relevant context to make logs actionable:

### Required Context

- **IDs**: Task IDs, worker IDs, agent IDs, assignment IDs
- **Iteration/Step numbers**: Current progress
- **Counts**: Number of items processed, remaining, total

### Recommended Context

- **Timing**: Duration, timestamps (for performance-critical operations)
- **Decisions**: Why a choice was made (reasoning, confidence)
- **State**: Current status, phase, mode
- **Metrics**: Performance indicators, cache hit rates

### Example: Complete Node Logging

```typescript
import { createPatternLogger } from '@agentforge/patterns';

const logger = createPatternLogger('agentforge:patterns:react:action');

export function createActionNode(config: ActionNodeConfig) {
  return async (state: ReActState): Promise<Partial<ReActState>> => {
    const startTime = Date.now();
    
    logger.debug('Action node started', {
      iteration: state.iteration,
      actionCount: state.actions?.length || 0,
      cacheEnabled: config.enableDeduplication
    });
    
    try {
      // Execute actions
      const observations = await executeActions(state.actions);
      
      logger.info('Action node complete', {
        iteration: state.iteration,
        toolsExecuted: metrics.toolsExecuted,
        cacheHits: metrics.duplicatesSkipped,
        observationCount: observations.length,
        duration: Date.now() - startTime
      });
      
      return { observations };
      
    } catch (error) {
      logger.error('Action node failed', {
        iteration: state.iteration,
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  };
}
```

## Pattern-Specific Examples

### ReAct Pattern

```typescript
// In reasoning node
logger.debug('Reasoning iteration started', {
  iteration: state.iteration,
  maxIterations: config.maxIterations,
  observationCount: state.observations?.length || 0
});

logger.info('Reasoning complete', {
  iteration: state.iteration,
  thoughtGenerated: true,
  actionCount: actions.length
});

// In action node
logger.debug('Executing tool calls', {
  actionCount: actions.length,
  cacheEnabled: config.enableDeduplication
});

logger.debug('Cache hit', {
  toolName: action.name,
  cacheKey: key,
  savedExecution: true
});

logger.info('Tools executed', {
  toolsExecuted: 2,
  cacheHits: 3,
  totalObservations: 5
});
```

### Plan-Execute Pattern

```typescript
// In planner node
logger.debug('Generating plan', {
  input: state.input.substring(0, 100),
  maxSteps: config.maxSteps
});

logger.info('Plan generated', {
  stepCount: plan.steps.length,
  steps: plan.steps.map(s => s.description)
});

// In executor node
logger.debug('Executing step', {
  stepIndex: currentStepIndex,
  totalSteps: plan.steps.length,
  stepDescription: currentStep.description
});

logger.info('Step executed', {
  stepIndex: currentStepIndex,
  success: result.success,
  cacheHit: result.fromCache,
  duration: result.duration
});
```

### Multi-Agent Pattern

```typescript
// In supervisor node
logger.debug('Routing decision', {
  strategy: config.strategy,
  iteration: state.iteration,
  availableWorkers: Object.keys(state.workers).length
});

logger.info('Task assigned', {
  workerId: assignment.workerId,
  taskId: assignment.id,
  priority: assignment.priority,
  reasoning: decision.reasoning
});

// In worker node
logger.debug('Worker executing task', {
  workerId: id,
  taskId: assignment.id,
  executionMode: agent ? 'react-agent' : 'llm-direct'
});

logger.info('Worker task complete', {
  workerId: id,
  taskId: assignment.id,
  resultLength: result.length,
  duration: Date.now() - startTime
});

// In aggregator node
logger.debug('Aggregating results', {
  resultCount: state.completedTasks.length,
  totalWorkers: Object.keys(state.workers).length
});

logger.info('Aggregation complete', {
  resultCount: state.completedTasks.length,
  finalResponseLength: response.length
});
```

### Reflection Pattern

```typescript
// In generator node
logger.debug('Generating response', {
  attempt: state.iteration,
  maxAttempts: config.maxAttempts,
  hasFeedback: !!state.reflection
});

logger.info('Response generated', {
  attempt: state.iteration,
  responseLength: content.length
});

// In reflector node
logger.debug('Reflecting on response', {
  responseLength: state.response.length,
  criteria: config.criteria
});

logger.info('Reflection complete', {
  score: reflection.score,
  meetsStandards: reflection.meetsStandards,
  feedbackLength: reflection.feedback.length
});

// In reviser node
logger.debug('Revising response', {
  attempt: state.iteration,
  previousScore: state.reflection.score,
  feedback: state.reflection.feedback.substring(0, 100)
});

logger.info('Revision complete', {
  attempt: state.iteration,
  revisionLength: content.length
});
```

## Anti-Patterns (Don't Do This)

### ❌ Using console.log instead of logger

```typescript
// ❌ Bad
if (verbose) {
  console.log(`[Worker] Executing task`);
}

// ✅ Good
logger.debug('Worker executing task', { workerId: id });
```

### ❌ Logging without context

```typescript
// ❌ Bad
logger.info('Task complete');

// ✅ Good
logger.info('Task complete', {
  taskId: assignment.id,
  duration: Date.now() - startTime,
  success: true
});
```

### ❌ Logging sensitive data

```typescript
// ❌ Bad
logger.debug('User input', { apiKey: config.apiKey });

// ✅ Good
logger.debug('User input', { hasApiKey: !!config.apiKey });
```

### ❌ Expensive computations in log calls

```typescript
// ❌ Bad - always computes even if DEBUG disabled
logger.debug('State', { state: JSON.stringify(largeState) });

// ✅ Good - only computes if DEBUG enabled
if (logger.isDebugEnabled?.()) {
  logger.debug('State', { state: JSON.stringify(largeState) });
}
```

## Testing Logging

### Unit Tests

```typescript
import { createLogger } from '@agentforge/core';
import { vi } from 'vitest';

describe('ActionNode', () => {
  it('should log execution details', async () => {
    const infoSpy = vi.fn();
    const logger = {
      debug: vi.fn(),
      info: infoSpy,
      warn: vi.fn(),
      error: vi.fn(),
    };
    
    const node = createActionNode({ logger });
    await node(state);
    
    expect(infoSpy).toHaveBeenCalledWith(
      'Action node complete',
      expect.objectContaining({
        iteration: expect.any(Number),
        duration: expect.any(Number)
      })
    );
  });
});
```

## Environment Configuration

Control logging via `LOG_LEVEL` environment variable:

```bash
# Show only INFO, WARN, ERROR
LOG_LEVEL=info npm start

# Show all logs including DEBUG
LOG_LEVEL=debug npm start

# Show only errors
LOG_LEVEL=error npm start
```

## Summary Checklist

When adding logging to a component:

- [ ] Use `createPatternLogger` with hierarchical name
- [ ] Log at DEBUG level for detailed execution flow
- [ ] Log at INFO level for high-level milestones
- [ ] Log at WARN level for recoverable issues
- [ ] Log at ERROR level for failures
- [ ] Include relevant context (IDs, counts, timing)
- [ ] Avoid logging sensitive data
- [ ] Test that logs appear correctly
- [ ] Document any special logging behavior

