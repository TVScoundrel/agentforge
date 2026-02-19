# ST-02004: Type-Safe UPDATE Tool

**Status:** 👀 In Review  
**PR:** [#35](https://github.com/TVScoundrel/agentforge/pull/35)  
**Epic:** 02 - Query Operations  
**Priority:** P0

## Overview

Implemented a type-safe UPDATE tool that provides structured update operations with explicit safety controls. The tool requires WHERE conditions by default, supports optional optimistic locking, and returns affected-row count for caller visibility.

## Implementation

### Core Components

1. **Shared UPDATE Query Builder**
   - `packages/tools/src/data/relational/query/query-builder.ts`
   - Added `buildUpdateQuery()` with:
     - validated table/column identifiers
     - parameterized SET clauses
     - WHERE condition support (`eq`, `ne`, `gt`, `lt`, `gte`, `lte`, `like`, `in`, `notIn`, `isNull`, `isNotNull`)
     - full-table update protection (requires explicit `allowFullTableUpdate` override)
     - optional optimistic-lock condition appended to WHERE

2. **Relational UPDATE Tool Module** (`packages/tools/src/data/relational/tools/relational-update/`)
   - `index.ts`: LangGraph tool built with `toolBuilder()` API
   - `schemas.ts`: Zod validation with safety constraints
   - `types.ts`: Input/output and response types
   - `executor.ts`: Query execution, row-count normalization, and optimistic-lock stale detection
   - `error-utils.ts`: Safe validation/constraint error mapping

3. **Tool Export Integration**
   - `packages/tools/src/data/relational/tools/index.ts` now exports `relationalUpdate`

## Safety and Behavior

### WHERE Condition Safety

- UPDATE without WHERE is blocked by default
- Full-table update requires explicit `allowFullTableUpdate: true`

### Row Count Return

- Returns `rowCount` for affected rows across vendors using normalized result extraction

### Optional Optimistic Locking

- Supports `optimisticLock` with `column` + `expectedValue`
- If no rows are affected under optimistic lock, returns clear stale-update error:
  - `Update failed: optimistic lock check failed.`

### Constraint Handling

Maps common constraint failures to safe user-facing messages:
- unique constraint violations
- foreign key violations
- NOT NULL violations

## Testing

Added tests under `packages/tools/tests/data/relational/relational-update/`:

- `schema-validation.test.ts`
- `query-builder.test.ts`
- `tool-invocation.test.ts`
- `index.test.ts`
- `test-utils.ts`

### Coverage Highlights

- schema validation for safety constraints and operator/value consistency
- query-builder behavior for safe WHERE requirements and full-table override
- optimistic lock condition behavior and stale-update detection
- affected-row count behavior via tool invocation
- full-table update prevention test coverage

## Usage Example

```typescript
import { createLogger } from '@agentforge/core';
import { relationalUpdate } from '@agentforge/tools';

const logger = createLogger('my-app');

const result = await relationalUpdate.invoke({
  table: 'users',
  data: { status: 'inactive' },
  where: [{ column: 'id', operator: 'eq', value: 123 }],
  optimisticLock: { column: 'version', expectedValue: 5 },
  vendor: 'postgresql',
  connectionString: process.env.DATABASE_URL!,
});

if (result.success) {
  logger.info('Update completed', { rowCount: result.rowCount });
} else {
  logger.error('Update failed', { error: result.error });
}
```

## Dependencies

- ✅ ST-02003 (Type-Safe INSERT Tool) - merged 2026-02-19
