# Security Best Practices

This document covers SQL injection prevention, identifier quoting, DDL blocking, and other security measures implemented in the relational database tools.

## Defense in Depth

The tools implement multiple layers of protection:

1. **Drizzle SQL templates** — parameterized queries by default
2. **SQL validation** — blocks dangerous DDL operations
3. **Parameterized query enforcement** — mutations require parameter binding
4. **Identifier quoting** — prevents identifier injection
5. **Input schema validation** — Zod schemas reject malformed inputs
6. **Error sanitization** — sensitive details logged, not returned to callers

---

## 1. Parameterized Queries

**Always use parameter binding for dynamic values.** Never concatenate user input into SQL strings.

### With Drizzle SQL Templates (Recommended)

```typescript
import { sql } from 'drizzle-orm';

// SAFE — parameters are bound, not interpolated
const userId = userInput;
const result = await manager.execute(
  sql`SELECT * FROM users WHERE id = ${userId}`
);
```

### With the relationalQuery Tool

```typescript
// SAFE — positional parameters
await relationalQuery.invoke({
  sql: 'SELECT * FROM users WHERE id = $1 AND status = $2',
  params: [userId, 'active'],
  vendor: 'postgresql',
  connectionString: '...',
});

// SAFE — named parameters
await relationalQuery.invoke({
  sql: 'INSERT INTO users (name, email) VALUES (:name, :email)',
  params: { name: userName, email: userEmail },
  vendor: 'postgresql',
  connectionString: '...',
});
```

### What NOT To Do

```typescript
// DANGEROUS — string interpolation allows SQL injection
const bad = sql.raw(`SELECT * FROM users WHERE id = '${userId}'`);

// DANGEROUS — string concatenation
const bad2 = `SELECT * FROM users WHERE name = '${userName}'`;
```

---

## 2. DDL Blocking

The query executor blocks dangerous DDL statements to prevent accidental or malicious schema modifications:

```typescript
// BLOCKED — throws an error
await relationalQuery.invoke({
  sql: 'DROP TABLE users',
  vendor: 'postgresql',
  connectionString: '...',
});
// Error: Dangerous SQL operations (CREATE, DROP, TRUNCATE, ALTER) are not allowed
```

Blocked operations: `CREATE`, `DROP`, `TRUNCATE`, `ALTER`.

> **Escape hatch:** If you need DDL operations, use the `ConnectionManager.execute()` method directly with a Drizzle `sql` template. The DDL blocking only applies to the `relationalQuery` tool path.

---

## 3. Parameterized Query Enforcement

Mutation queries (`INSERT`, `UPDATE`, `DELETE`) are rejected if they contain no parameter placeholders **and** no params are provided:

```typescript
// REJECTED — mutation without params
await relationalQuery.invoke({
  sql: 'DELETE FROM users WHERE id = 42',
  vendor: 'postgresql',
  connectionString: '...',
});
// Error: Mutation query requires parameter binding

// FIX — use parameters
await relationalQuery.invoke({
  sql: 'DELETE FROM users WHERE id = $1',
  params: [42],
  vendor: 'postgresql',
  connectionString: '...',
});
```

---

## 4. Identifier Quoting

Table and column names are quoted to prevent injection through identifiers:

```typescript
import { quoteIdentifier, quoteQualifiedIdentifier, validateIdentifier } from '@agentforge/tools';

// Validates and quotes identifiers
quoteIdentifier('users');              // "users" (PostgreSQL/SQLite) or `users` (MySQL)
quoteQualifiedIdentifier('public.users'); // "public"."users"

// Rejects invalid identifiers
validateIdentifier('users; DROP TABLE --'); // throws Error
```

The type-safe tools (`relationalSelect`, `relationalInsert`, etc.) validate all table and column names against a safe pattern before building queries:

```
/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$/
```

---

## 5. SQL Comment and String Stripping

The SQL sanitizer strips comments and string literals before analysis to prevent bypass techniques:

```typescript
// These injection attempts are detected correctly:

// Comment-based bypass
'SELECT * FROM users -- WHERE 1=1'
// Comments stripped → 'SELECT * FROM users  WHERE 1=1'

// String-based bypass
"SELECT * FROM users WHERE name = 'admin' OR '1'='1'"
// Strings replaced → analysis sees the OR clause
```

Supported syntax:
- Line comments (`--`)
- Block comments (`/* ... */`)
- Single-quoted strings (with escape handling)
- Double-quoted identifiers
- PostgreSQL dollar-quoted strings (`$$...$$`, `$tag$...$tag$`)

---

## 6. Input Validation

All tools define Zod schemas for their inputs, which serve as the source of truth for validation and tooling. When tools are used through LangChain/LangGraph integrations (e.g., `StructuredTool` conversion), inputs are validated at runtime automatically. For direct `.invoke()` calls, callers should validate inputs explicitly or check the `success` flag in the response:

- **Table names** — Must match the identifier pattern (alphanumeric + underscore + optional schema qualification)
- **Column names** — Same pattern validation
- **WHERE conditions** — Type-checked operators and values (e.g., `IN` requires an array)
- **Connection strings** — Must be non-empty
- **Batch sizes** — Max 5000 to prevent memory issues
- **Retry attempts** — Max 5 to prevent infinite loops

---

## 7. Error Sanitization

Public-facing error messages are sanitized to avoid leaking database internals:

```typescript
// Tool returns sanitized message
{
  success: false,
  error: 'Failed to execute SELECT query. Please verify your input and database connection.'
}

// Full details are logged (not returned to caller)
logger.error('Query execution failed', {
  vendor: 'postgresql',
  error: 'relation "nonexistent" does not exist',
  sql: '...',
});
```

---

## Security Audit Checklist

Use this checklist when reviewing database-facing code:

- [ ] All dynamic values use parameter binding (no string interpolation)
- [ ] DDL operations blocked in agent-facing query paths
- [ ] Mutations require parameter placeholders
- [ ] Table and column names validated against identifier pattern
- [ ] Error messages exposed to callers are sanitized
- [ ] Connection strings stored in environment variables, not hardcoded
- [ ] Pool limits configured to prevent resource exhaustion
- [ ] Transaction timeouts set for long-running operations
- [ ] Batch sizes limited to prevent memory issues

---

## Recommended Connection String Practices

```typescript
// GOOD — use environment variables
const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: process.env.DATABASE_URL!,
});

// GOOD — use separate credential variables
const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true',
  },
});

// BAD — hardcoded credentials
const manager = new ConnectionManager({
  vendor: 'postgresql',
  connection: 'postgresql://admin:password123@prod-server:5432/mydb',
});
```
