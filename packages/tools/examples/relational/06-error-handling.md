# Error Handling and Retry Logic

> **Note:** Examples use `console.log` for brevity. Production code should use the framework logger — see [Logging Standards](../../../../docs/LOGGING_STANDARDS.md).

This guide covers every layer of error handling in the relational database tools — from connection failures and SQL syntax errors to constraint violations and application-level retries.

---

## Error Categories

| Category | Examples | Recovery |
|---|---|---|
| **Connection** | Network down, auth failure, host unreachable | Automatic reconnection |
| **SQL Validation** | Forbidden keywords, missing WHERE clause | Fix query |
| **Constraint** | Unique violation, FK violation, NOT NULL | App-level handling |
| **Timeout** | Query too slow, lock wait timeout | Retry or optimize |
| **Pool** | All connections busy, acquire timeout | Wait or increase pool |

---

## Connection Error Handling

### Automatic Reconnection

The connection manager supports automatic reconnection with exponential backoff:

```typescript
import { ConnectionManager } from '@agentforge/tools';

const manager = new ConnectionManager(
  {
    vendor: 'postgresql',
    connection: 'postgresql://app:secret@localhost:5432/mydb',
  },
  {
    enabled: true,
    maxAttempts: 5,          // Try up to 5 times
    baseDelayMs: 1000,       // Start with 1s delay
    maxDelayMs: 30000,       // Cap at 30s
  },
);
```

The delay between retries follows exponential backoff:

```
Attempt 1: 1000ms (base)
Attempt 2: 2000ms (base × 2)
Attempt 3: 4000ms (base × 4)
Attempt 4: 8000ms (base × 8)
Attempt 5: 16000ms (base × 16, capped at maxDelayMs if exceeded)
```

### Handling Connection Events

```typescript
manager.on('connected', () => {
  console.log('Database connected');
});

manager.on('disconnected', (error) => {
  console.log('Connection lost:', error.message);
});

manager.on('reconnecting', (attempt) => {
  console.log(`Reconnection attempt ${attempt}...`);
});

manager.on('reconnected', () => {
  console.log('Successfully reconnected');
});

manager.on('reconnectionFailed', (error) => {
  console.log('All reconnection attempts exhausted:', error.message);
  // Alert operations team, switch to degraded mode, etc.
});
```

---

## SQL Validation Errors

The security layer validates all SQL before execution. These errors are immediate and non-retryable:

```typescript
import { relationalQuery } from '@agentforge/tools';

// ❌ DROP TABLE is blocked by default
const result = await relationalQuery.invoke({
  sql: 'DROP TABLE users',
  vendor: 'postgresql',
  connectionString: DB_URL,
});
// → Error: SQL validation failed: Forbidden keyword "DROP" detected

// ❌ Missing WHERE clause on UPDATE is blocked by default
const result2 = await relationalUpdate.invoke({
  table: 'users',
  data: { status: 'inactive' },
  where: [],  // Empty — blocked by allowFullTableUpdate default
  vendor: 'postgresql',
  connectionString: DB_URL,
});
// → Error: Full-table updates require explicit allowFullTableUpdate: true
```

### Handling Validation Errors

```typescript
try {
  const result = await relationalQuery.invoke({
    sql: userProvidedSQL,
    vendor: 'postgresql',
    connectionString: DB_URL,
  });
} catch (error) {
  if (error.message.includes('SQL validation failed')) {
    // Non-retryable — the SQL itself is problematic
    console.log('Invalid SQL:', error.message);
    return { success: false, reason: 'query_rejected' };
  }
  throw error; // Re-throw unexpected errors
}
```

---

## Constraint Violation Handling

Database constraint violations require application-level handling, not retries:

```typescript
import { relationalInsert } from '@agentforge/tools';

async function createUser(email: string, name: string) {
  try {
    return await relationalInsert.invoke({
      table: 'users',
      data: { email, name },
      returning: { mode: 'row' },
      vendor: 'postgresql',
      connectionString: DB_URL,
    });
  } catch (error) {
    // PostgreSQL unique violation code
    if (error.code === '23505') {
      console.log('Duplicate email — user already exists');
      return { success: false, reason: 'duplicate', field: 'email' };
    }
    // PostgreSQL foreign key violation
    if (error.code === '23503') {
      console.log('Referenced record does not exist');
      return { success: false, reason: 'invalid_reference' };
    }
    // PostgreSQL not-null violation
    if (error.code === '23502') {
      console.log('Required field missing:', error.column);
      return { success: false, reason: 'missing_field', field: error.column };
    }
    throw error;
  }
}
```

