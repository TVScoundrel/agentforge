# API Reference — Schema Inspector

`SchemaInspector` provides runtime introspection of database schemas — tables, columns, primary keys, foreign keys, and indexes — across PostgreSQL, MySQL, and SQLite.

## Import

```typescript
import {
  SchemaInspector,
  type DatabaseSchema,
  type TableSchema,
  type ColumnSchema,
  type IndexSchema,
  type ForeignKeySchema,
  type SchemaInspectOptions,
  type SchemaInspectorConfig,
} from '@agentforge/tools';
```

---

## Constructor

```typescript
new SchemaInspector(
  manager: ConnectionManager,
  vendor: DatabaseVendor,
  config?: SchemaInspectorConfig
)
```

### SchemaInspectorConfig

| Field | Type | Default | Description |
|---|---|---|---|
| `cacheTtlMs` | `number` | `60000` | Cache TTL in milliseconds (0 = no caching) |
| `cacheKey` | `string` | — | Cache key for multi-database scoping |

---

## Methods

### inspect(options?)

```typescript
async inspect(options?: SchemaInspectOptions): Promise<DatabaseSchema>
```

Introspects the database schema. Returns cached results when available.

#### SchemaInspectOptions

| Field | Type | Description |
|---|---|---|
| `tables` | `string[]` | Filter to specific tables |
| `bypassCache` | `boolean` | Skip cache and fetch from database |

### invalidateCache()

```typescript
invalidateCache(): void
```

Invalidates the cache entry for this inspector's `cacheKey`.

### SchemaInspector.clearCache(cacheKey?)

```typescript
static clearCache(cacheKey?: string): void
```

Clears a specific cache entry, or all entries if no key is provided.

---

## Types

### DatabaseSchema

```typescript
interface DatabaseSchema {
  vendor: DatabaseVendor;
  tables: TableSchema[];
}
```

### TableSchema

```typescript
interface TableSchema {
  name: string;
  schema?: string;         // Schema name (PostgreSQL); undefined for MySQL/SQLite
  columns: ColumnSchema[];
  indexes: IndexSchema[];
  foreignKeys: ForeignKeySchema[];
}
```

### ColumnSchema

```typescript
interface ColumnSchema {
  name: string;
  type: string;            // Vendor-specific type (e.g. 'integer', 'varchar', 'TEXT')
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
}
```

### IndexSchema

```typescript
interface IndexSchema {
  name: string;
  columns: string[];
  unique: boolean;
}
```

### ForeignKeySchema

```typescript
interface ForeignKeySchema {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
}
```

---

## Schema Validation Utilities

```typescript
import {
  validateTableExists,
  validateColumnsExist,
  validateColumnTypes,
  type ValidationResult,
} from '@agentforge/tools';
```

### validateTableExists(schema, tableName)

Returns a `ValidationResult` indicating whether the table exists in the schema.

### validateColumnsExist(table, columnNames)

Checks that all specified columns exist in the table schema.

### validateColumnTypes(table, columnTypeMap)

Validates that columns have the expected types.

### ValidationResult

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

---

## Type Mapper

```typescript
import { mapColumnType, mapSchemaTypes, getVendorTypeMap, type MappedType } from '@agentforge/tools';
```

### mapColumnType(vendor, columnType)

Maps a vendor-specific column type to a normalized `MappedType`:

```typescript
interface MappedType {
  typescript: string;  // e.g. 'string', 'number', 'boolean'
  json: string;        // e.g. 'string', 'integer', 'boolean'
}
```

---

## Schema Diff

```typescript
import {
  diffSchemas,
  exportSchemaToJson,
  importSchemaFromJson,
  type SchemaDiffResult,
  type TableDiff,
  type ColumnDiff,
} from '@agentforge/tools';
```

### diffSchemas(before, after)

```typescript
function diffSchemas(before: DatabaseSchema, after: DatabaseSchema): SchemaDiffResult
```

Computes the diff between two schema snapshots — added/removed/modified tables and columns.

### exportSchemaToJson(schema) / importSchemaFromJson(json)

Serialization helpers for storing and comparing schema snapshots.
