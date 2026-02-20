/**
 * Transaction helper tests.
 */

import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { ConnectionManager } from '../../../src/data/relational/connection/connection-manager.js';
import { withTransaction } from '../../../src/data/relational/query/transaction.js';
import type { ConnectionConfig } from '../../../src/data/relational/connection/types.js';

const hasSQLiteBindings = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3');
    const db = new Database(':memory:');
    db.close();
    return true;
  } catch {
    return false;
  }
})();

describe('Relational Transactions', () => {
  let manager: ConnectionManager;

  beforeAll(async () => {
    if (!hasSQLiteBindings) return;

    const config: ConnectionConfig = {
      vendor: 'sqlite',
      connection: ':memory:',
    };

    manager = new ConnectionManager(config);
    await manager.connect();
    await manager.execute(sql.raw('CREATE TABLE tx_users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)'));
  });

  beforeEach(async () => {
    if (!hasSQLiteBindings) return;
    await manager.execute(sql.raw('DELETE FROM tx_users'));
  });

  afterAll(async () => {
    if (!hasSQLiteBindings) return;
    await manager.disconnect();
  });

  it.skipIf(!hasSQLiteBindings)('commits on success', async () => {
    await withTransaction(manager, async (transaction) => {
      await transaction.execute(sql`INSERT INTO tx_users (id, name) VALUES (${1}, ${'alice'})`);
    });

    const rows = await manager.execute(sql.raw('SELECT id, name FROM tx_users ORDER BY id'));
    expect(Array.isArray(rows)).toBe(true);
    expect(rows).toEqual([{ id: 1, name: 'alice' }]);
  });

  it.skipIf(!hasSQLiteBindings)('rolls back on failure', async () => {
    await expect(
      withTransaction(manager, async (transaction) => {
        await transaction.execute(sql`INSERT INTO tx_users (id, name) VALUES (${1}, ${'alice'})`);
        throw new Error('forced failure');
      })
    ).rejects.toThrow('forced failure');

    const rows = await manager.execute(sql.raw('SELECT id, name FROM tx_users ORDER BY id'));
    expect(rows).toEqual([]);
  });

  it.skipIf(!hasSQLiteBindings)('supports nested savepoints', async () => {
    await withTransaction(manager, async (transaction) => {
      await transaction.execute(sql`INSERT INTO tx_users (id, name) VALUES (${1}, ${'outer'})`);

      await expect(
        transaction.withSavepoint(async (nestedTransaction) => {
          await nestedTransaction.execute(sql`INSERT INTO tx_users (id, name) VALUES (${2}, ${'inner'})`);
          throw new Error('inner failure');
        })
      ).rejects.toThrow('inner failure');

      await transaction.execute(sql`INSERT INTO tx_users (id, name) VALUES (${3}, ${'outer-2'})`);
    });

    const rows = await manager.execute(sql.raw('SELECT id, name FROM tx_users ORDER BY id'));
    expect(rows).toEqual([
      { id: 1, name: 'outer' },
      { id: 3, name: 'outer-2' },
    ]);
  });

  it.skipIf(!hasSQLiteBindings)('rolls back when timeout is exceeded', async () => {
    await expect(
      withTransaction(
        manager,
        async (transaction) => {
          await new Promise((resolve) => setTimeout(resolve, 25));
          await transaction.execute(sql`INSERT INTO tx_users (id, name) VALUES (${1}, ${'late'})`);
        },
        { timeoutMs: 5 }
      )
    ).rejects.toThrow('Transaction timed out after 5ms');

    const rows = await manager.execute(sql.raw('SELECT id, name FROM tx_users ORDER BY id'));
    expect(rows).toEqual([]);
  });
});