### Vendor Error Code Reference

| Condition | PostgreSQL | MySQL | SQLite |
|---|---|---|---|
| Unique violation | `23505` | `1062` | `SQLITE_CONSTRAINT_UNIQUE` |
| FK violation | `23503` | `1452` | `SQLITE_CONSTRAINT_FOREIGNKEY` |
| NOT NULL violation | `23502` | `1048` | `SQLITE_CONSTRAINT_NOTNULL` |
| Check constraint | `23514` | `3819` | `SQLITE_CONSTRAINT_CHECK` |

---

## Retry Patterns

### Simple Retry with Backoff

For transient errors (connection drops, deadlocks, lock timeouts):

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    retryableErrors?: string[];
  } = {},
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 500,
    retryableErrors = ['ECONNRESET', 'ETIMEDOUT', '40001', '40P01'],
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      const isRetryable = retryableErrors.some(
        (code) => (error as any).code === code || (error as any).message?.includes(code),
      );

      if (!isRetryable || attempt === maxRetries) {
        throw lastError;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError!;
}

// Usage
const users = await withRetry(
  () => relationalSelect.invoke({
    table: 'users',
    columns: ['id', 'email'],
    vendor: 'postgresql',
    connectionString: DB_URL,
  }),
  { maxRetries: 3, baseDelayMs: 1000 },
);
```

### Retryable vs Non-Retryable Errors

| Retryable (transient) | Non-Retryable (permanent) |
|---|---|
| Connection reset | Unique constraint violation |
| Connection timeout | Foreign key violation |
| Deadlock detected (40P01) | SQL syntax error |
| Serialization failure (40001) | Permission denied |
| Lock wait timeout | Table does not exist |
| Pool acquire timeout | Column does not exist |

---

## Batch Operation Error Handling

Batch operations support two error strategies:

### Stop on First Error (Default)

```typescript
const result = await relationalInsert.invoke({
  table: 'products',
  data: [
    { name: 'Widget A', price: 10 },
    { name: 'Widget A', price: 20 },  // Duplicate — fails
    { name: 'Widget C', price: 30 },  // Never attempted
  ],
  batch: { size: 1 },
  vendor: 'postgresql',
  connectionString: DB_URL,
});
// Batch 1 succeeds, batch 2 fails, batch 3 never runs
```

### Continue on Error

```typescript
const result = await relationalInsert.invoke({
  table: 'products',
  data: largeDataset,
  batch: {
    size: 100,
    continueOnError: true,  // Process all batches even if some fail
  },
  vendor: 'postgresql',
  connectionString: DB_URL,
});

console.log(`Inserted: ${result.successCount}`);
console.log(`Failed: ${result.failureCount}`);

// Inspect individual batch errors
for (const batchError of result.errors ?? []) {
  console.log(`Batch ${batchError.batchIndex}: ${batchError.message}`);
}
```

---

## Transaction Error Handling

```typescript
import { withTransaction } from '@agentforge/tools';

try {
  await withTransaction(manager, async (tx) => {
    await tx.execute('UPDATE accounts SET balance = balance - 100 WHERE id = 1');
    await tx.execute('UPDATE accounts SET balance = balance + 100 WHERE id = 2');

    // Verify invariant
    const [source] = await tx.execute('SELECT balance FROM accounts WHERE id = 1');
    if (source.balance < 0) {
      throw new Error('Insufficient funds');
    }
    // Transaction auto-commits if no error
  });
} catch (error) {
  // Transaction is automatically rolled back
  if (error.message === 'Insufficient funds') {
    console.log('Transfer rejected: insufficient funds');
  } else {
    console.log('Transaction failed:', error.message);
  }
}
```

---

## Best Practices

1. **Categorize errors before retrying** — Never retry constraint violations or syntax errors.
2. **Use exponential backoff** — Avoid hammering the database with immediate retries.
3. **Set maximum retry counts** — Infinite retries can mask real problems.
4. **Log every retry attempt** — Use the framework logger with structured context for observability.
5. **Use `continueOnError` for batch imports** — Skip bad rows instead of losing an entire batch.
6. **Handle reconnection events** — Alert your monitoring system when connections are unstable.
7. **Test error paths** — Use `@agentforge/testing` mock tools to simulate failures.
