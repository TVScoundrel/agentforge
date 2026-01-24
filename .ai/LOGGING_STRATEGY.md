# AgentForge Logging Strategy

## Executive Summary

This document outlines a systematic approach to adding comprehensive logging across the entire AgentForge framework to improve debugging, observability, and developer experience.

## Implementation Progress

**Status:** Phase 5 Complete (5 of 5 phases) - 100% Complete ✅

### Completed ✅
- **Phase 1:** Audit and Standards - All 4 tasks complete
- **Phase 2:** Core Patterns - All 3 patterns complete (ReAct, Plan-Execute, Reflection)
- **Phase 3:** Multi-Agent Cleanup - All console.log replaced with structured logging
- **Phase 4:** Core Components - All console.log replaced in Monitoring/Alerts and Tool Registry
- **Phase 5:** Documentation and Examples - All pattern docs updated with logging sections

### Statistics
- **Console.log instances migrated:** 41 (ReAct: 8, Reflection: 11, Multi-Agent: 16, Monitoring: 4, Tools: 2)
- **Tests passing:** 322 (Patterns: 204, Tools: 118)
- **Loggers created:** 15 (Patterns: 12, Core: 3)
- **Documentation files created/updated:** 8
  - **Created:** DEBUGGING_GUIDE.md, LOGGING_STANDARDS.md, LOGGING_EXAMPLES.md, CONSOLE_LOGGING_AUDIT.md
  - **Updated:** react-pattern.md, plan-execute-pattern.md, reflection-pattern.md, multi-agent-pattern.md

## Current State Assessment

### Existing Infrastructure ✅

1. **Core Logger** (`packages/core/src/langgraph/observability/logger.ts`)
   - Structured logging with JSON format support
   - Log levels: DEBUG, INFO, WARN, ERROR
   - Context support via `withContext()`
   - Timestamp and metadata support
   - Configurable via `LOG_LEVEL` environment variable

2. **Shared Utilities** (`packages/patterns/src/shared/deduplication.ts`)
   - `createPatternLogger(name, defaultLevel)` - Standardized logger creation
   - Respects `LOG_LEVEL` environment variable

3. **Logging Middleware** (`packages/core/src/langgraph/middleware/logging.ts`)
   - `withLogging()` middleware for LangGraph nodes
   - Tracks input/output, duration, errors

4. **CLI Logger** (`packages/cli/src/utils/logger.ts`)
   - Separate logger for user-facing CLI output
   - Colored output, spinners, formatting
   - Uses console.log internally (appropriate for CLI)

### Current Logging Patterns

#### ✅ Excellent Examples (All Core Patterns) - UPDATED
```typescript
// ReAct Pattern - Separate loggers per node
const reasoningLogger = createPatternLogger('agentforge:patterns:react:reasoning');
const actionLogger = createPatternLogger('agentforge:patterns:react:action');

reasoningLogger.info('Reasoning complete', {
  iteration: currentIteration + 1,
  thoughtGenerated: !!thought,
  actionCount: toolCalls.length,
  shouldContinue,
  duration: Date.now() - startTime
});

actionLogger.info('Action node complete', {
  iteration: state.iteration,
  toolsExecuted: executedCount,
  duplicatesSkipped: deduplicationMetrics.duplicatesSkipped,
  totalObservations: observations.length,
  duration: Date.now() - startTime
});
```

#### ✅ Good Examples (Multi-Agent Pattern) - UPDATED
```typescript
// Consistent structured logging throughout
const logger = createLogger('multi-agent:nodes', { level: logLevel });
logger.info('Supervisor node executing', {
  iteration: state.iteration,
  maxIterations,
  activeAssignments: state.activeAssignments.length
});
logger.debug(`Routing iteration ${state.iteration}/${maxIterations}`);
```

#### ❌ Remaining Console Logging (Limited Scope)
- Examples use `console.log()` for demonstration purposes (appropriate)
- Templates use `console.log()` for user output (appropriate)
- Monitoring/Alerts: 4 instances (Phase 4)
- Tool Registry: 2 instances (Phase 4)

### Problems Solved ✅

1. **✅ Inconsistent Logging Patterns** - SOLVED
   - All core patterns now have comprehensive structured logging
   - ReAct, Reflection, Plan-Execute: Separate loggers per node type
   - Multi-Agent: Consistent logger.debug throughout

2. **✅ Verbose Mode Duplication** - SOLVED
   - Verbose console.log replaced with logger.debug
   - Single logging path controlled by LOG_LEVEL
   - Verbose parameter kept for backward compatibility but unused

