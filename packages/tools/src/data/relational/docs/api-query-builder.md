# API Reference — Query Builder

Low-level query building functions used internally by the LangGraph tools. You can use these directly when composing custom query pipelines.

## Import

```typescript
import {
  // SELECT
  buildSelectQuery,
  type SelectQueryInput,
  type SelectWhereCondition,
  type SelectOrderBy,
  type SelectOrderDirection,

  // INSERT
  buildInsertQuery,
  type InsertQueryInput,
  type InsertData,
  type InsertRow,
  type InsertValue,
  type InsertReturningMode,
  type InsertReturningOptions,
  type BuiltInsertQuery,

  // UPDATE
  buildUpdateQuery,
  type UpdateQueryInput,
  type UpdateData,
  type UpdateValue,
  type UpdateWhereCondition,
  type UpdateWhereOperator,
  type UpdateOptimisticLock,
  type BuiltUpdateQuery,

  // DELETE
  buildDeleteQuery,
  type DeleteQueryInput,
  type DeleteWhereCondition,
  type DeleteSoftDeleteOptions,
  type BuiltDeleteQuery,
} from '@agentforge/tools';
```

---

## buildSelectQuery(input)

```typescript
function buildSelectQuery(input: SelectQueryInput): SQL
```

Builds a parameterized `SELECT` statement.

### SelectQueryInput

| Field | Type | Description |
|---|---|---|
| `table` | `string` | Table name (schema-qualified allowed) |
| `columns` | `string[]` | Columns to select (default: `*`) |
| `where` | `SelectWhereCondition[]` | WHERE conditions (AND-combined) |
| `orderBy` | `SelectOrderBy[]` | ORDER BY clauses |
| `limit` | `number` | LIMIT |
| `offset` | `number` | OFFSET |
| `vendor` | `DatabaseVendor` | Target database vendor |

Returns a Drizzle `SQL` object ready for execution.

---

## buildInsertQuery(input)

```typescript
function buildInsertQuery(input: InsertQueryInput): BuiltInsertQuery
```

Builds a parameterized `INSERT` statement with optional `RETURNING`.

### InsertQueryInput

| Field | Type | Description |
|---|---|---|
| `table` | `string` | Target table |
| `data` | `InsertRow \| InsertRow[]` | Row data |
| `returning` | `InsertReturningOptions` | Returning mode |
| `vendor` | `DatabaseVendor` | Target vendor |

### BuiltInsertQuery

| Field | Type | Description |
|---|---|---|
| `query` | `SQL` | The parameterized INSERT statement |
| `rows` | `InsertRow[]` | Normalized rows |
| `returningMode` | `InsertReturningMode` | `'none'`, `'id'`, or `'row'` |
| `idColumn` | `string` | Primary key column name |
| `supportsReturning` | `boolean` | Whether the vendor supports RETURNING |

---

## buildUpdateQuery(input)

```typescript
function buildUpdateQuery(input: UpdateQueryInput): BuiltUpdateQuery
```

Builds a parameterized `UPDATE` statement with WHERE conditions and optional optimistic locking.

### UpdateQueryInput

| Field | Type | Description |
|---|---|---|
| `table` | `string` | Target table |
| `data` | `UpdateData` | Column-value pairs to set |
| `where` | `UpdateWhereCondition[]` | WHERE conditions |
| `optimisticLock` | `UpdateOptimisticLock` | Optional version check |
| `vendor` | `DatabaseVendor` | Target vendor |

---

## buildDeleteQuery(input)

```typescript
function buildDeleteQuery(input: DeleteQueryInput): BuiltDeleteQuery
```

Builds a `DELETE` (or soft-delete `UPDATE`) statement.

### DeleteQueryInput

| Field | Type | Description |
|---|---|---|
| `table` | `string` | Target table |
| `where` | `DeleteWhereCondition[]` | WHERE conditions |
| `softDelete` | `DeleteSoftDeleteOptions` | Optional soft delete config |
| `vendor` | `DatabaseVendor` | Target vendor |

