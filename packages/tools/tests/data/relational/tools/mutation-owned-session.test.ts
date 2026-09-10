import { describe, expect, it, vi } from 'vitest';
import { sql } from 'drizzle-orm';
import { ConnectionManager } from '../../../../src/data/relational/connection/connection-manager.js';
import type { TransactionContext } from '../../../../src/data/relational/query/transaction.js';
import { invokeRelationalInsert } from '../../../../src/data/relational/tools/relational-insert/index.js';
import { invokeRelationalUpdate } from '../../../../src/data/relational/tools/relational-update/index.js';
import { invokeRelationalDelete } from '../../../../src/data/relational/tools/relational-delete/index.js';

function createTransactionContext(
  vendor: TransactionContext['vendor'],
  executionResult: unknown
): TransactionContext {
  const transaction: TransactionContext = {
    id: 'test-transaction',
    vendor,
    execute: vi.fn().mockResolvedValue(executionResult),
    isActive: vi.fn().mockReturnValue(true),
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
    createSavepoint: vi.fn().mockResolvedValue('test-savepoint'),
    rollbackToSavepoint: vi.fn().mockResolvedValue(undefined),
    releaseSavepoint: vi.fn().mockResolvedValue(undefined),
    withSavepoint: async (operation) => operation(transaction),
  };

  return transaction;
}

describe('owned-session relational mutation execution', () => {
  it('reuses one SQLite session across batch insert, update, and delete operations', async () => {
    const session = new ConnectionManager({ vendor: 'sqlite', connection: ':memory:' });
    await session.connect();

    try {
      await session.execute(sql.raw(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          status TEXT NOT NULL
        )
      `));

      const execution = { executor: session, vendor: 'sqlite' } as const;
      const insert = await invokeRelationalInsert(execution, {
        table: 'users',
        data: [
          { name: 'Alice', status: 'pending' },
          { name: 'Bob', status: 'pending' },
        ],
      });
      const update = await invokeRelationalUpdate(execution, {
        table: 'users',
        data: { status: 'active' },
        where: [{ column: 'status', operator: 'eq', value: 'pending' }],
      });
      const deletion = await invokeRelationalDelete(execution, {
        table: 'users',
        where: [{ column: 'status', operator: 'eq', value: 'active' }],
      });

      expect([insert.rowCount, update.rowCount, deletion.rowCount]).toEqual([2, 2, 2]);
    } finally {
      await session.disconnect();
    }
  });

  it('returns the observable insert result from an already-owned session', async () => {
    const execute = vi.fn().mockResolvedValue([{ affectedRows: 1, insertId: 42 }]);

    const result = await invokeRelationalInsert(
      {
        executor: { execute },
        vendor: 'mysql',
      },
      {
        table: 'users',
        data: { name: 'Alice' },
        returning: { mode: 'id' },
      }
    );

    expect(result).toMatchObject({
      success: true,
      rowCount: 1,
      insertedIds: [42],
      rows: [],
    });
  });

  it('keeps transaction context outside the operation input while using its session', async () => {
    const transaction = createTransactionContext(
      'mysql',
      [{ affectedRows: 1, insertId: 73 }]
    );

    const result = await invokeRelationalInsert(
      {
        executor: {
          execute: vi.fn().mockRejectedValue(new Error('the owned pool must not execute')),
        },
        vendor: 'mysql',
        transaction,
      },
      {
        table: 'users',
        data: { name: 'Transaction Alice' },
        returning: { mode: 'id' },
      }
    );

    expect(result).toMatchObject({
      success: true,
      rowCount: 1,
      insertedIds: [73],
    });
  });

  it('returns normalized update results from an already-owned session', async () => {
    const result = await invokeRelationalUpdate(
      {
        executor: {
          execute: vi.fn().mockResolvedValue({ changes: 2 }),
        },
        vendor: 'sqlite',
      },
      {
        table: 'users',
        data: { status: 'active' },
        where: [{ column: 'status', operator: 'eq', value: 'pending' }],
      }
    );

    expect(result).toMatchObject({
      success: true,
      rowCount: 2,
    });
  });

  it('returns normalized delete results from a caller-owned transaction session', async () => {
    const transaction = createTransactionContext('postgresql', { rowCount: 3 });

    const result = await invokeRelationalDelete(
      {
        executor: {
          execute: vi.fn().mockRejectedValue(new Error('the owned pool must not execute')),
        },
        vendor: 'postgresql',
        transaction,
      },
      {
        table: 'sessions',
        where: [{ column: 'expired', operator: 'eq', value: true }],
      }
    );

    expect(result).toMatchObject({
      success: true,
      rowCount: 3,
      softDeleted: false,
    });
  });
});