3. **✅ Missing Logging in Core Patterns** - SOLVED
   - ReAct: 8 console.log → structured logging
   - Reflection: 11 console.log → structured logging
   - Plan-Execute: Enhanced existing structured logging
   - Multi-Agent: 16 console.log → structured logging

4. **✅ No Logging Standards** - SOLVED
   - Created `docs/LOGGING_STANDARDS.md` with comprehensive guidelines
   - Created `docs/examples/LOGGING_EXAMPLES.md` with concrete examples
   - Documented logger naming convention: `agentforge:<package>:<module>:<component>`
   - Documented log level guidelines and context data standards

### Remaining Issues

1. **Documentation Updates** (Phase 5)
   - Update pattern documentation with logging examples
   - Create debugging guide showing how to use logs
   - Add troubleshooting sections to pattern docs

## Goals

1. **Systematic Logging** - Every pattern has comprehensive, consistent logging
2. **Easy Debugging** - Developers can trace execution flow at DEBUG level
3. **Production Ready** - INFO level provides operational visibility without noise
4. **Performance** - Minimal overhead when logging is disabled
5. **Consistency** - Same logging approach across all patterns
6. **Backward Compatibility** - No breaking changes to public APIs

## Proposed Architecture

### 1. Logger Naming Convention

Use hierarchical naming with colons:
```
agentforge:<package>:<module>:<component>
```

**Examples:**
- `agentforge:patterns:react:action` - ReAct action node
- `agentforge:patterns:react:reasoning` - ReAct reasoning node
- `agentforge:patterns:plan-execute:planner` - Plan-Execute planner
- `agentforge:patterns:multi-agent:supervisor` - Multi-agent supervisor
- `agentforge:core:tools:registry` - Tool registry
- `agentforge:core:middleware:retry` - Retry middleware

### 2. Log Level Guidelines

| Level | When to Use | Examples |
|-------|-------------|----------|
| **DEBUG** | Detailed execution flow, internal state, decisions | "Checking cache for key X", "Routing to worker Y", "Tool call args: {...}" |
| **INFO** | High-level operations, milestones, results | "Agent invocation started", "Task completed", "Deduplication saved 75%" |
| **WARN** | Recoverable issues, deprecations, fallbacks | "Max iterations reached", "Tool not found, using fallback", "Cache miss" |
| **ERROR** | Failures, exceptions, critical issues | "Agent execution failed", "Invalid configuration", "Tool execution error" |

### 3. Replace Verbose Mode with DEBUG Level

**Current (Multi-Agent):**
```typescript
if (verbose) {
  console.log(`[Supervisor] Routing to ${targetAgent}`);
}
```

**Proposed:**
```typescript
logger.debug('Routing decision made', {
  targetAgent,
  reasoning: decision.reasoning,
  confidence: decision.confidence
});
```

**Benefits:**
- Single logging path (no duplication)
- Structured data (easier to parse/filter)
- Controlled via `LOG_LEVEL=debug` environment variable
- Can be enabled per-module: `LOG_LEVEL=debug:agentforge:patterns:multi-agent`

### 4. Context Data Standards

Always include relevant context:
- **Iteration/Step numbers** - For tracking progress
- **IDs** - Task IDs, worker IDs, agent IDs
- **Counts** - Number of items processed, remaining, etc.
- **Timing** - Duration, timestamps (when relevant)
- **Decisions** - Why a choice was made
- **State** - Current status, phase, mode

**Example:**
```typescript
logger.info('Action node complete', {
  iteration: state.iteration,
  actionCount: actions.length,
  observationCount: observations.length,
  cacheHits: deduplicationMetrics.duplicatesSkipped,
  duration: Date.now() - startTime
});
```

## Implementation Plan

### Phase 1: Audit and Standards ✅ COMPLETE
- [x] Document all console.log/console.error usage across codebase
  - Created `.ai/CONSOLE_LOGGING_AUDIT.md` with 44 instances across 8 files
- [x] Create logging standards document with examples
  - Created `docs/LOGGING_STANDARDS.md` with comprehensive guidelines
- [x] Update `createPatternLogger` if needed
  - Enhanced Logger interface with `isDebugEnabled()` and `isLevelEnabled()` methods
  - Added 5 new tests, all 18 tests passing
- [x] Create logging examples for each pattern type
  - Created `docs/examples/LOGGING_EXAMPLES.md` with concrete examples

### Phase 2: Core Patterns ✅ COMPLETE
- [x] Add comprehensive logging to ReAct pattern
  - Created 3 separate loggers: `reasoningLogger`, `actionLogger`, `observationLogger`
  - Replaced 8 console.log/error calls with structured logging
  - Added timing, context data, and metrics
  - All 63 tests passing ✅