---

## Query Executor

```typescript
import { executeQuery } from '@agentforge/tools';
import type { QueryInput, QueryExecutionResult } from '@agentforge/tools';
```

### executeQuery(manager, input, context?)

```typescript
async function executeQuery(
  manager: ConnectionManager,
  input: QueryInput,
  context?: { transaction?: TransactionContext }
): Promise<QueryExecutionResult>
```

Executes a raw SQL query with full validation pipeline:
1. Validates SQL string (blocks DDL)
2. Enforces parameterized query usage for mutations
3. Builds parameterized Drizzle SQL object
4. Executes via ConnectionManager (or transaction context)
5. Returns rows, rowCount, and execution time

### QueryInput

| Field | Type | Description |
|---|---|---|
| `sql` | `string` | Raw SQL string |
| `params` | `unknown[] \| Record<string, unknown>` | Parameters |

---

## Batch Executor

```typescript
import {
  executeBatchedTask,
  benchmarkBatchExecution,
  DEFAULT_BATCH_SIZE,
  MAX_BATCH_SIZE,
  type BatchExecutionOptions,
  type BatchExecutionResult,
} from '@agentforge/tools';
```

### executeBatchedTask(items, options, processor)

Generic batched executor that chunks items and processes them with retries and progress callbacks.

| Option | Type | Default | Description |
|---|---|---|---|
| `batchSize` | `number` | `100` | Items per chunk |
| `continueOnError` | `boolean` | `false` | Continue on chunk failure |
| `maxRetries` | `number` | `0` | Retry attempts (max: 5) |
| `retryDelayMs` | `number` | `0` | Retry delay (ms) |
| `onProgress` | `(progress) => void` | — | Progress callback |

---

## Stream Executor

```typescript
import {
  streamSelectChunks,
  createSelectReadableStream,
  executeStreamingSelect,
  benchmarkStreamingSelectMemory,
  DEFAULT_CHUNK_SIZE,
  type StreamingSelectOptions,
  type StreamingSelectResult,
} from '@agentforge/tools';
```

### executeStreamingSelect(executor, input, options?)

Streams SELECT results in chunks using LIMIT/OFFSET pagination.

| Option | Type | Default | Description |
|---|---|---|---|
| `chunkSize` | `number` | `100` | Rows per chunk (max: 5000) |
| `maxRows` | `number` | — | Maximum total rows |
| `collectAllRows` | `boolean` | `false` | Collect all chunks into result |
| `signal` | `AbortSignal` | — | Cancellation signal |
| `onChunk` | `(chunk) => void` | — | Chunk callback |

---

## Transactions

```typescript
import {
  withTransaction,
  type TransactionOptions,
  type TransactionIsolationLevel,
  type TransactionContext,
} from '@agentforge/tools';
```

### withTransaction(manager, callback, options?)

```typescript
async function withTransaction<T>(
  manager: ConnectionManager,
  callback: (tx: TransactionContext) => Promise<T>,
  options?: TransactionOptions
): Promise<T>
```

Executes a callback within a database transaction. Commits on success, rolls back on error.

### TransactionOptions

| Option | Type | Description |
|---|---|---|
| `isolationLevel` | `TransactionIsolationLevel` | `'read uncommitted'`, `'read committed'`, `'repeatable read'`, `'serializable'` |
| `timeoutMs` | `number` | Transaction timeout (ms) |

### TransactionContext

Extends `SqlExecutor` with:

| Method | Description |
|---|---|
| `execute(query: SQL)` | Execute SQL within the transaction |
| `isActive()` | Check if transaction is still active |
| `commit()` | Manually commit |
| `rollback()` | Manually rollback |
| `createSavepoint(name?)` | Create a named savepoint |
| `rollbackToSavepoint(name)` | Rollback to savepoint |
| `releaseSavepoint(name)` | Release savepoint |
| `withSavepoint(callback, name?)` | Execute within a nested savepoint |
