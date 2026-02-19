# ST-03002: Schema Metadata Utilities

**Status:** In Progress  
**Epic:** EP-03 (Schema Introspection and Metadata)  
**Branch:** `feat/st-03002-schema-metadata-utilities`  
**PR:** [#37](https://github.com/TVScoundrel/agentforge/pull/37)

---

## Overview

Schema metadata utilities that enable tools and agents to validate queries against an introspected database schema. Builds on the schema introspection foundation from ST-03001.

### Components

1. **Schema Validator** (`schema-validator.ts`)  
   - `validateTableExists()` — checks a table exists, supports schema-qualified names
   - `validateColumnsExist()` — checks columns exist in a table
   - `validateColumnTypes()` — validates column types with case-insensitive partial matching

2. **Type Mapper** (`type-mapper.ts`)  
   - `mapColumnType()` — maps a single DB type to TypeScript (strips suffixes, handles nullable)
   - `mapSchemaTypes()` — maps all columns across tables in bulk
   - `getVendorTypeMap()` — returns a read-only copy of a vendor's type mapping table
   - Covers PostgreSQL (40+ types), MySQL (30+ types), SQLite (20+ types)
   - Safety-first defaults: `bigint` → `string` (PostgreSQL/MySQL) to avoid JS precision loss

3. **Schema Diff** (`schema-diff.ts`)  
   - `diffSchemas()` — structured comparison of two `DatabaseSchema` instances
   - Detects: added/removed/changed tables, added/removed/changed columns, primary key changes
   - `exportSchemaToJson()` — deterministic JSON serialisation for snapshot testing
   - `importSchemaFromJson()` — validated JSON import with structural checks

### Public API

All utilities are exported from `schema/index.ts` and available via the tools package.

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Partial type matching for `validateColumnTypes` | DB types vary across vendors (`varchar(255)`, `character varying`), substring matching avoids false negatives |
| `bigint` → `string` in PostgreSQL/MySQL | JavaScript `number` loses precision beyond 2^53; explicit notes are added |
| `boolean` → `number` in SQLite | SQLite stores booleans as 0/1 integers |
| Case-insensitive comparison everywhere | DB object names are case-insensitive in most databases |
| JSON export is deterministic (sorted, 2-space indent) | Enables snapshot testing and diffing |

---

## Usage Examples

### Validate table before querying

```typescript
import { SchemaInspector, validateTableExists, validateColumnsExist } from '@agentforge/tools';

const schema = await SchemaInspector.inspect(manager, 'postgresql');

const tableResult = validateTableExists(schema, 'users');
if (!tableResult.valid) {
  console.error(tableResult.errors);
}

const colResult = validateColumnsExist(schema, 'users', ['id', 'email']);
if (!colResult.valid) {
  console.error(colResult.errors);
}
```

### Map DB types to TypeScript

```typescript
import { mapColumnType, getVendorTypeMap } from '@agentforge/tools';

const mapped = mapColumnType('postgresql', 'varchar(255)', true);
// { tsType: 'string', nullable: true, dbType: 'varchar(255)' }

const allTypes = getVendorTypeMap('mysql');
// { int: 'number', varchar: 'string', ... }
```

### Compare schemas

```typescript
import { diffSchemas, exportSchemaToJson, importSchemaFromJson } from '@agentforge/tools';

const baseline = importSchemaFromJson(savedSnapshot);
const current = await SchemaInspector.inspect(manager, 'postgresql');

const diff = diffSchemas(baseline, current);
if (!diff.identical) {
  console.log(`Changes: ${diff.summary.tablesAdded} added, ${diff.summary.columnsChanged} changed`);
}
```

---

## Test Coverage

- **schema-validator.test.ts** — 19 tests: table existence, column existence, column type validation, edge cases
- **type-mapper.test.ts** — 31 tests: PostgreSQL, MySQL, SQLite type mapping, suffix stripping, nullable, unknown types
- **schema-diff.test.ts** — 18 tests: diff detection (add/remove/change tables/columns/PKs), JSON round-trip, import validation
