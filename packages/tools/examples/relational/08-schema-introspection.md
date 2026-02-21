# Schema Introspection and Dynamic Queries

> **Note:** Examples use `console.log` for brevity. Production code should use the framework logger — see [Logging Standards](../../../../docs/LOGGING_STANDARDS.md).

This guide shows how to use the schema introspection tool to discover database structure at runtime and build dynamic, schema-aware queries.

---

## Why Schema Introspection?

Agents don't have compile-time knowledge of your database schema. The `relational-get-schema` tool lets agents:

- Discover tables and columns before querying
- Validate column names and types before building queries
- Adapt to schema changes without code updates
- Generate accurate SQL for arbitrary databases

---

## Basic Schema Inspection

```typescript
import { relationalGetSchema } from '@agentforge/tools';

const schema = await relationalGetSchema.invoke({
  vendor: 'postgresql',
  connectionString: 'postgresql://app:secret@localhost:5432/mydb',
});

console.log(schema);
// {
//   tables: [
//     {
//       name: 'users',
//       schema: 'public',
//       columns: [
//         { name: 'id', type: 'integer', nullable: false, primaryKey: true },
//         { name: 'email', type: 'varchar(255)', nullable: false },
//         { name: 'name', type: 'varchar(100)', nullable: true },
//         { name: 'created_at', type: 'timestamp', nullable: false },
//       ],
//     },
//     {
//       name: 'orders',
//       schema: 'public',
//       columns: [
//         { name: 'id', type: 'integer', nullable: false, primaryKey: true },
//         { name: 'user_id', type: 'integer', nullable: false },
//         { name: 'total', type: 'numeric(10,2)', nullable: false },
//         { name: 'status', type: 'varchar(20)', nullable: false },
//       ],
//     },
//   ],
// }
```

---

## Filtering Tables

Inspect specific tables to reduce noise:

```typescript
// Only inspect the 'users' and 'orders' tables
const schema = await relationalGetSchema.invoke({
  tables: ['users', 'orders'],
  vendor: 'postgresql',
  connectionString: DB_URL,
});
```

---

## Schema Caching

Schema introspection queries `information_schema`, which can be slow on large databases. Use caching:

```typescript
// First call — hits the database
const schema1 = await relationalGetSchema.invoke({
  cacheKey: 'mydb-schema',  // Enable caching with this key
  vendor: 'postgresql',
  connectionString: DB_URL,
});

// Second call — served from cache (instant)
const schema2 = await relationalGetSchema.invoke({
  cacheKey: 'mydb-schema',
  vendor: 'postgresql',
  connectionString: DB_URL,
});

// After a migration — invalidate the cache
const schema3 = await relationalGetSchema.invoke({
  cacheKey: 'mydb-schema',
  invalidateCache: true,   // Force a fresh lookup
  vendor: 'postgresql',
  connectionString: DB_URL,
});
```

---

## Building Dynamic Queries from Schema

### Example: Generic Table Explorer Agent

An agent that can explore any table without hardcoded knowledge:

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { ChatOpenAI } from '@langchain/openai';
import { relationalGetSchema, relationalSelect, relationalQuery } from '@agentforge/tools';

const explorerAgent = createReActAgent({
  model: new ChatOpenAI({ model: 'gpt-4', temperature: 0 }),
  tools: [relationalGetSchema, relationalSelect, relationalQuery],
  systemPrompt: `You are a database exploration agent.
Database: PostgreSQL at ${DB_URL}

Workflow:
1. ALWAYS call relational-get-schema first to discover tables.
2. Use the schema to understand column names, types, and nullability.
3. Use relational-select for simple queries (single table, filters).
4. Use relational-query for complex queries (JOINs, aggregations).
5. Always include LIMIT to prevent large result sets.

Rules:
- Never guess column names — always verify against the schema.
- Report the schema structure to the user when they ask about tables.
- If a table doesn't exist, tell the user which tables ARE available.`,
  maxIterations: 10,
});

