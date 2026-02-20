/**
 * Unit tests for relational-update/executor.ts
 * Uses mock ConnectionManager to test without a real database.
 */

import { describe, expect, it, vi } from 'vitest';
import type { ConnectionManager } from '../../../../src/data/relational/connection/connection-manager.js';
import { executeUpdate } from '../../../../src/data/relational/tools/relational-update/executor.js';

function createMockManager(executeResult: unknown = []): ConnectionManager {
  return {
    execute: vi.fn().mockResolvedValue(executeResult),
  } as unknown as ConnectionManager;
}

// ---------------------------------------------------------------------------
// executeUpdate – single operations
// ---------------------------------------------------------------------------

describe('relational-update > executor > executeUpdate', () => {
  it('should execute a single UPDATE and return rowCount', async () => {
    const manager = createMockManager([{ affectedRows: 3 }]);

    const result = await executeUpdate(manager, {
      table: 'users',
      data: { status: 'active' },
      where: [{ column: 'status', operator: 'eq', value: 'pending' }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rowCount).toBe(3);
    expect(result.executionTime).toBeGreaterThanOrEqual(0);
    expect(manager.execute).toHaveBeenCalledOnce();
  });

  it('should handle object-style result with rowCount property', async () => {
    const manager = createMockManager({ rowCount: 5, rows: [] });

    const result = await executeUpdate(manager, {
      table: 'users',
      data: { active: true },
      where: [{ column: 'org_id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rowCount).toBe(5);
  });

  it('should handle SQLite changes result', async () => {
    const manager = createMockManager([{ changes: 2 }]);

    const result = await executeUpdate(manager, {
      table: 'users',
      data: { name: 'Updated' },
      where: [{ column: 'id', operator: 'in', value: [1, 2] }],
      vendor: 'sqlite',
      connectionString: ':memory:',
    });

    expect(result.rowCount).toBe(2);
  });

  it('should normalize null result to rowCount 0', async () => {
    const manager = createMockManager(null);

    const result = await executeUpdate(manager, {
      table: 'users',
      data: { name: 'X' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rowCount).toBe(0);
  });

  // ---------- Optimistic lock ---------------------------------------------

  it('should throw when optimistic lock fails (rowCount === 0)', async () => {
    const manager = createMockManager([{ affectedRows: 0 }]);

    await expect(
      executeUpdate(manager, {
        table: 'users',
        data: { name: 'OL' },
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        optimisticLock: {
          column: 'version',
          expectedValue: 5,
        },
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('optimistic lock check failed');
  });

  it('should succeed on optimistic lock when rowCount > 0', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeUpdate(manager, {
      table: 'users',
      data: { name: 'OL-OK' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      optimisticLock: {
        column: 'version',
        expectedValue: 5,
      },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rowCount).toBe(1);
  });

  // ---------- Transaction context -----------------------------------------

  it('should use transaction context when provided', async () => {
    const txExecute = vi.fn().mockResolvedValue([{ affectedRows: 1 }]);
    const manager = createMockManager();
    const tx = { execute: txExecute } as unknown as import('../../../../src/data/relational/query/transaction.js').TransactionContext;

    await executeUpdate(
      manager,
      {
        table: 'users',
        data: { name: 'TxUpdate' },
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      },
      { transaction: tx },
    );

    expect(txExecute).toHaveBeenCalledOnce();
    expect(manager.execute).not.toHaveBeenCalled();
  });

  // ---------- Missing data ------------------------------------------------

  it('should throw when data is missing and no operations array', async () => {
    const manager = createMockManager();

    await expect(
      executeUpdate(manager, {
        table: 'users',
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      } as any),
    ).rejects.toThrow();
  });

  // ---------- Batch update ------------------------------------------------

  it('should execute in batch mode when operations and batch.enabled', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeUpdate(manager, {
      table: 'users',
      operations: [
        { data: { name: 'A' }, where: [{ column: 'id', operator: 'eq', value: 1 }] },
        { data: { name: 'B' }, where: [{ column: 'id', operator: 'eq', value: 2 }] },
      ],
      batch: { enabled: true, batchSize: 10 },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.batch).toBeDefined();
    expect(result.batch?.enabled).toBe(true);
    expect(result.batch?.totalItems).toBe(2);
  });

  it('should NOT use batch mode when batch is undefined', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeUpdate(manager, {
      table: 'users',
      data: { name: 'X' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.batch).toBeUndefined();
  });

  it('should resolve batch defaults', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeUpdate(manager, {
      table: 'users',
      operations: [
        { data: { name: 'X' }, where: [{ column: 'id', operator: 'eq', value: 1 }] },
      ],
      batch: { enabled: true },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.batch?.batchSize).toBe(100);
  });

  // ---------- Error handling ----------------------------------------------

  it('should wrap constraint violation errors', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('unique constraint violated on column "email"'),
    );

    await expect(
      executeUpdate(manager, {
        table: 'users',
        data: { email: 'dup@example.com' },
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('Update failed: unique constraint violation.');
  });

  it('should rethrow safe validation errors as-is', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Update data must not be empty'),
    );

    await expect(
      executeUpdate(manager, {
        table: 'users',
        data: { name: 'X' },
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('Update data must not be empty');
  });

  it('should sanitize unknown database errors', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('FATAL: connection to server lost'),
    );

    await expect(
      executeUpdate(manager, {
        table: 'users',
        data: { name: 'Y' },
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('UPDATE query failed. See logs for details.');
  });
});
