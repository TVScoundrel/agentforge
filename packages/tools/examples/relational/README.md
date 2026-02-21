# Relational Database Tools — Advanced Examples

This directory contains advanced integration examples for the `@agentforge/tools` relational database module. Each guide covers a specific capability with working code examples, best practices, and vendor-specific notes.

> **Note:** All examples use `console.log` for brevity. Production code should use the framework logger — see [Logging Standards](../../../../docs/LOGGING_STANDARDS.md).

---

## Examples

| # | Guide | Description |
|---|---|---|
| 01 | [Transactions](./01-transactions.md) | Multi-step operations with `withTransaction`, isolation levels, timeouts, and savepoints |
| 02 | [Batch Insert](./02-batch-insert.md) | Large dataset ingestion with configurable batch sizes, retries, and error handling |
| 03 | [Batch Update](./03-batch-update.md) | Bulk modifications, optimistic locking, soft deletes, and batch delete operations |
| 04 | [Result Streaming](./04-result-streaming.md) | Memory-efficient processing of large query results with LIMIT/OFFSET streaming |
| 05 | [Multi-Agent Systems](./05-multi-agent.md) | Shared database access across specialized agents with role-based tool assignment |
| 06 | [Error Handling & Retries](./06-error-handling.md) | Connection failures, SQL validation, constraint violations, and retry patterns |
| 07 | [Connection Pooling](./07-connection-pooling.md) | Pool configuration, vendor defaults, tuning by workload, metrics, and lifecycle |
| 08 | [Schema Introspection](./08-schema-introspection.md) | Runtime schema discovery, caching, dynamic query building, and schema diffing |
| 09 | [Performance Guide](./09-performance-guide.md) | Consolidated tuning reference — batch sizes, streaming thresholds, pool sizing, isolation levels |

---

## Prerequisites

- Node.js 18+
- A running database instance (PostgreSQL, MySQL, or SQLite)
- `@agentforge/tools` and `@agentforge/core` installed

```bash
pnpm add @agentforge/tools @agentforge/core
```

For multi-agent examples, you also need:

```bash
pnpm add @agentforge/patterns @langchain/openai
```

---

## Supported Vendors

All examples support three database vendors:

| Vendor | Connection String Format |
|---|---|
| PostgreSQL | `postgresql://user:pass@host:5432/dbname` |
| MySQL | `mysql://user:pass@host:3306/dbname` |
| SQLite | `sqlite:///path/to/database.db` |

Vendor-specific differences are called out inline where behavior varies.

---

## Related Documentation

- [Tool Implementation Stories](../../../../docs/) — Design documents for each tool (`st01001` through `st04003`)
- [SQL Injection Prevention](../../../../docs/sql-injection-prevention-best-practices.md) — Security best practices
- [Framework Design](../../../../docs/FRAMEWORK_DESIGN.md) — Overall architecture
- [Logging Standards](../../../../docs/LOGGING_STANDARDS.md) — Logger usage guidelines