// The agent will first introspect, then query
const result = await explorerAgent.invoke({
  messages: [{
    role: 'user',
    content: 'Show me the top 5 users by order count, including their email.',
  }],
});
```

### Example: Schema-Validated Insert

Validate data against the schema before inserting:

```typescript
async function validatedInsert(table: string, data: Record<string, unknown>) {
  // Step 1: Get the schema
  const schema = await relationalGetSchema.invoke({
    tables: [table],
    cacheKey: `schema-${table}`,
    vendor: 'postgresql',
    connectionString: DB_URL,
  });

  const tableSchema = schema.tables.find((t) => t.name === table);
  if (!tableSchema) {
    throw new Error(`Table "${table}" not found. Available: ${schema.tables.map((t) => t.name).join(', ')}`);
  }

  // Step 2: Validate columns exist
  const validColumns = new Set(tableSchema.columns.map((c) => c.name));
  const invalidColumns = Object.keys(data).filter((k) => !validColumns.has(k));
  if (invalidColumns.length > 0) {
    throw new Error(`Invalid columns: ${invalidColumns.join(', ')}. Valid: ${[...validColumns].join(', ')}`);
  }

  // Step 3: Check required (non-nullable, no default) columns
  const requiredColumns = tableSchema.columns
    .filter((c) => !c.nullable && !c.primaryKey)  // Non-null, non-PK (PK is auto-generated)
    .map((c) => c.name);

  const missingRequired = requiredColumns.filter((col) => !(col in data));
  if (missingRequired.length > 0) {
    throw new Error(`Missing required columns: ${missingRequired.join(', ')}`);
  }

  // Step 4: Insert
  return await relationalInsert.invoke({
    table,
    data,
    returning: ['id'],
    vendor: 'postgresql',
    connectionString: DB_URL,
  });
}

// Usage
await validatedInsert('users', { email: 'alice@example.com', name: 'Alice' });
// ✅ Passes validation — email (required) is present

await validatedInsert('users', { name: 'Bob' });
// ❌ Error: Missing required columns: email
```

---

## Schema Diffing

Compare schema snapshots to detect changes:

```typescript
async function detectSchemaChanges(cacheKey: string) {
  // Get cached (old) schema
  const oldSchema = await relationalGetSchema.invoke({
    cacheKey,
    vendor: 'postgresql',
    connectionString: DB_URL,
  });

  // Get fresh schema
  const newSchema = await relationalGetSchema.invoke({
    cacheKey,
    invalidateCache: true,
    vendor: 'postgresql',
    connectionString: DB_URL,
  });

  const oldTables = new Set(oldSchema.tables.map((t) => t.name));
  const newTables = new Set(newSchema.tables.map((t) => t.name));

  const added = [...newTables].filter((t) => !oldTables.has(t));
  const removed = [...oldTables].filter((t) => !newTables.has(t));

  if (added.length > 0) console.log('New tables:', added);
  if (removed.length > 0) console.log('Removed tables:', removed);

  // Check for column changes in existing tables
  for (const newTable of newSchema.tables) {
    const oldTable = oldSchema.tables.find((t) => t.name === newTable.name);
    if (!oldTable) continue;

    const oldCols = new Set(oldTable.columns.map((c) => c.name));
    const newCols = new Set(newTable.columns.map((c) => c.name));

    const addedCols = [...newCols].filter((c) => !oldCols.has(c));
    const removedCols = [...oldCols].filter((c) => !newCols.has(c));

    if (addedCols.length > 0) console.log(`${newTable.name}: new columns:`, addedCols);
    if (removedCols.length > 0) console.log(`${newTable.name}: removed columns:`, removedCols);
  }
}
```

---

## Vendor Differences

Schema introspection normalizes results across vendors, but some metadata varies:

| Feature | PostgreSQL | MySQL | SQLite |
|---|---|---|---|
| Schema namespace | `public` (default) | database name | `main` |
| Column types | Full type with precision | Full type | Affinity-based |
| Constraints | Full FK/unique/check info | FK and unique | Limited FK info |
| Indexes | Included | Included | Basic |

---

## Best Practices

1. **Always introspect before querying** — Agents should call `relational-get-schema` as their first action to ground themselves in the actual database structure.
2. **Use `cacheKey`** — Cache schema results for repeated agent iterations. One introspection per session is usually enough.
3. **Filter tables** — Pass `tables: [...]` to only inspect relevant tables, especially in databases with many tables.
4. **Validate before writing** — Check column names and nullability against the schema before `INSERT` or `UPDATE`.
5. **Invalidate after migrations** — Call with `invalidateCache: true` after running database migrations.
6. **Include in system prompts** — Tell agents about the schema tool and instruct them to use it first.
