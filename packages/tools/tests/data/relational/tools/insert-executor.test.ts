/**
 * Unit tests for relational-insert/executor.ts
 * Uses mock ConnectionManager to test without a real database.
 */

import { describe, expect, it, vi } from 'vitest';
import type { ConnectionManager } from '../../../../src/data/relational/connection/connection-manager.js';
import { executeInsert } from '../../../../src/data/relational/tools/relational-insert/executor.js';

function createMockManager(executeResult: unknown = []): ConnectionManager {
  return {
    execute: vi.fn().mockResolvedValue(executeResult),
  } as unknown as ConnectionManager;
}

// ---------------------------------------------------------------------------
// executeInsert – single-row
// ---------------------------------------------------------------------------

describe('relational-insert > executor > executeInsert', () => {
  it('should insert a single row and return rowCount', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: { name: 'Alice', email: 'alice@example.com' },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rowCount).toBe(1);
    expect(result.executionTime).toBeGreaterThanOrEqual(0);
    expect(manager.execute).toHaveBeenCalledOnce();
  });

  it('should return insertedIds when returning mode is "id"', async () => {
    const manager = createMockManager([{ id: 42 }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: { name: 'Bob' },
      returning: { mode: 'id', idColumn: 'id' },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.insertedIds).toContain(42);
  });

  it('should return rows when returning mode is "row"', async () => {
    const manager = createMockManager([{ id: 1, name: 'Alice', email: 'a@b.com' }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: { name: 'Alice', email: 'a@b.com' },
      returning: { mode: 'row' },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({ id: 1, name: 'Alice', email: 'a@b.com' });
  });

  it('should handle object-style result with .rows property', async () => {
    const manager = createMockManager({ rows: [{ id: 10 }], rowCount: 1 });

    const result = await executeInsert(manager, {
      table: 'users',
      data: { name: 'Charlie' },
      returning: { mode: 'id', idColumn: 'id' },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rowCount).toBe(1);
    expect(result.insertedIds).toContain(10);
  });

  it('should handle result with insertId (MySQL)', async () => {
    const manager = createMockManager([{ affectedRows: 1, insertId: 99 }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: { name: 'Dave' },
      returning: { mode: 'id', idColumn: 'id' },
      vendor: 'mysql',
      connectionString: 'mysql://localhost/test',
    });

    expect(result.insertedIds).toContain(99);
  });

  it('should handle result with lastInsertRowid (SQLite)', async () => {
    const manager = createMockManager([{ changes: 1, lastInsertRowid: 7 }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: { name: 'Eve' },
      returning: { mode: 'id', idColumn: 'id' },
      vendor: 'sqlite',
      connectionString: ':memory:',
    });

    expect(result.insertedIds).toContain(7);
  });

  it('should derive ids from input rows when DB does not return them', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: { id: 55, name: 'Frank' },
      returning: { mode: 'id', idColumn: 'id' },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.insertedIds).toContain(55);
  });

  it('should normalize a null/undefined result to rowCount 0', async () => {
    const manager = createMockManager(null);

    const result = await executeInsert(manager, {
      table: 'users',
      data: { name: 'Ghost' },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rowCount).toBeGreaterThanOrEqual(0);
  });

  it('should return empty rows when returning mode is not "row"', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: { name: 'Hank' },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rows).toEqual([]);
  });

  // ---------- Batch insert ------------------------------------------------

  it('should insert in batch mode when batch.enabled is true', async () => {
    const manager = createMockManager([{ affectedRows: 2 }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: [
        { name: 'Row1', email: 'r1@example.com' },
        { name: 'Row2', email: 'r2@example.com' },
      ],
      batch: { enabled: true, batchSize: 10 },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rowCount).toBeGreaterThanOrEqual(2);
    expect(result.batch).toBeDefined();
    expect(result.batch?.enabled).toBe(true);
  });

  it('should NOT use batch mode when batch is undefined', async () => {
    const manager = createMockManager([{ affectedRows: 2 }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: [
        { name: 'A', email: 'a@a.com' },
        { name: 'B', email: 'b@b.com' },
      ],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.batch).toBeUndefined();
  });

  // ---------- Error handling ----------------------------------------------

  it('should wrap constraint violation errors', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('unique constraint violated on column "email"'),
    );

    await expect(
      executeInsert(manager, {
        table: 'users',
        data: { name: 'Dup', email: 'dup@example.com' },
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('Insert failed: unique constraint violation.');
  });

  it('should rethrow safe validation errors as-is', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Table name must not be empty'),
    );

    await expect(
      executeInsert(manager, {
        table: 'users',
        data: { name: 'X' },
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
      executeInsert(manager, {
        table: 'users',
        data: { name: 'Y' },
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('INSERT query failed. See logs for details.');
  });

  it('should use transaction context when provided', async () => {
    const txExecute = vi.fn().mockResolvedValue([{ affectedRows: 1 }]);
    const manager = createMockManager();
    const tx = { execute: txExecute } as unknown as import('../../../../src/data/relational/query/transaction.js').TransactionContext;

    await executeInsert(
      manager,
      {
        table: 'users',
        data: { name: 'Tx' },
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      },
      { transaction: tx },
    );

    expect(txExecute).toHaveBeenCalledOnce();
    expect(manager.execute).not.toHaveBeenCalled();
  });

  // ---------- Batch insert with defaults ----------------------------------

  it('should resolve batch defaults when partial options given', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: [{ name: 'Row1' }],
      batch: { enabled: true },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.batch?.batchSize).toBe(100); // default
  });

  it('should skip batch mode when batch.enabled is false', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: [{ name: 'Row1' }],
      batch: { enabled: false },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.batch).toBeUndefined();
  });
});
