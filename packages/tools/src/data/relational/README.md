# @agentforge/tools — Relational Database Access

Vendor-agnostic relational database tools for **PostgreSQL**, **MySQL**, and **SQLite** built on [Drizzle ORM](https://orm.drizzle.team/). Designed for autonomous agents powered by [LangGraph](https://langchain-ai.github.io/langgraphjs/).

## Features

- **Vendor-agnostic** — Write once, run against PostgreSQL, MySQL, or SQLite
- **Type-safe CRUD** — SELECT, INSERT, UPDATE, DELETE tools with Zod input schemas for validation/tooling (callers or LangChain/LangGraph integrations apply runtime validation)
- **Raw SQL** — Execute arbitrary parameterized queries with automatic SQL injection prevention
- **Schema introspection** — Discover tables, columns, primary keys, foreign keys, and indexes at runtime
- **Connection pooling** — Built-in pool management with configurable limits and timeouts
- **Transactions** — ACID transactions with isolation levels and savepoints
- **Batch operations** — Chunk large INSERT, UPDATE, and DELETE workloads with progress callbacks
- **Result streaming** — Memory-efficient chunked streaming for large SELECT result sets
- **Automatic reconnection** — Configurable exponential backoff for dropped connections
- **Security** — Parameterized queries, SQL validation, identifier quoting, and DDL blocking

---

## Quick Start

### 1. Install

```bash
pnpm add @agentforge/tools
```

Install only the database driver(s) you need:

| Database   | Peer dependency                         | Install command                         |
| ---------- | --------------------------------------- | --------------------------------------- |
| PostgreSQL | `pg` + `@types/pg`                      | `pnpm add pg @types/pg`                |
| MySQL      | `mysql2`                                | `pnpm add mysql2`                      |
| SQLite     | `better-sqlite3` + `@types/better-sqlite3` | `pnpm add better-sqlite3 @types/better-sqlite3` |

### 2. Connect

```typescript
import { ConnectionManager } from '@agentforge/tools';

// PostgreSQL
const pg = new ConnectionManager({
  vendor: 'postgresql',
  connection: 'postgresql://user:password@localhost:5432/mydb',
});
await pg.connect();

// MySQL
const mysql = new ConnectionManager({
  vendor: 'mysql',
  connection: 'mysql://user:password@localhost:3306/mydb',
});
await mysql.connect();

// SQLite (in-memory)
const sqlite = new ConnectionManager({
  vendor: 'sqlite',
  connection: ':memory:',
});
await sqlite.connect();
```

### 3. Query

```typescript
import { sql } from 'drizzle-orm';

// Execute a parameterized query
const rows = await pg.execute(sql`SELECT * FROM users WHERE id = ${42}`);

// Always disconnect when done
await pg.disconnect();
```

### 4. Use a Relational Tool Set

Configure the database once, use the credential-free Tools, and dispose the set when the application is done with it.

```typescript
import { createRelationalToolSet } from '@agentforge/tools';

const relational = createRelationalToolSet({
  vendor: 'postgresql',
  connection: 'postgresql://user:pass@localhost:5432/mydb',
});

try {
  const result = await relational.select.invoke({
    table: 'users',
    columns: ['id', 'name', 'email'],
    where: [{ column: 'status', operator: 'eq', value: 'active' }],
    orderBy: [{ column: 'name', direction: 'asc' }],
    limit: 10,
  });
} finally {
  await relational.dispose();
}
```

Run related Tool calls atomically with `transaction`. The callback receives
scoped versions of the same six credential-free Tools; commit and rollback stay
behind the Relational Tool Set interface.

```typescript
await relational.transaction(
  async (tools) => {
    await tools.insert.invoke({
      table: 'orders',
      data: { id: 42, status: 'pending' },
    });
    await tools.update.invoke({
      table: 'inventory',
      data: { reserved: true },
      where: [{ column: 'order_id', operator: 'eq', value: 42 }],
    });
  },
  { isolationLevel: 'read committed', timeoutMs: 15_000 }
);
```

There is no implicit transaction timeout. Set `timeoutMs` when Agent reasoning
or other unbounded work may occur inside the callback, because an open
transaction can retain a dedicated connection and database locks.

The six credential-bearing Relational Tool exports remain available as
deprecated compatibility Tools. Each legacy invocation creates and disposes an
ephemeral Relational Tool Set. Migrate new code to
`createRelationalToolSet(...)` to reuse its owned session and keep credentials
out of Tool inputs.

---

## Available Tools

| Tool                   | Description                                                              |
| ---------------------- | ------------------------------------------------------------------------ |
| `relationalQuery`      | Deprecated credential-bearing Query compatibility Tool                  |
| `relationalSelect`     | Deprecated credential-bearing Select compatibility Tool                 |
| `relationalInsert`     | Deprecated credential-bearing Insert compatibility Tool                 |
| `relationalUpdate`     | Deprecated credential-bearing Update compatibility Tool                 |
| `relationalDelete`     | Deprecated credential-bearing Delete compatibility Tool                 |
| `relationalGetSchema`  | Deprecated credential-bearing Get Schema compatibility Tool             |

The deprecated compatibility Tools accept `vendor` and `connectionString` on
every invocation. Configured Relational Tool Set inputs omit both fields.

---

## Examples

See the per-vendor and advanced usage examples:

- [PostgreSQL](./examples/postgresql-example.md)
- [MySQL](./examples/mysql-example.md)
- [SQLite](./examples/sqlite-example.md)
- [AgentForge ReAct Integration](./examples/react-agent-example.md)
- [Error Handling Best Practices](./examples/error-handling-example.md)

---

## API Reference

See the full API documentation:

- [ConnectionManager](./docs/api-connection-manager.md) — Connection lifecycle, pooling, reconnection
- [Tools](./docs/api-tools.md) — LangGraph tool reference (query, select, insert, update, delete, get-schema)
- [Query Builder](./docs/api-query-builder.md) — SELECT, INSERT, UPDATE, DELETE query building functions
- [Schema Inspector](./docs/api-schema-inspector.md) — Runtime schema introspection and caching
- [Security](./docs/security-best-practices.md) — SQL injection prevention, identifier quoting, DDL blocking

---

## Connection Configuration

### Connection String

The simplest way to connect — pass a URL string:

```typescript
const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: 'postgresql://user:password@localhost:5432/mydb',
});
```

### Configuration Object

For fine-grained control, pass a vendor-specific config object:

```typescript
const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'mydb',
    user: 'admin',
    password: 'secret',
    ssl: true,
    pool: {
      max: 20,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 10000,
    },
  },
});
```

### Pool Configuration

| Option                  | Description                                   | Default          |
| ----------------------- | --------------------------------------------- | ---------------- |
| `max`                   | Maximum connections in pool                   | Vendor default   |
| `idleTimeoutMillis`     | Idle connection timeout (ms)                  | Vendor default   |
| `acquireTimeoutMillis`  | Max wait time for a connection from pool (ms) | Vendor default   |

> **Note:** SQLite uses a single connection. Pool options are accepted for API consistency but do not affect runtime behavior.

### Automatic Reconnection

```typescript
const manager = new ConnectionManager(
  { vendor: 'postgresql', connection: 'postgresql://...' },
  {
    enabled: true,
    maxAttempts: 5,       // 0 = infinite retries
    baseDelayMs: 1000,    // Exponential backoff base
    maxDelayMs: 30000,    // Backoff ceiling
  },
);

manager.on('reconnecting', ({ attempt, maxAttempts, delayMs }) => {
  // Production code should use createLogger() — console.log is for brevity only
  console.log(`Reconnecting (${attempt}/${maxAttempts}) in ${delayMs}ms`);
});
```

---

## Architecture

```
@agentforge/tools
└── data/relational/
    ├── connection/          # ConnectionManager, pool config, types
    ├── query/               # Query executor, builder, transactions, batching, streaming
    ├── schema/              # SchemaInspector, validators, type mapper, diff
    ├── tools/               # LangGraph tool wrappers (query, select, insert, update, delete, get-schema)
    └── utils/               # SQL sanitizer, identifier utils, peer dependency checker
```

---

## License

MIT — see [LICENSE](../../../../../LICENSE) for details.
