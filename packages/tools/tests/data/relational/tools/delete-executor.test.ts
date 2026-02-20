/**
 * Unit tests for relational-delete/executor.ts
 * Uses mock ConnectionManager to test without a real database.
 */

import { describe, expect, it, vi } from 'vitest';
import type { ConnectionManager } from '../../../../src/data/relational/connection/connection-manager.js';
import { executeDelete } from '../../../../src/data/relational/tools/relational-delete/executor.js';

function createMockManager(executeResult: unknown = []): ConnectionManager {
  return {
    execute: vi.fn().mockResolvedValue(executeResult),
  } as unknown as ConnectionManager;
}

// ---------------------------------------------------------------------------
// executeDelete – single operations
// ---------------------------------------------------------------------------

describe('relational-delete > executor > executeDelete', () => {
  it('should execute a single DELETE and return rowCount', async () => {
    const manager = createMockManager([{ affectedRows: 5 }]);

    const result = await executeDelete(manager, {
      table: 'users',
      where: [{ column: 'status', operator: 'eq', value: 'expired' }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rowCount).toBe(5);
    expect(result.executionTime).toBeGreaterThanOrEqual(0);
    expect(manager.execute).toHaveBeenCalledOnce();
  });

  it('should handle object-style result with rowCount property', async () => {
    const manager = createMockManager({ rowCount: 3 });

    const result = await executeDelete(manager, {
      table: 'sessions',
      where: [{ column: 'expired', operator: 'eq', value: true }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rowCount).toBe(3);
  });

  it('should handle SQLite changes result', async () => {
    const manager = createMockManager([{ changes: 2 }]);

    const result = await executeDelete(manager, {
      table: 'logs',
      where: [{ column: 'id', operator: 'in', value: [1, 2] }],
      vendor: 'sqlite',
      connectionString: ':memory:',
    });

    expect(result.rowCount).toBe(2);
  });

  it('should handle null result', async () => {
    const manager = createMockManager(null);

    const result = await executeDelete(manager, {
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 999 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rowCount).toBe(0);
  });

  // ---------- Soft delete -------------------------------------------------

  it('should report softDeleted flag for soft-delete queries', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeDelete(manager, {
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      softDelete: { column: 'deleted_at' },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.softDeleted).toBe(true);
    expect(result.rowCount).toBe(1);
  });

  it('should report softDeleted as false for hard-delete', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeDelete(manager, {
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.softDeleted).toBe(false);
  });

  // ---------- Transaction context -----------------------------------------

  it('should use transaction context when provided', async () => {
    const txExecute = vi.fn().mockResolvedValue([{ affectedRows: 1 }]);
    const manager = createMockManager();
    const tx = { execute: txExecute } as unknown as import('../../../../src/data/relational/query/transaction.js').TransactionContext;

    await executeDelete(
      manager,
      {
        table: 'users',
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      },
      { transaction: tx },
    );

    expect(txExecute).toHaveBeenCalledOnce();
    expect(manager.execute).not.toHaveBeenCalled();
  });

  // ---------- Batch delete ------------------------------------------------

  it('should execute in batch mode when operations and batch.enabled', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeDelete(manager, {
      table: 'users',
      operations: [
        { where: [{ column: 'id', operator: 'eq', value: 1 }] },
        { where: [{ column: 'id', operator: 'eq', value: 2 }] },
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

    const result = await executeDelete(manager, {
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.batch).toBeUndefined();
  });

  it('should resolve batch defaults', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeDelete(manager, {
      table: 'users',
      operations: [
        { where: [{ column: 'id', operator: 'eq', value: 1 }] },
      ],
      batch: { enabled: true },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.batch?.batchSize).toBe(100);
  });

  it('should handle batch soft-delete operations', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeDelete(manager, {
      table: 'users',
      operations: [
        { where: [{ column: 'id', operator: 'eq', value: 1 }], softDelete: { column: 'deleted_at' } },
      ],
      batch: { enabled: true },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.batch).toBeDefined();
  });

  // ---------- Error handling ----------------------------------------------

  it('should wrap constraint violation errors', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('violates foreign key constraint'),
    );

    await expect(
      executeDelete(manager, {
        table: 'users',
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('foreign key constraint violation');
  });

  it('should rethrow safe validation errors as-is', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Table name must not be empty'),
    );

    await expect(
      executeDelete(manager, {
        table: 'users',
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('Table name must not be empty');
  });

  it('should sanitize unknown database errors', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('FATAL: connection to server lost'),
    );

    await expect(
      executeDelete(manager, {
        table: 'users',
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('DELETE query failed. See logs for details.');
  });

  it('should mention cascade hint in FK error when cascade is true', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('violates foreign key constraint'),
    );

    await expect(
      executeDelete(manager, {
        table: 'users',
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        cascade: true,
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('foreign key');
  });
});
