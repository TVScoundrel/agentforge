# ST-02002: Type-Safe SELECT Tool

**Status:** 🚧 In Progress  
**PR:** [#30](https://github.com/TVScoundrel/agentforge/pull/30)  
**Epic:** 02 - Query Operations  
**Priority:** P0

## Overview

Implemented a type-safe SELECT tool using Drizzle ORM's query builder API. This tool provides a structured, LLM-friendly interface for executing SELECT queries with WHERE conditions, ORDER BY, LIMIT, OFFSET, and column selection.

## Implementation

### Core Components

1. **Relational SELECT Tool** (`packages/tools/src/data/relational/tools/relational-select.ts`)
   - LangGraph tool built with `toolBuilder()` API
   - Category: `ToolCategory.DATABASE`
   - Uses Drizzle's `sql` template API for query construction
   - Comprehensive Zod schema validation
   - Automatic connection lifecycle management

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

- **SQL Injection Prevention**: All values are bound using Drizzle's `sql` template tag
- **Error Sanitization**: Error messages are sanitized to avoid leaking sensitive information
- **Connection Safety**: Connections are automatically closed in finally block

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

Created comprehensive unit tests (`packages/tools/tests/data/relational/relational-select-tool.test.ts`):

### Schema Validation Tests (8 passed)
- ✅ Valid SELECT query acceptance
- ✅ Columns array validation
- ✅ WHERE conditions validation
- ✅ ORDER BY clauses validation
- ✅ LIMIT and OFFSET validation
- ✅ Invalid vendor rejection
- ✅ Negative limit rejection
- ✅ Negative offset rejection

### Tool Invocation Tests (6 skipped - SQLite bindings not available)
- Simple SELECT query
- Non-existent table handling
- Column selection
- LIMIT application
- OFFSET application
- LIMIT + OFFSET combination

**Test Strategy**: Tests use subqueries (e.g., `SELECT 1 as id UNION SELECT 2`) to avoid requiring pre-existing database tables, making them more portable.

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

