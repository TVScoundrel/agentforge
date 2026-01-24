# Console Logging Audit Report

**Date:** 2026-01-24  
**Purpose:** Document all console.log/console.error usage to guide migration to structured logging

## Executive Summary

- **Total files with console logging:** 90+ files
- **Source code files (non-examples):** 25 files
- **Primary categories:**
  - ✅ **CLI Logger** (8 files) - Appropriate use of console.log for user-facing output
  - ⚠️ **Pattern Verbose Mode** (4 files) - Should migrate to logger.debug
  - ⚠️ **Monitoring/Alerts** (4 files) - Should use structured logging
  - ⚠️ **Error Handling** (5 files) - Should use logger.error
  - ✅ **Examples/Templates** (60+ files) - Appropriate for demonstration
  - ✅ **JSDoc Examples** (10+ files) - Documentation only

## Detailed Findings

### Category 1: Pattern Verbose Mode (HIGH PRIORITY)

These files use console.log for verbose debugging and should migrate to structured logging.

#### Multi-Agent Pattern (19 instances)
**File:** `packages/patterns/src/multi-agent/nodes.ts`

| Line | Code | Recommendation |
|------|------|----------------|
| 54 | `console.log(\`[Supervisor] Routing iteration...\`)` | Replace with `logger.debug('Routing iteration', { iteration, maxIterations })` |
| 65 | `console.log('[Supervisor] Max iterations reached...')` | Replace with `logger.debug('Max iterations reached')` |
| 90 | `console.log('[Supervisor] All tasks completed...')` | Replace with `logger.debug('All tasks completed')` |
| 141 | `console.log(\`[Supervisor] Routing to \${targetAgents[0]}...\`)` | Replace with `logger.debug('Routing decision', { targetAgent, reasoning })` |
| 143 | `console.log(\`[Supervisor] Routing to \${targetAgents.length} agents...\`)` | Replace with `logger.debug('Parallel routing', { targetAgents, reasoning })` |
| 202 | `console.error('[Supervisor] Error:', error)` | Replace with `logger.error('Supervisor error', { error: error.message })` |
| 235 | `console.log(\`[Worker:\${id}] Executing task\`)` | Replace with `logger.debug('Worker executing task', { workerId: id })` |
| 252 | `console.log(\`[Worker:\${id}] No active assignment...\`)` | Replace with `logger.debug('No active assignment', { workerId: id })` |
| 269 | `console.log(\`[Worker:\${id}] Using custom executeFn\`)` | Replace with `logger.debug('Using custom executeFn', { workerId: id })` |
| 280 | `console.log(\`[Worker:\${id}] Using ReAct agent...\`)` | Replace with `logger.debug('Using ReAct agent', { workerId: id })` |
| 286 | `console.warn(\`[Worker:\${id}] Agent provided but...\`)` | Replace with `logger.warn('Invalid agent type', { workerId: id })` |
| 342 | `console.log(\`[Worker:\${id}] Task completed:...\`)` | Replace with `logger.debug('Task completed', { workerId: id, result })` |
| 406 | `console.error(\`[Worker:\${id}] Error:...\`)` | Replace with `logger.error('Worker error', { workerId: id, error })` |
| 465 | `console.log('[Aggregator] Combining results...')` | Replace with `logger.debug('Combining results')` |
| 545 | `console.log('[Aggregator] Aggregation complete')` | Replace with `logger.debug('Aggregation complete')` |
| 559 | `console.error('[Aggregator] Error:', error)` | Replace with `logger.error('Aggregator error', { error })` |

**File:** `packages/patterns/src/multi-agent/agent.ts`

| Line | Code | Recommendation |
|------|------|----------------|
| 437 | `console.warn(...)` | Replace with `logger.warn('Deprecated feature', { ... })` |

#### ReAct Pattern (8 instances)
**File:** `packages/patterns/src/react/nodes.ts`

| Line | Code | Recommendation |
|------|------|----------------|
| 43 | `console.log(\`[reasoning] Iteration...\`)` | Replace with `logger.debug('Reasoning iteration', { iteration, maxIterations })` |
| 121 | `console.log(\`[action] Executing \${actions.length} tool calls\`)` | Replace with `logger.debug('Executing tool calls', { actionCount: actions.length })` |
| 168 | `console.log(\`[action] Skipping already-processed...\`)` | Replace with `logger.debug('Skipping processed action', { actionName, actionId })` |
| 189 | `console.log(\`[action] ⚠️  Skipping duplicate...\`)` | Replace with `logger.debug('Skipping duplicate tool call', { toolName, cacheKey })` |
| 246 | `console.log(\`[action] Tool '\${action.name}' executed...\`)` | Replace with `logger.debug('Tool executed successfully', { toolName })` |
| 274 | `console.error(\`[action] Tool '\${action.name}' failed:...\`)` | Replace with `logger.error('Tool execution failed', { toolName, error })` |
| 308 | `console.log(\`[observation] Processing...\`)` | Replace with `logger.debug('Processing observations', { count })` |

#### Reflection Pattern (11 instances)
**File:** `packages/patterns/src/reflection/nodes.ts`

| Line | Code | Recommendation |
|------|------|----------------|
| 39 | `console.log('[Generator] Generating initial response...')` | Replace with `logger.debug('Generating initial response')` |
| 65 | `console.log('[Generator] Generated response:...')` | Replace with `logger.debug('Generated response', { preview })` |
| 74 | `console.error('[Generator] Error:', error)` | Replace with `logger.error('Generator error', { error })` |
| 97 | `console.log('[Reflector] Reflecting on response...')` | Replace with `logger.debug('Reflecting on response')` |
| 186 | `console.log('[Reflector] Reflection score:', reflection.score)` | Replace with `logger.debug('Reflection score', { score })` |
| 187 | `console.log('[Reflector] Meets standards:', reflection.meetsStandards)` | Replace with `logger.debug('Meets standards', { meetsStandards })` |
| 195 | `console.error('[Reflector] Error:', error)` | Replace with `logger.error('Reflector error', { error })` |
| 217 | `console.log('[Reviser] Revising response...')` | Replace with `logger.debug('Revising response')` |
| 263 | `console.log('[Reviser] Created revision:...')` | Replace with `logger.debug('Created revision', { preview })` |
| 280 | `console.error('[Reviser] Error:', error)` | Replace with `logger.error('Reviser error', { error })` |

