# ST-02001: Raw SQL Query Execution Tool

**Status:** ✅ Complete  
**PR:** [#28](https://github.com/TVScoundrel/agentforge/pull/28)  
**Epic:** 02 - Query Operations  
**Priority:** P0

## Overview

Implemented a LangGraph tool for executing raw SQL queries against relational databases (PostgreSQL, MySQL, SQLite) with proper parameter binding to prevent SQL injection.

## Implementation

### Core Components

1. **Query Types** (`packages/tools/src/data/relational/query/types.ts`)
   - `QueryParams`: Supports positional (array) or named (object) parameters
   - `QueryInput`: Complete query input interface
   - `QueryExecutionResult`: Standardized result format

2. **Query Executor** (`packages/tools/src/data/relational/query/query-executor.ts`)
   - `buildParameterizedQuery()`: Converts SQL with placeholders to Drizzle SQL template
     - Handles positional parameters: `$1`, `$2` (PostgreSQL) and `?` (MySQL/SQLite)
     - Handles named parameters: `:name`, `:age`
     - Uses Drizzle's `sql` template tag for safe parameter binding
   - `executeQuery()`: Executes parameterized queries through ConnectionManager
     - Returns formatted results with rows, rowCount, executionTime
     - Sanitizes error messages to avoid leaking sensitive information
     - Uses hierarchical logger: `agentforge:tools:data:relational:query`

3. **Relational Query Tool** (`packages/tools/src/data/relational/tools/relational-query.ts`)
   - LangGraph tool built with `toolBuilder()` API
   - Category: `ToolCategory.DATABASE`
   - Zod schema validation for all inputs
   - Comprehensive examples (SELECT, INSERT, UPDATE)
   - Automatic connection lifecycle management

### Parameter Binding

The implementation supports two parameter styles:

**Positional Parameters:**
```typescript
// PostgreSQL style
{ sql: 'SELECT * FROM users WHERE id = $1', params: [42] }

// MySQL/SQLite style
{ sql: 'SELECT * FROM users WHERE id = ?', params: [42] }
```

**Named Parameters:**
```typescript
{
  sql: 'INSERT INTO users (name, email) VALUES (:name, :email)',
  params: { name: 'John', email: 'john@example.com' }
}
```

### Security

- **SQL Injection Prevention**: All parameters are bound using Drizzle's `sql` template tag
- **Error Sanitization**: Error messages are sanitized to avoid leaking sensitive information (e.g., IP addresses)
- **Connection Safety**: Connections are automatically closed in finally block

## Testing

Created comprehensive unit tests:

1. **Query Executor Tests** (`packages/tools/tests/data/relational/query-executor.test.ts`)
   - 7 tests covering SELECT, INSERT, UPDATE, DELETE
   - Tests with and without parameters
   - Error handling and message sanitization
   - Conditional execution using `it.skipIf(!hasSQLiteBindings)`

2. **Tool Tests** (`packages/tools/tests/data/relational/relational-query-tool.test.ts`)
   - Tests covering metadata, schema validation, and invocation
   - Tests for positional and named parameters
   - Error handling tests
   - Note: timeout and maxRows are planned features (not yet implemented)

**Test Results:**
- All tests passing in full suite
- Conditional tests skipped when SQLite bindings unavailable

## Quality Gates

- ✅ **Tests:** All tests passing (32 passed, 19 skipped)
- ✅ **Lint:** All ST-02001 files lint-clean (no errors, no warnings)
- ✅ **Type Safety:** Full TypeScript type coverage
- ✅ **Security:** Parameter binding prevents SQL injection
- ✅ **Logging:** Hierarchical logger with proper context

## Usage Example

```typescript
import { relationalQuery } from '@agentforge/tools';
import { createLogger } from '@agentforge/core';

const logger = createLogger('my-app:database');

// Execute a SELECT query
const result = await relationalQuery.invoke({
  sql: 'SELECT * FROM users WHERE status = $1',
  params: ['active'],
  vendor: 'postgresql',
  connectionString: 'postgresql://user:pass@localhost:5432/mydb'
});

logger.info('Query executed', {
  rowCount: result.rowCount,
  executionTime: result.executionTime
});

// Access query results
// result.rows - Query results
// result.rowCount - Number of rows
// result.executionTime - Execution time in ms
```

## Dependencies

- Drizzle ORM (`drizzle-orm@^0.45.1`)
- Database drivers (peer dependencies):
  - PostgreSQL: `pg`, `@types/pg`
  - MySQL: `mysql2`
  - SQLite: `better-sqlite3`, `@types/better-sqlite3`

## Limitations

1. Requires database-specific driver as peer dependency
2. Connection string must be valid for the specified vendor
3. Large result sets may impact performance

## Future Enhancements

- Transaction support (ST-02002)
- Query timeout configuration
- Result row limiting (maxRows parameter)
- Batch query execution
- Query result streaming for large datasets
- Query plan analysis and optimization hints

## Related Stories

- **ST-01001**: Setup Drizzle ORM Dependencies ✅
- **ST-01002**: Implement Connection Manager ✅
- **ST-01003**: Implement Connection Pooling ✅
- **ST-02002**: Implement Transaction Support (Next)