- [x] Add comprehensive logging to Plan-Execute pattern
  - Created 3 separate loggers: `plannerLogger`, `executorLogger`, `replannerLogger`
  - Enhanced existing structured logging (no console.log to replace)
  - Added comprehensive logging to planner and replanner nodes
  - All 37 tests passing ✅
- [x] Add comprehensive logging to Reflection pattern
  - Created 3 separate loggers: `generatorLogger`, `reflectorLogger`, `reviserLogger`
  - Replaced 11 console.log/error calls with structured logging
  - Added timing, context data, and metrics
  - All 30 tests passing ✅

### Phase 3: Multi-Agent Cleanup ✅ COMPLETE
- [x] Replace verbose console.log with logger.debug
  - Replaced 16 console.log/error calls with structured logging
  - Removed verbose parameter checks (kept parameter for backward compatibility)
  - All 74 tests passing ✅
- [x] Ensure consistent logging across all nodes
  - Supervisor, Worker, and Aggregator nodes now use consistent logger.debug
- [ ] Remove `verbose` parameter (breaking change - deferred to major version)
  - Parameter kept for backward compatibility but no longer used internally
- [x] Add logging to routing strategies
  - Routing strategies already had structured logging in place

### Phase 4: Core Components ✅ COMPLETE
- [x] Add logging to Monitoring/Alerts
  - Created logger: `agentforge:core:monitoring:alerts`
  - Replaced 4 console.log/error calls with structured logging
  - Alert triggered: logger.warn, Rule check failed: logger.error, Alert sent: logger.info
- [x] Add logging to Tool Registry
  - Created logger: `agentforge:core:tools:registry`
  - Replaced 1 console.error call with structured logging
  - Event handler errors now logged with logger.error
  - All 118 tests passing ✅
- [x] Add logging to Tool Lifecycle
  - Created logger: `agentforge:core:tools:lifecycle`
  - Replaced 1 console.error call with structured logging
  - Cleanup failures now logged with logger.error
- [ ] Add logging to middleware (deferred - middleware already has logging)
- [ ] Add logging to state management operations (deferred - not needed)

### Phase 5: Documentation and Examples ✅ COMPLETE
- [x] **Create debugging guide** - Created `docs/DEBUGGING_GUIDE.md` with comprehensive debugging information
  - Quick start guide for enabling debug logging
  - Log levels explanation (DEBUG, INFO, WARN, ERROR)
  - Pattern-specific debugging sections for all 4 patterns
  - Common debugging scenarios with bash commands and log examples
  - Filtering logs techniques
- [x] **Update ReAct pattern documentation** - Updated `packages/patterns/docs/react-pattern.md`
  - Replaced "Enable Verbose Logging" section with "Structured Logging" section
  - Added logger names (reasoning, action, observation)
  - Added example debug output
  - Added common debugging scenarios (Agent Not Stopping, Tool Not Being Called, Slow Performance, Cache Not Working)
  - Updated troubleshooting section with logging-based debugging
- [x] **Update Plan-Execute pattern documentation** - Updated `packages/patterns/docs/plan-execute-pattern.md`
  - Replaced verbose logging section with structured logging information
  - Added logger names (planner, executor, replanner)
  - Added example debug output
  - Added common debugging scenarios (Plan Too Vague, Step Execution Failing, Slow Performance)
- [x] **Update Reflection pattern documentation** - Updated `packages/patterns/docs/reflection-pattern.md`
  - Replaced verbose mode section with structured logging information
  - Added logger names (generator, reflector, reviser)
  - Added example debug output
  - Added common debugging scenarios (Quality Not Improving, Too Many Iterations)
- [x] **Update Multi-Agent pattern documentation** - Updated `packages/patterns/docs/multi-agent-pattern.md`
  - Replaced verbose mode section with structured logging information
  - Added logger names (nodes, routing)
  - Added example debug output
  - Added common debugging scenarios (Workers Not Being Called, Slow Performance, Aggregation Issues)

## Migration Strategy

### For Pattern Developers

**Before:**
```typescript
export function createReActAgent(config: ReActConfig) {
  // No logging
  const graph = new StateGraph(ReActState);
  // ...
}
```

**After:**
```typescript
import { createPatternLogger } from '@agentforge/patterns';

export function createReActAgent(config: ReActConfig) {
  const logger = createPatternLogger('agentforge:patterns:react');
  
  logger.debug('Creating ReAct agent', {
    maxIterations: config.maxIterations,
    toolCount: config.tools?.length || 0
  });
  
  const graph = new StateGraph(ReActState);
  // ...
  
  logger.info('ReAct agent created successfully');
  return compiled;
}
```

