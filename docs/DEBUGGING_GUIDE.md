# AgentForge Debugging Guide

This guide shows you how to use AgentForge's structured logging system to debug your agents effectively.

## Table of Contents

- [Quick Start](#quick-start)
- [Log Levels](#log-levels)
- [Enabling Debug Logging](#enabling-debug-logging)
- [Pattern-Specific Debugging](#pattern-specific-debugging)
- [Common Debugging Scenarios](#common-debugging-scenarios)
- [Filtering Logs](#filtering-logs)
- [Performance Debugging](#performance-debugging)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Enable Debug Logging

Set the `LOG_LEVEL` environment variable to see detailed execution logs:

```bash
# See everything (most verbose)
LOG_LEVEL=debug npm start

# See important events only
LOG_LEVEL=info npm start

# See warnings and errors only
LOG_LEVEL=warn npm start

# See errors only
LOG_LEVEL=error npm start
```

### Example Output

With `LOG_LEVEL=debug`, you'll see detailed execution flow:

```
[2026-01-24T10:15:33.163Z] [DEBUG] [agentforge:patterns:react:reasoning] Reasoning node executing data={"iteration":1,"maxIterations":10}
[2026-01-24T10:15:33.164Z] [INFO] [agentforge:patterns:react:reasoning] Reasoning complete data={"iteration":1,"thoughtGenerated":true,"actionCount":2,"shouldContinue":true,"duration":125}
[2026-01-24T10:15:33.165Z] [DEBUG] [agentforge:patterns:react:action] Action node executing data={"iteration":1,"toolCallCount":2}
[2026-01-24T10:15:33.166Z] [INFO] [agentforge:patterns:react:action] Action node complete data={"iteration":1,"toolsExecuted":2,"duplicatesSkipped":0,"totalObservations":2,"duration":89}
```

## Log Levels

AgentForge uses four log levels:

| Level | When to Use | Example |
|-------|-------------|---------|
| **DEBUG** | Detailed execution flow, variable values, decision points | Node entry/exit, cache checks, routing decisions |
| **INFO** | High-level milestones, successful operations | Node completion, task assignment, aggregation complete |
| **WARN** | Recoverable issues, unexpected but handled situations | Max iterations reached, throttled alerts, no tasks to aggregate |
| **ERROR** | Failures, exceptions, unrecoverable errors | Node errors, tool execution failures, parsing errors |

## Enabling Debug Logging

### For Development

```bash
# In your terminal
export LOG_LEVEL=debug
npm run dev
```

### For Production

```bash
# Use INFO level in production
export LOG_LEVEL=info
npm start
```

### In Code (for testing)

```typescript
import { createLogger, LogLevel } from '@agentforge/core';

const logger = createLogger('my-agent', { level: LogLevel.DEBUG });
```

### Using .env Files

```bash
# .env.development
LOG_LEVEL=debug

# .env.production
LOG_LEVEL=info
```

## Pattern-Specific Debugging

### ReAct Pattern

**Logger names:**
- `agentforge:patterns:react:reasoning` - Thought generation and decision making
- `agentforge:patterns:react:action` - Tool execution and observations
- `agentforge:patterns:react:observation` - Observation processing

**Common debug scenarios:**

```bash
# See why the agent is looping
LOG_LEVEL=debug npm start
# Look for: "Reasoning complete" with shouldContinue=true/false

# See which tools are being called
LOG_LEVEL=debug npm start
# Look for: "Executing tool" with toolName and args

# See cache hits/misses
LOG_LEVEL=debug npm start
# Look for: "Cache hit" or "Cache miss" in action node logs
```

### Plan-Execute Pattern

**Logger names:**
- `agentforge:patterns:plan-execute:planner` - Plan generation
- `agentforge:patterns:plan-execute:executor` - Step execution
- `agentforge:patterns:plan-execute:replanner` - Plan revision

**Common debug scenarios:**

```bash
# See the generated plan
LOG_LEVEL=debug npm start
# Look for: "Plan generated" with stepCount

# See which step is executing
LOG_LEVEL=debug npm start
# Look for: "Executing step" with stepIndex and description

# See why replanning occurred
LOG_LEVEL=debug npm start
# Look for: "Replanning triggered" with reason
```

### Reflection Pattern

**Logger names:**
- `agentforge:patterns:reflection:generator` - Initial generation
- `agentforge:patterns:reflection:reflector` - Reflection and feedback
- `agentforge:patterns:reflection:reviser` - Revision based on feedback

**Common debug scenarios:**

```bash
# See reflection feedback
LOG_LEVEL=debug npm start
# Look for: "Reflection complete" with feedbackLength

# See revision attempts
LOG_LEVEL=debug npm start
# Look for: "Revision complete" with attempt number

# See why reflection stopped
LOG_LEVEL=debug npm start
# Look for: "Max reflections reached" or "Reflection satisfied"
```

### Multi-Agent Pattern

**Logger names:**
- `agentforge:patterns:multi-agent:nodes` - All node operations
- `agentforge:patterns:multi-agent:routing` - Routing decisions

**Common debug scenarios:**

```bash
# See routing decisions
LOG_LEVEL=debug npm start
# Look for: "Routing to single agent" with targetAgent and reasoning

# See worker assignments
LOG_LEVEL=debug npm start
# Look for: "Worker processing assignment" with workerId and task

# See aggregation process
LOG_LEVEL=debug npm start
# Look for: "Aggregation complete" with responseLength
```

## Common Debugging Scenarios

### Scenario 1: Agent Not Stopping

**Problem:** Agent keeps looping and doesn't finish

**Solution:**
```bash
LOG_LEVEL=debug npm start
```

Look for:
- ReAct: Check `shouldContinue` in "Reasoning complete" logs
- Plan-Execute: Check `allStepsComplete` in executor logs
- Multi-Agent: Check "Max iterations reached" warnings

### Scenario 2: Tool Not Being Called

**Problem:** Expected tool is not being executed

**Solution:**
```bash
LOG_LEVEL=debug npm start
```

Look for:
- "Reasoning complete" - Check if `actionCount` is 0
- "Tool calls parsed" - Check if tool name is in the list
- "Executing tool" - Verify the tool is actually being called
- "Tool execution failed" - Check for errors

### Scenario 3: Slow Performance

**Problem:** Agent is taking too long to respond

**Solution:**
```bash
LOG_LEVEL=info npm start
```

Look for:
- `duration` field in completion logs (in milliseconds)
- "Cache hit" vs "Cache miss" - Low cache hit rate means duplicate work
- High `iteration` counts - Agent may be looping unnecessarily

Example:
```
[INFO] [agentforge:patterns:react:action] Action node complete data={"duration":5234,"toolsExecuted":10}
```
If duration > 5000ms, investigate which tools are slow.

### Scenario 4: Unexpected Errors

**Problem:** Agent crashes or returns errors

**Solution:**
```bash
LOG_LEVEL=error npm start
```

Look for:
- Error messages with stack traces
- "Node error" logs with error details
- "Tool execution failed" with error information

Example:
```
[ERROR] [agentforge:patterns:react:action] Tool execution failed data={"toolName":"search","error":"API rate limit exceeded","stack":"..."}
```

### Scenario 5: Cache Not Working

**Problem:** Tool deduplication not preventing duplicate calls

**Solution:**
```bash
LOG_LEVEL=debug npm start
```

Look for:
- "Cache hit" vs "Cache miss" in action node logs
- "Deduplication metrics" in completion logs
- Check if `duplicatesSkipped` is 0 when you expect duplicates

Example:
```
[DEBUG] [agentforge:patterns:react:action] Cache hit data={"toolName":"search","args":{"query":"test"}}
[INFO] [agentforge:patterns:react:action] Action node complete data={"duplicatesSkipped":3}
```

## Filtering Logs

### By Logger Name

Use grep to filter logs by pattern or component:

```bash
# See only ReAct reasoning logs
LOG_LEVEL=debug npm start 2>&1 | grep "react:reasoning"

# See only errors
LOG_LEVEL=debug npm start 2>&1 | grep "ERROR"

# See only multi-agent routing
LOG_LEVEL=debug npm start 2>&1 | grep "multi-agent:routing"
```

### By Log Level

```bash
# See INFO and above (INFO, WARN, ERROR)
LOG_LEVEL=info npm start

# See WARN and above (WARN, ERROR)
LOG_LEVEL=warn npm start

# See only errors
LOG_LEVEL=error npm start
```

### Using jq for JSON Logs

If your logs are in JSON format, use `jq` to filter:

```bash
# Extract only error messages
npm start 2>&1 | jq 'select(.level == "ERROR") | .message'

# Show logs with duration > 1000ms
npm start 2>&1 | jq 'select(.data.duration > 1000)'

# Show logs for specific iteration
npm start 2>&1 | jq 'select(.data.iteration == 5)'
```

## Performance Debugging

### Measuring Node Duration

All nodes log their execution duration:

```typescript
[INFO] [agentforge:patterns:react:reasoning] Reasoning complete data={"duration":125}
[INFO] [agentforge:patterns:react:action] Action node complete data={"duration":89}
```

**Interpreting duration:**
- < 100ms: Fast ✅
- 100-500ms: Normal ⚠️
- 500-2000ms: Slow 🐌
- > 2000ms: Very slow 🚨

### Identifying Bottlenecks

```bash
# Find slowest operations
LOG_LEVEL=info npm start 2>&1 | grep "duration" | sort -t: -k4 -n
```

### Cache Performance

Monitor cache hit rate:

```typescript
[INFO] [agentforge:patterns:react:action] Action node complete data={
  "toolsExecuted":10,
  "duplicatesSkipped":5,  // 5 out of 15 total calls were cached
  "totalObservations":10
}
```

**Cache hit rate = duplicatesSkipped / (toolsExecuted + duplicatesSkipped)**

In this example: 5 / 15 = 33% cache hit rate

## Troubleshooting

### No Logs Appearing

**Problem:** You don't see any logs

**Solutions:**
1. Check `LOG_LEVEL` is set: `echo $LOG_LEVEL`
2. Make sure it's lowercase: `export LOG_LEVEL=debug` (not `DEBUG`)
3. Verify logger is created: Check imports in your code
4. Check if logs are going to stderr: `npm start 2>&1`

### Too Many Logs

**Problem:** Logs are overwhelming

**Solutions:**
1. Use higher log level: `LOG_LEVEL=info` or `LOG_LEVEL=warn`
2. Filter by component: `npm start 2>&1 | grep "react:action"`
3. Use log aggregation tools (e.g., Winston, Pino)

### Logs Missing Context

**Problem:** Logs don't have enough information

**Solutions:**
1. Use DEBUG level: `LOG_LEVEL=debug`
2. Check the `data` field in logs for context
3. Look at surrounding logs for full picture
4. Enable verbose mode if available (deprecated, use DEBUG instead)

### Production Logging Best Practices

1. **Use INFO level in production**
   ```bash
   LOG_LEVEL=info npm start
   ```

2. **Aggregate logs to a service**
   - Use tools like Datadog, Splunk, or ELK stack
   - Filter by logger name: `agentforge:patterns:*`

3. **Monitor error rates**
   - Set up alerts for ERROR level logs
   - Track error patterns over time

4. **Performance monitoring**
   - Track `duration` metrics
   - Monitor cache hit rates
   - Alert on slow operations (duration > 2000ms)

## Advanced Debugging

### Custom Loggers

Create your own logger for custom components:

```typescript
import { createLogger, LogLevel } from '@agentforge/core';

const logger = createLogger('my-app:custom-component', {
  level: LogLevel.DEBUG
});

logger.debug('Starting custom operation', { userId: 123 });
logger.info('Operation complete', { duration: 456 });
logger.error('Operation failed', { error: 'Connection timeout' });
```

### Conditional Logging

Use `isDebugEnabled()` to avoid expensive operations:

```typescript
import { createLogger } from '@agentforge/core';

const logger = createLogger('my-app:expensive');

if (logger.isDebugEnabled()) {
  // Only compute this expensive data if debug is enabled
  const expensiveData = computeExpensiveDebugInfo();
  logger.debug('Debug info', expensiveData);
}
```

### Context Loggers

Create child loggers with additional context:

```typescript
const baseLogger = createLogger('my-app');
const userLogger = baseLogger.withContext({ userId: 123, sessionId: 'abc' });

userLogger.info('User action');
// Logs: [INFO] [my-app] User action data={"userId":123,"sessionId":"abc"}
```

## Summary

- **Quick debugging:** `LOG_LEVEL=debug npm start`
- **Production:** `LOG_LEVEL=info npm start`
- **Filter logs:** Use grep or jq
- **Performance:** Check `duration` fields
- **Errors:** Look for ERROR level logs with stack traces
- **Cache:** Monitor `duplicatesSkipped` metrics

For more information, see:
- [Logging Standards](./LOGGING_STANDARDS.md)
- [Logging Examples](./examples/LOGGING_EXAMPLES.md)
- Pattern-specific documentation in `packages/patterns/docs/`


