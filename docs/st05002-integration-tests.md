# ST-05002: Integration Tests

## Overview

Comprehensive integration test suite for the relational database tools, testing
all three supported vendors (PostgreSQL, MySQL, SQLite) against real databases
using testcontainers for containerised instances and in-memory SQLite.

## Test Structure

```
packages/tools/tests/data/relational/integration/
├── setup/
│   ├── containers.ts      # Testcontainer lifecycle (PostgreSQL, MySQL)
│   ├── fixtures.ts        # Vendor-specific DDL, seed data
│   └── test-helpers.ts    # Shared setup/teardown, utilities
├── sqlite/
│   ├── connection.integration.test.ts   # 9 tests
│   ├── crud.integration.test.ts         # 17 tests
│   └── schema.integration.test.ts       # 8 tests
├── postgresql/
│   ├── connection.integration.test.ts   # 10 tests
│   ├── crud.integration.test.ts         # 19 tests
│   └── schema.integration.test.ts       # 9 tests
├── mysql/
│   ├── connection.integration.test.ts   # 8 tests
│   ├── crud.integration.test.ts         # 18 tests
│   └── schema.integration.test.ts       # 8 tests
└── benchmarks/
    └── performance.integration.test.ts  # 15 tests
```

**Total: 121 integration tests across 10 test files**

## Running Locally

### Prerequisites

- **Docker** (required for PostgreSQL and MySQL testcontainers)
- **better-sqlite3 native bindings** (rebuild if switching Node versions):
  ```bash
  cd packages/tools && npx node-gyp rebuild --directory=node_modules/better-sqlite3
  ```

### Commands

```bash
# Run all integration tests
pnpm test:integration

# Run with coverage
pnpm test:integration:coverage

# Run a specific vendor
npx vitest run -c vitest.integration.config.ts packages/tools/tests/data/relational/integration/sqlite/

# Run benchmarks only
npx vitest run -c vitest.integration.config.ts packages/tools/tests/data/relational/integration/benchmarks/
```

### Vitest Configuration

A dedicated config at `vitest.integration.config.ts` provides:
- 120s test and hook timeouts (container startup)
- Single-fork pool mode (avoids port conflicts)
- Scoped include: only `integration/**/*.integration.test.ts`
- v8 coverage targeting `packages/tools/src/data/relational/**`

## Test Categories

### Connection Tests

Validate connect/disconnect lifecycle, health checks, state transitions,
reconnection, and connection string handling for each vendor.

### CRUD Tests

Full `executeQuery()` coverage: SELECT, INSERT, UPDATE, DELETE with
parameterised queries, transactions, error handling, and vendor-specific
syntax (e.g. PostgreSQL `$1` vs MySQL/SQLite `?` placeholders).

### Schema Introspection Tests

`SchemaInspector.inspect()` against real `information_schema` (PG/MySQL) and
`PRAGMA` (SQLite): tables, columns, types, primary keys, foreign keys,
indexes, nullable flags, table filtering, caching.

### Performance Benchmarks

Sequential INSERT (100 rows), SELECT all, SELECT with WHERE, UPDATE all,
DELETE all — measured across all three vendors with `console.table` summary.

## Source Fixes Discovered

Integration testing revealed several bugs in production source code:

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| SQLite `db.execute is not a function` | Drizzle ORM better-sqlite3 adapter exposes `.all()` / `.run()`, not `.execute()` | `ConnectionManager.execute()` uses `db.all()` with fallback to `db.run()` |
| MySQL queries return `[rows, fields]` | mysql2 drizzle adapter wraps results in a tuple | `ConnectionManager.execute()` normalises by extracting `raw[0]` |
| MySQL schema returns uppercase column names | `information_schema` columns use native case (e.g. `TABLE_NAME`) | Added explicit lowercase `AS` aliases to all MySQL schema queries |

## CI/CD

GitHub Actions workflow at `.github/workflows/integration-tests.yml`:
- Triggers on changes to relational source/test files
- Runs on `ubuntu-latest` with Docker (pre-installed)
- Uploads coverage artifact on pull requests