### For Node Implementations

**Pattern for all nodes:**
```typescript
import { createPatternLogger } from '@agentforge/patterns';

const logger = createPatternLogger('agentforge:patterns:<pattern>:<node>');

export function createMyNode(config: NodeConfig) {
  return async (state: State): Promise<Partial<State>> => {
    const startTime = Date.now();
    
    logger.debug('Node execution started', {
      iteration: state.iteration,
      // ... relevant state
    });
    
    try {
      // Node logic
      
      logger.info('Node execution complete', {
        duration: Date.now() - startTime,
        // ... results
      });
      
      return result;
    } catch (error) {
      logger.error('Node execution failed', {
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  };
}
```

### Handling Verbose Mode

**Option 1: Deprecate and Map to Log Level (Backward Compatible)**
```typescript
export function createMultiAgentSystem(config: MultiAgentSystemConfig) {
  // Map verbose to log level
  if (config.verbose) {
    process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'debug';
  }
  // ... rest of implementation
}
```

**Option 2: Remove in Next Major Version (Breaking Change)**
- Document in CHANGELOG as breaking change
- Provide migration guide
- Update all examples and documentation

## Testing Logging

### Unit Tests
```typescript
import { createLogger } from '@agentforge/core';
import { vi } from 'vitest';

describe('MyNode', () => {
  it('should log execution details', async () => {
    const logSpy = vi.fn();
    const logger = {
      debug: vi.fn(),
      info: logSpy,
      warn: vi.fn(),
      error: vi.fn(),
    };
    
    // Test with mocked logger
    const node = createMyNode({ logger });
    await node(state);
    
    expect(logSpy).toHaveBeenCalledWith(
      'Node execution complete',
      expect.objectContaining({ duration: expect.any(Number) })
    );
  });
});
```

### Integration Tests
- Set `LOG_LEVEL=debug` in test environment
- Capture log output and verify key messages appear
- Test that sensitive data is not logged

## Performance Considerations

1. **Lazy Evaluation** - Use functions for expensive computations:
   ```typescript
   // ❌ Bad - always computes even if DEBUG disabled
   logger.debug('State', { state: JSON.stringify(largeState) });
   
   // ✅ Good - only computes if DEBUG enabled
   logger.debug('State', () => ({ state: JSON.stringify(largeState) }));
   ```

2. **Conditional Logging** - Check level before expensive operations:
   ```typescript
   if (logger.isDebugEnabled()) {
     const expensiveData = computeExpensiveDebugInfo();
     logger.debug('Debug info', expensiveData);
   }
   ```

3. **Sampling** - For high-frequency logs, sample:
   ```typescript
   if (iteration % 10 === 0) {
     logger.debug('Progress update', { iteration });
   }
   ```

## Examples by Pattern

### ReAct Pattern
```typescript
// In action node
logger.debug('Processing actions', {
  actionCount: actions.length,
  cacheEnabled: enableDeduplication,
  iteration: state.iteration
});

logger.info('Actions executed', {
  toolsExecuted: metrics.toolsExecuted,
  cacheHits: metrics.duplicatesSkipped,
  observationCount: observations.length
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
  estimatedDuration: plan.estimatedDuration
});
```

### Multi-Agent Pattern
```typescript
// In supervisor node
logger.debug('Routing decision', {
  strategy: config.strategy,
  targetAgent: decision.targetAgent,
  reasoning: decision.reasoning,
  confidence: decision.confidence
});

logger.info('Task assigned', {
  workerId: assignment.workerId,
  taskId: assignment.id,
  priority: assignment.priority
});
```

## Success Metrics

1. **Coverage** - All patterns have comprehensive logging
2. **Consistency** - Same logging patterns across all modules
3. **Debuggability** - Can trace execution flow with `LOG_LEVEL=debug`
4. **Performance** - <5% overhead with INFO level, <10% with DEBUG
5. **Documentation** - All patterns have logging examples in docs

## Next Steps

1. Review and approve this strategy document
2. Create GitHub issues for each phase
3. Assign owners for each phase
4. Begin Phase 1: Audit and Standards
5. Iterate based on feedback from initial implementation

## Questions for Discussion

1. Should we remove `verbose` parameter in next major version or keep it as alias for log level?
2. Do we need module-specific log level control (e.g., `LOG_LEVEL=debug:agentforge:patterns:react`)?
3. Should examples continue using console.log or switch to logger?
4. Do we need log output formatting options (JSON vs. human-readable)?
5. Should we add performance logging (timing) as a separate concern?