**Total Pattern Verbose Instances:** 38 console.log/error calls to replace

---

### Category 2: Monitoring/Alerts (MEDIUM PRIORITY)

These files use console.log for monitoring output and should use structured logging.

#### Alert System
**File:** `packages/core/src/monitoring/alerts.ts`

| Line | Code | Recommendation |
|------|------|----------------|
| 86 | `console.log(\`[ALERT] \${alert.severity}...\`)` | Replace with `logger.warn('Alert triggered', { alert })` or use callback |
| 105 | `console.error(\`Error checking rule...\`)` | Replace with `logger.error('Rule check failed', { ruleName, error })` |
| 133-142 | Multiple `console.log` for channels | Replace with `logger.info('Alert sent', { channel, alert })` or use callback |

#### Audit Logging
**File:** `packages/core/src/monitoring/audit.ts`

| Line | Code | Recommendation |
|------|------|----------------|
| 148 | `console.log(\`Exporting \${logs.length}...\`)` | Replace with `logger.info('Exporting audit logs', { count, path, format })` |
| 150 | `console.log(JSON.stringify(logs...))` | Keep for export functionality (writes to stdout) |
| 152 | `console.log(\`Exporting \${logs.length}...\`)` | Replace with `logger.info('Exporting audit logs', { count, path, format })` |
| 155 | `console.log(csv)` | Keep for export functionality (writes to stdout) |

**Total Monitoring Instances:** 7 console.log/error calls (4 to replace, 3 to keep for stdout export)

---

### Category 3: Tool Registry (LOW PRIORITY)

**File:** `packages/core/src/tools/registry.ts`

| Line | Code | Recommendation |
|------|------|----------------|
| 416 | `console.error(\`Error in event handler...\`)` | Replace with `logger.error('Event handler error', { event, error })` |

**File:** `packages/core/src/tools/lifecycle.ts`

| Line | Code | Recommendation |
|------|------|----------------|
| 76 | `this.cleanup().catch(console.error)` | Replace with `this.cleanup().catch(err => logger.error('Cleanup failed', { error: err }))` |

**Total Tool Registry Instances:** 2 console.error calls to replace

---

### Category 4: CLI Logger (KEEP AS-IS) ✅

**Files:** `packages/cli/src/utils/logger.ts` and all CLI commands

**Reason:** CLI logger intentionally uses console.log for user-facing output with colors and spinners. This is appropriate for CLI tools.

**Count:** 8 files, ~50+ console.log calls (all appropriate)

---

### Category 5: Examples and Templates (KEEP AS-IS) ✅

**Files:** All files in:
- `packages/*/examples/`
- `packages/cli/templates/`
- `examples/`

**Reason:** Examples and templates use console.log for demonstration purposes. This is appropriate and helps users understand output.

**Count:** 60+ files (all appropriate)

---

### Category 6: JSDoc Examples (KEEP AS-IS) ✅

**Files:** Various source files with JSDoc comments containing `console.log` in code examples

**Reason:** Documentation examples showing usage patterns. These are not executed code.

**Count:** 10+ instances (all appropriate)

---

## Summary Statistics

| Category | Files | Instances | Action Required |
|----------|-------|-----------|-----------------|
| Pattern Verbose Mode | 4 | 38 | ✅ **MIGRATE** to structured logging |
| Monitoring/Alerts | 2 | 4 | ✅ **MIGRATE** to structured logging |
| Tool Registry | 2 | 2 | ✅ **MIGRATE** to structured logging |
| CLI Logger | 8 | 50+ | ❌ **KEEP** (appropriate use) |
| Examples/Templates | 60+ | 200+ | ❌ **KEEP** (appropriate use) |
| JSDoc Examples | 10+ | 15+ | ❌ **KEEP** (documentation) |

**Total to Migrate:** 44 console.log/error calls across 8 source files

---

## Migration Priority

### Phase 2 (Core Patterns) - Week 2
1. ✅ **ReAct Pattern** - 8 instances in `packages/patterns/src/react/nodes.ts`
2. ✅ **Reflection Pattern** - 11 instances in `packages/patterns/src/reflection/nodes.ts`

### Phase 3 (Multi-Agent Cleanup) - Week 3
3. ✅ **Multi-Agent Pattern** - 19 instances in `packages/patterns/src/multi-agent/nodes.ts`
4. ✅ **Multi-Agent Agent** - 1 instance in `packages/patterns/src/multi-agent/agent.ts`

### Phase 4 (Core Components) - Week 4
5. ✅ **Monitoring Alerts** - 4 instances in `packages/core/src/monitoring/alerts.ts`
6. ✅ **Tool Registry** - 1 instance in `packages/core/src/tools/registry.ts`
7. ✅ **Tool Lifecycle** - 1 instance in `packages/core/src/tools/lifecycle.ts`

---

## Next Steps

1. ✅ Create logging standards document with code examples
2. ✅ Update `createPatternLogger` if needed
3. ✅ Begin Phase 2: Migrate ReAct and Reflection patterns
4. ✅ Continue with Phase 3: Multi-Agent cleanup
5. ✅ Complete Phase 4: Core components

