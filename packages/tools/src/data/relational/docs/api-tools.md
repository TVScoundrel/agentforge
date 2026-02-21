# API Reference — LangGraph Tools

All tools are self-contained — each invocation creates a connection, executes the operation, and closes the connection. They are designed for agent use via LangGraph's tool-calling protocol.

## Import

```typescript
import {
  relationalQuery,
  relationalSelect,
  relationalInsert,
  relationalUpdate,
  relationalDelete,
  relationalGetSchema,
} from '@agentforge/tools';
```

---

## relationalQuery

Execute raw SQL queries with parameter binding.

**Name:** `relational-query`
**Category:** `DATABASE`

### Input Schema

| Field | Type | Required | Description |
|---|---|---|---|
| `sql` | `string` | Yes | SQL query string |
| `params` | `unknown[] \| Record<string, unknown>` | No | Positional (`[$1, $2]`) or named (`{ name: 'Alice' }`) parameters |
| `vendor` | `'postgresql' \| 'mysql' \| 'sqlite'` | Yes | Database vendor |
| `connectionString` | `string` | Yes | Database connection string |

### Behavior

- Validates SQL: blocks DDL (`CREATE`, `DROP`, `TRUNCATE`, `ALTER`)
- Enforces parameterized queries for mutation statements (`INSERT`, `UPDATE`, `DELETE`)
- Supports `$1`, `?`, and `:name` placeholder styles
- Returns `{ data, metadata: { rowCount, executionTime } }`

---

## relationalSelect

Type-safe SELECT queries.

**Name:** `relational-select`
**Category:** `DATABASE`

### Input Schema

| Field | Type | Required | Description |
|---|---|---|---|
| `table` | `string` | Yes | Table name (supports schema qualification, e.g. `public.users`) |
| `columns` | `string[]` | No | Columns to select (default: all) |
| `where` | `WhereCondition[]` | No | Filter conditions |
| `orderBy` | `OrderBy[]` | No | Sort order |
| `limit` | `number` | No | Maximum rows to return |
| `offset` | `number` | No | Rows to skip |
| `streaming` | `StreamingOptions` | No | Enable chunked streaming for large result sets |
| `vendor` | `'postgresql' \| 'mysql' \| 'sqlite'` | Yes | Database vendor |
| `connectionString` | `string` | Yes | Connection string |

### WhereCondition

```typescript
{
  column: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'in' | 'notIn' | 'isNull' | 'isNotNull';
  value?: string | number | boolean | (string | number)[] | null;
}
```

- `isNull` / `isNotNull` — no `value` required
- `in` / `notIn` — requires a non-empty array
- `like` — requires a string value

### OrderBy

```typescript
{ column: string; direction: 'asc' | 'desc' }
```

### Response

```typescript
{
  success: boolean;
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
  streaming?: { totalChunks: number; };
}
```

---

## relationalInsert

Type-safe INSERT queries with single-row and batch support.

**Name:** `relational-insert`
**Category:** `DATABASE`

### Input Schema

| Field | Type | Required | Description |
|---|---|---|---|
| `table` | `string` | Yes | Table name |
| `data` | `Record \| Record[]` | Yes | Single row or array of rows |
| `returning` | `ReturningOptions` | No | What to return after insert |
| `batch` | `BatchOptions` | No | Batch execution settings |
| `vendor` | `'postgresql' \| 'mysql' \| 'sqlite'` | Yes | Database vendor |
| `connectionString` | `string` | Yes | Connection string |

### ReturningOptions

```typescript
{
  mode: 'none' | 'id' | 'row';  // default: 'none'
  idColumn?: string;              // required when mode is 'id'
}
```

- `'none'` — No return data
- `'id'` — Return the generated primary key
- `'row'` — Return the full inserted row (PostgreSQL/SQLite 3.35+ only)

### BatchOptions

| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | `true` | Enable batch chunking |
| `batchSize` | `number` | `100` | Rows per chunk (max: 5000) |
| `continueOnError` | `boolean` | `true` | Keep processing on chunk failure |
| `maxRetries` | `number` | `0` | Retry attempts per failed chunk (max: 5) |
| `retryDelayMs` | `number` | `0` | Delay between retries (ms, max: 60000) |
| `benchmark` | `boolean` | `false` | Collect batch vs individual execution metrics |

### Response

```typescript
{
  success: boolean;
  rowCount: number;
  insertedIds?: unknown[];
  rows?: Record<string, unknown>[];
  executionTime: number;
  batch?: { totalBatches: number; failures: BatchFailureDetail[] };
}
```

---

## relationalUpdate

Type-safe UPDATE queries with WHERE, optimistic locking, and batch support.

**Name:** `relational-update`
**Category:** `DATABASE`

### Input Schema

| Field | Type | Required | Description |
|---|---|---|---|
| `table` | `string` | Yes | Table name |
| `data` | `Record<string, scalar>` | Yes (single mode) | Column-value pairs to set |
| `where` | `WhereCondition[]` | Yes (single mode) | Filter conditions — **required** to prevent accidental full-table updates |
| `optimisticLock` | `OptimisticLock` | No | Optimistic locking configuration |
| `operations` | `UpdateOperation[]` | No (batch mode) | Array of update operations |
| `batch` | `BatchOptions` | No | Batch execution settings |
| `vendor` / `connectionString` | — | Yes | As above |

### OptimisticLock

```typescript
{
  column: string;         // Version or timestamp column
  expectedValue: unknown; // Expected current value
}
```

Appends an additional WHERE condition that checks the lock column. If zero rows match, the update reports a conflict.

---

## relationalDelete

Type-safe DELETE queries with WHERE, soft delete, and batch support.

**Name:** `relational-delete`
**Category:** `DATABASE`

### Input Schema

| Field | Type | Required | Description |
|---|---|---|---|
| `table` | `string` | Yes | Table name |
| `where` | `WhereCondition[]` | Yes (single mode) | Filter conditions — **required** |
| `softDelete` | `SoftDeleteOptions` | No | Convert to UPDATE setting a timestamp column |
| `operations` | `DeleteOperation[]` | No (batch mode) | Array of delete operations |
| `batch` | `BatchOptions` | No | Batch execution settings |
| `vendor` / `connectionString` | — | Yes | As above |

### SoftDeleteOptions

```typescript
{
  column: string;   // Column to set (e.g. 'deleted_at')
  value?: unknown;  // Value to set (default: current timestamp)
}
```

When `softDelete` is provided, the DELETE is converted to an UPDATE that sets the specified column.

---

## relationalGetSchema

Introspect database schema metadata.

**Name:** `relational-get-schema`
**Category:** `DATABASE`

### Input Schema

| Field | Type | Required | Description |
|---|---|---|---|
| `vendor` | `'postgresql' \| 'mysql' \| 'sqlite'` | Yes | Database vendor |
| `connectionString` | `string` | Yes | Connection string |
| `database` | `string` | No | Logical database name for cache scoping |
| `tables` | `string[]` | No | Filter to specific tables |
| `cacheTtlMs` | `number` | No | Cache TTL in ms (0 disables caching) |
| `refreshCache` | `boolean` | No | Force cache invalidation |

### Response

```typescript
{
  success: boolean;
  vendor: string;
  tables: TableSchema[];
}
```

### TableSchema

```typescript
{
  name: string;
  schema?: string;
  columns: ColumnSchema[];
  indexes: IndexSchema[];
  foreignKeys: ForeignKeySchema[];
}
```

### ColumnSchema

```typescript
{
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
}
```
