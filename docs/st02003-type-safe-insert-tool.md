# ST-02003: Type-Safe INSERT Tool

**Status:** 🚧 Draft PR  
**PR:** [#34](https://github.com/TVScoundrel/agentforge/pull/34)  
**Epic:** 02 - Query Operations  
**Priority:** P0

## Overview

Implemented a type-safe INSERT tool that provides structured single-row and batch insert operations without requiring raw SQL. The tool supports configurable return behavior (`none`, `id`, `row`), validates input payloads, and returns clear constraint-violation messages for common database errors.

## Implementation

### Core Components

1. **Shared INSERT Query Builder**
   - `packages/tools/src/data/relational/query/query-builder.ts`
   - Builds parameterized INSERT SQL for single-row and batch inputs
   - Handles default values in batch mode by emitting `DEFAULT` for missing columns
   - Applies vendor-aware `RETURNING` behavior

2. **Relational INSERT Tool Module** (`packages/tools/src/data/relational/tools/relational-insert/`)
   - `index.ts`: LangGraph tool built with `toolBuilder()` API
   - `schemas.ts`: Zod validation schema for insert payloads and returning options
   - `types.ts`: Shared input/output types
   - `executor.ts`: Execution, result normalization, and ID derivation
   - `error-utils.ts`: Safe error classification for validation and constraint violations

3. **Tool Export Integration**
   - `packages/tools/src/data/relational/tools/index.ts` now exports `relationalInsert`

## Supported Behaviors

### Single-Row and Batch Inserts

- Accepts one row object or an array of row objects
- Supports mixed-shape batch rows by using the union of columns and `DEFAULT` for omitted fields

### Returning Modes

- `none` (default): returns row count only
- `id`: returns inserted IDs (from `RETURNING`, explicit input IDs, or vendor metadata fallback)
- `row`: returns full inserted rows for vendors that support `RETURNING`

### Vendor-Specific RETURNING Differences

- PostgreSQL / SQLite: use `RETURNING`
- MySQL: `RETURNING row` is rejected with a clear message; `id` mode falls back to insert metadata where available

### Validation and Error Handling

- Validates table and column identifiers
- Validates payload shape and returning config
- Maps common constraint errors to clear, safe messages:
  - unique constraint violations
  - foreign key violations
  - NOT NULL violations

## Testing

Added tests under `packages/tools/tests/data/relational/relational-insert/`:

- `schema-validation.test.ts`
- `query-builder.test.ts`
- `tool-invocation.test.ts`
- `index.test.ts`
- `test-utils.ts`

### Coverage Highlights

- Valid/invalid schema cases
- Single insert and batch insert execution
- Default values and auto-increment behavior
- `RETURNING id` and `RETURNING row` behavior
- Constraint-violation error classification
- MySQL-specific unsupported `RETURNING row` behavior

## Usage Example

```typescript
import { relationalInsert } from '@agentforge/tools';

const result = await relationalInsert.invoke({
  table: 'users',
  data: { name: 'Alice', email: 'alice@example.com' },
  returning: { mode: 'id', idColumn: 'id' },
  vendor: 'postgresql',
  connectionString: process.env.DATABASE_URL!,
});

if (result.success) {
  console.log(result.rowCount, result.insertedIds);
} else {
  console.error(result.error);
}
```

## Dependencies

- ✅ ST-02002 (Type-Safe SELECT Tool) - merged 2026-02-18
