# ST-02002: Type-Safe SELECT Tool

**Status:** ✅ Ready for Review  
**PR:** [#30](https://github.com/TVScoundrel/agentforge/pull/30)  
**Epic:** 02 - Query Operations  
**Priority:** P0

## Overview

Implemented a type-safe SELECT tool using Drizzle ORM's query builder API. This tool provides a structured, LLM-friendly interface for executing SELECT queries with WHERE conditions, ORDER BY, LIMIT, OFFSET, and column selection.

## Implementation

### Core Components

1. **Relational SELECT Tool Module** (`packages/tools/src/data/relational/tools/relational-select/`)
   - `index.ts`: LangGraph tool built with `toolBuilder()` API
   - `schemas.ts`: Comprehensive Zod schema validation
   - `query-builder.ts`: SQL construction using Drizzle's `sql` template API
   - `executor.ts`: Execution and sanitized error handling
   - `identifier-utils.ts`: Identifier validation and vendor-aware quoting
   - `types.ts`: Shared types for tool input/output

### Query Building Approach

Instead of creating a separate query-builder.ts wrapper, this implementation uses Drizzle's native `sql` template API directly:

- **`sql.raw()`** - For static SQL fragments (e.g., `SELECT`, `FROM`)
- **`sql.join()`** - To concatenate SQL parts
- **`sql` template literals** - For safe parameter binding (e.g., `sql`${column} = ${value}``)

This approach:
- Leverages Drizzle's built-in type safety
- Avoids unnecessary abstraction layers
- Provides flexibility for dynamic query construction

### Features

#### WHERE Conditions

Supports all common comparison operators:

```typescript
{
  where: [
    { column: 'status', operator: 'eq', value: 'active' },
    { column: 'age', operator: 'gte', value: 18 },
    { column: 'email', operator: 'isNotNull' }
  ]
}
```

**Supported Operators:**
- `eq`, `ne` - Equality/inequality
- `gt`, `lt`, `gte`, `lte` - Numeric comparisons
- `like` - Pattern matching
- `in`, `notIn` - Array membership
- `isNull`, `isNotNull` - NULL checks

Multiple WHERE conditions are combined with AND logic.

#### ORDER BY

```typescript
{
  orderBy: [
    { column: 'created_at', direction: 'desc' },
    { column: 'name', direction: 'asc' }
  ]
}
```

- Support for multiple ORDER BY clauses
- `asc` and `desc` directions
- Applied in the order specified

#### Pagination

```typescript
{
  limit: 10,
  offset: 20
}
```

- `LIMIT` - Maximum number of rows to return (positive integer)
- `OFFSET` - Number of rows to skip (non-negative integer)
- Validated by Zod schema

#### Column Selection

```typescript
// Select specific columns
{ columns: ['id', 'name', 'email'] }

// Select all columns (omit columns parameter)
{ }
```

- Specify array of column names to select
- Omit for `SELECT *`
- Column names are properly quoted

### Security

- **SQL Injection Prevention**: All values are bound using Drizzle's `sql` template tag. Identifiers (table names, column names) are validated against a strict pattern and quoted using vendor-appropriate quoting (double quotes for PostgreSQL/SQLite, backticks for MySQL)
- **Error Sanitization**: Driver error messages are sanitized to a generic message for callers to avoid leaking sensitive information; detailed errors are logged server-side only
- **Connection Safety**: Connections are managed via `connect()`/`disconnect()` lifecycle and automatically closed in finally block

## Usage Example

```typescript
import { createLogger } from '@agentforge/core';
import { relationalSelect } from '@agentforge/tools';

const logger = createLogger('my-app');

const result = await relationalSelect.invoke({
  table: 'users',
  columns: ['id', 'name', 'email'],
  where: [
    { column: 'status', operator: 'eq', value: 'active' },
    { column: 'age', operator: 'gte', value: 18 }
  ],
  orderBy: [
    { column: 'created_at', direction: 'desc' }
  ],
  limit: 10,
  offset: 0,
  vendor: 'postgresql',
  connectionString: process.env.DATABASE_URL!
});

if (result.success) {
  logger.info(`Found ${result.rowCount} users`);
  logger.info('Users:', result.rows);
} else {
  logger.error('Query failed:', result.error);
}
```

## Testing

Created comprehensive tests under `packages/tools/tests/data/relational/relational-select/`:
- `schema-validation.test.ts` - input/schema validation behavior
- `tool-invocation.test.ts` - end-to-end tool invocation behavior
- `index.test.ts` - aggregate/entrypoint tests
- `test-utils.ts` - shared test helpers

### Schema Validation Coverage
- Valid SELECT query acceptance
- Columns array validation
- WHERE conditions validation
- ORDER BY clauses validation (including empty column rejection)
- LIMIT and OFFSET validation
- Invalid vendor rejection
- Empty table/connection string rejection
- Operator/value consistency checks (`isNull`, `isNotNull`, `in`, `notIn`)

### Tool Invocation Coverage
- Simple SELECT query
- Non-existent table handling
- Column selection (including exclusion of non-selected columns)
- LIMIT, OFFSET, and LIMIT + OFFSET combinations
- ORDER BY behavior validation
- WHERE filtering behavior validation

**Test Strategy**: Tests create a temporary SQLite database with test data for realistic integration testing.

## Dependencies

- ✅ ST-02001 (Raw SQL Query Execution Tool) - Merged 2026-02-17
- ✅ ST-01004 (Connection Lifecycle Management) - Merged 2026-02-18

## API Reference

### Input Schema

```typescript
{
  table: string;                    // Table name to select from
  columns?: string[];               // Columns to select (omit for SELECT *)
  where?: WhereCondition[];         // WHERE conditions (combined with AND)
  orderBy?: OrderByClause[];        // ORDER BY clauses
  limit?: number;                   // Maximum rows to return (positive integer)
  offset?: number;                  // Rows to skip (non-negative integer)
  vendor: 'postgresql' | 'mysql' | 'sqlite';
  connectionString: string;         // Database connection string
}
```

### Output Schema

```typescript
{
  success: boolean;
  rows?: unknown[];                 // Query results
  rowCount?: number;                // Number of rows returned
  executionTime?: number;           // Execution time in milliseconds
  error?: string;                   // Error message if success=false
}
```
