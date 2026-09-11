# Migrating to Relational Tool Sets

Relational Tool Sets replace credential-bearing Tool invocations with one configured,
session-owning interface. Database configuration stays in application code instead of
appearing in Agent-visible Tool inputs, and all six Tools reuse the same session or pool.

The legacy `relationalQuery`, `relationalSelect`, `relationalInsert`,
`relationalUpdate`, `relationalDelete`, and `relationalGetSchema` exports remain
available and deprecated throughout the current major release. Removing them is
eligible only in the next major release.

## Replace per-invocation credentials

Before:

```typescript
import { relationalSelect } from '@agentforge/tools';

const result = await relationalSelect.invoke({
  vendor: 'postgresql',
  connectionString: process.env.DATABASE_URL!,
  table: 'users',
  where: [{ column: 'status', operator: 'eq', value: 'active' }],
});
```

After:

```typescript
import { createRelationalToolSet } from '@agentforge/tools';

const relational = createRelationalToolSet({
  vendor: 'postgresql',
  connection: process.env.DATABASE_URL!,
});

try {
  const result = await relational.select.invoke({
    table: 'users',
    where: [{ column: 'status', operator: 'eq', value: 'active' }],
  });
} finally {
  await relational.dispose();
}
```

Apply the same change to every operation:

| Deprecated compatibility Tool | Configured Tool |
| ----------------------------- | --------------- |
| `relationalQuery` | `relational.query` |
| `relationalSelect` | `relational.select` |
| `relationalInsert` | `relational.insert` |
| `relationalUpdate` | `relational.update` |
| `relationalDelete` | `relational.delete` |
| `relationalGetSchema` | `relational.getSchema` |

Remove `vendor` and `connectionString` from every invocation. Pass the vendor and
connection once to `createRelationalToolSet`. Construction validates local
configuration but connects lazily on first Tool or transaction use.

## Give configured Tools to an Agent

The Tool Set is iterable, so an Agent can receive all six credential-free Tools.
Keep the Tool Set alive for at least as long as the Agent can invoke it.

```typescript
import { createReActAgent } from '@agentforge/patterns';
import { createRelationalToolSet } from '@agentforge/tools';

const relational = createRelationalToolSet({
  vendor: 'sqlite',
  connection: './agent.sqlite',
});

const agent = createReActAgent({
  model,
  tools: [...relational],
});

try {
  await agent.invoke({ messages });
} finally {
  await relational.dispose();
}
```

## Register configured Tools

The Tool Registry remains the composition boundary. Register the iterable Tool Set
directly rather than copying its Tools into another wrapper.

```typescript
import { ToolRegistry } from '@agentforge/core';
import { createRelationalToolSet } from '@agentforge/tools';

const relational = createRelationalToolSet({
  vendor: 'mysql',
  connection: process.env.INVENTORY_DATABASE_URL!,
});
const registry = new ToolRegistry();

registry.registerMany(relational);
```

For multiple databases, create one Tool Set per database and give each a distinct
kebab-case prefix. The prefix is applied to every Tool name; duplicate enforcement
continues to belong to the registry.

```typescript
const inventory = createRelationalToolSet(inventoryDatabase, { prefix: 'inventory' });
const billing = createRelationalToolSet(billingDatabase, { prefix: 'billing' });

registry.registerMany(inventory);
registry.registerMany(billing);
```

## Move schema-cache controls

Move the legacy per-call `cacheTtlMs` value to Tool Set construction. Use `0` to
disable caching. `refreshCache: true` remains available on `getSchema` for a single
inspection, while `refreshSchema()` clears the Tool Set's owned cache explicitly.
The legacy `database` cache-scope input is no longer needed because each Tool Set
owns its cache.

```typescript
const relational = createRelationalToolSet(database, { schemaCacheTtlMs: 30_000 });

await relational.getSchema.invoke({});
await relational.getSchema.invoke({ refreshCache: true });
relational.refreshSchema();
```

Schema inspection inside `transaction` bypasses shared cached state. Disposal also
clears the Tool Set's owned cache.

## Use managed transactions

Call `transaction` and use only the scoped Tools supplied to its callback. Commit,
rollback, transaction identifiers, and savepoints are intentionally absent from the
Agent-facing Tool surface.

```typescript
await relational.transaction(
  async (tools) => {
    await tools.insert.invoke({ table: 'orders', data: order });
    await tools.update.invoke({
      table: 'inventory',
      data: { reserved: true },
      where: [{ column: 'sku', operator: 'eq', value: order.sku }],
    });
  },
  { isolationLevel: 'read committed', timeoutMs: 15_000 }
);
```

There is no implicit timeout. Always choose an explicit `timeoutMs` when Agent
reasoning or any other unbounded work occurs inside the callback: the transaction
holds a dedicated connection and may hold database locks while reasoning continues.
A failed or partial Tool result makes the transaction rollback-only, and a thrown
callback error or timeout rolls it back automatically.

## Dispose explicitly

`dispose()` rejects new work, drains work already admitted, clears schema state, and
releases the owned session or pool. It is safe to call repeatedly, but applications
should still make ownership visible with `try`/`finally` or a lifecycle shutdown hook.
Do not dispose a Tool Set while an Agent that owns its Tools can still run.

## Compatibility period

Migration can be incremental. Deprecated Tools keep their credential-bearing schemas
and observable result behavior in the current major release, but each invocation now
uses an ephemeral Relational Tool Set and therefore cannot reuse a session. Move
long-lived workflows first to avoid repeated connection setup. Legacy removal is
eligible only in the next major release; it is not part of this rollout.
