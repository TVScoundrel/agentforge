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

### 4. Use the LangGraph Tools

The tools are self-contained — each invocation creates its own connection from the provided connection string, executes the operation, and closes the connection.

```typescript
import { relationalSelect, relationalInsert } from '@agentforge/tools';

// SELECT with WHERE, ORDER BY, and pagination
const result = await relationalSelect.invoke({
  table: 'users',
  columns: ['id', 'name', 'email'],
  where: [{ column: 'status', operator: 'eq', value: 'active' }],
  orderBy: [{ column: 'name', direction: 'asc' }],
  limit: 10,
  vendor: 'postgresql',
  connectionString: 'postgresql://user:pass@localhost:5432/mydb',
});

// INSERT with returning
const inserted = await relationalInsert.invoke({
  table: 'users',
  data: { name: 'Alice', email: 'alice@example.com' },
  returning: { mode: 'id', idColumn: 'id' },
  vendor: 'postgresql',
  connectionString: 'postgresql://user:pass@localhost:5432/mydb',
});
```

---

## Available Tools

| Tool                   | Description                                                              |
| ---------------------- | ------------------------------------------------------------------------ |
| `relationalQuery`      | Execute raw SQL with parameter binding (positional, named)               |
| `relationalSelect`     | Type-safe SELECT with WHERE, ORDER BY, LIMIT, OFFSET, streaming         |
| `relationalInsert`     | Type-safe INSERT (single-row and batch) with RETURNING support           |
| `relationalUpdate`     | Type-safe UPDATE with WHERE, optimistic locking, and batch support       |
| `relationalDelete`     | Type-safe DELETE with WHERE, soft delete mode, and batch support         |
| `relationalGetSchema`  | Introspect tables, columns, PKs, FKs, indexes with optional caching     |

Each tool accepts a `vendor` and `connectionString` parameter, making them fully self-contained for agent use.

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

MIT — see [LICENSE](../../../../LICENSE) for details.
