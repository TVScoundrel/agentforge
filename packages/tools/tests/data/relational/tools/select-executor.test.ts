/**
 * Unit tests for relational-select/executor.ts
 * Uses mock ConnectionManager to test without a real database.
 */

import { describe, expect, it, vi } from 'vitest';
import type { ConnectionManager } from '../../../../src/data/relational/connection/connection-manager.js';

// Mock the streaming functions from the query module
vi.mock('../../../../src/data/relational/query/index.js', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    executeStreamingSelect: vi.fn().mockResolvedValue({
      rows: [{ id: 1 }, { id: 2 }],
      rowCount: 2,
      chunkCount: 1,
      cancelled: false,
      memoryUsage: { heapUsed: 1024 },
    }),
    benchmarkStreamingSelectMemory: vi.fn().mockResolvedValue({
      regularMemory: { heapUsed: 2048 },
      streamingMemory: { heapUsed: 1024 },
      memorySavedBytes: 1024,
      memorySavedPercent: 50,
    }),
  };
});

import { executeSelect } from '../../../../src/data/relational/tools/relational-select/executor.js';

function createMockManager(executeResult: unknown = []): ConnectionManager {
  return {
    execute: vi.fn().mockResolvedValue(executeResult),
  } as unknown as ConnectionManager;
}

// ---------------------------------------------------------------------------
// executeSelect – basic queries
// ---------------------------------------------------------------------------

describe('relational-select > executor > executeSelect', () => {
  it('should execute a basic SELECT and return rows', async () => {
    const rows = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
    const manager = createMockManager(rows);

    const result = await executeSelect(manager, {
      table: 'users',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rows).toEqual(rows);
    expect(result.rowCount).toBe(2);
    expect(result.executionTime).toBeGreaterThanOrEqual(0);
    expect(manager.execute).toHaveBeenCalledOnce();
  });

  it('should return empty result when no rows match', async () => {
    const manager = createMockManager([]);

    const result = await executeSelect(manager, {
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 999 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rows).toEqual([]);
    expect(result.rowCount).toBe(0);
  });

  it('should handle object-style result with .rows property', async () => {
    const manager = createMockManager({ rows: [{ id: 1 }] });

    const result = await executeSelect(manager, {
      table: 'users',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rows).toEqual([{ id: 1 }]);
    expect(result.rowCount).toBe(1);
  });

  it('should select specific columns', async () => {
    const manager = createMockManager([{ name: 'Alice' }]);

    const result = await executeSelect(manager, {
      table: 'users',
      columns: ['name'],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rows).toEqual([{ name: 'Alice' }]);
  });

  it('should handle WHERE conditions', async () => {
    const manager = createMockManager([{ id: 1, name: 'Alice' }]);

    const result = await executeSelect(manager, {
      table: 'users',
      where: [{ column: 'name', operator: 'eq', value: 'Alice' }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rows).toHaveLength(1);
  });

  // ---------- Transaction context -----------------------------------------

  it('should use transaction context when provided', async () => {
    const txExecute = vi.fn().mockResolvedValue([{ id: 1 }]);
    const manager = createMockManager();
    const tx = { execute: txExecute } as unknown as import('../../../../src/data/relational/query/transaction.js').TransactionContext;

    await executeSelect(
      manager,
      {
        table: 'users',
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      },
      { transaction: tx },
    );

    expect(txExecute).toHaveBeenCalledOnce();
    expect(manager.execute).not.toHaveBeenCalled();
  });

  // ---------- Error handling ----------------------------------------------

  it('should rethrow safe validation errors as-is', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Table name must not be empty'),
    );

    await expect(
      executeSelect(manager, {
        table: 'users',
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
      executeSelect(manager, {
        table: 'users',
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('SELECT query failed. See logs for details.');
  });

  it('should rethrow streaming cancellation as safe error', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Stream cancelled by caller'),
    );

    await expect(
      executeSelect(manager, {
        table: 'users',
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('Stream cancelled by caller');
  });

  // ---------- Streaming mode -----------------------------------------------

  it('should execute streaming SELECT when streaming is enabled', async () => {
    const manager = createMockManager();

    const result = await executeSelect(manager, {
      table: 'events',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
      streaming: { enabled: true, chunkSize: 100, sampleSize: 10 },
    });

    expect(result.streaming).toBeDefined();
    expect(result.streaming?.enabled).toBe(true);
    expect(result.streaming?.chunkCount).toBe(1);
    expect(result.rows).toHaveLength(2);
    expect(result.rowCount).toBe(2);
  });

  it('should include benchmark data when streaming.benchmark is true', async () => {
    const manager = createMockManager();

    const result = await executeSelect(manager, {
      table: 'events',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
      streaming: { enabled: true, chunkSize: 100, benchmark: true },
    });

    expect(result.streaming?.benchmark).toBeDefined();
    expect(result.streaming?.benchmark?.memorySavedPercent).toBe(50);
  });

  it('should apply default chunk size when not specified in streaming', async () => {
    const manager = createMockManager();

    const result = await executeSelect(manager, {
      table: 'events',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
      streaming: { enabled: true },
    });

    expect(result.streaming?.enabled).toBe(true);
    // Default chunk size applied from DEFAULT_CHUNK_SIZE
    expect(result.streaming?.chunkSize).toBeGreaterThan(0);
  });

  it('should pass maxRows to streaming options', async () => {
    const manager = createMockManager();

    const result = await executeSelect(manager, {
      table: 'events',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
      streaming: { enabled: true, maxRows: 500 },
    });

    expect(result.streaming?.enabled).toBe(true);
  });

  it('should report cancelled flag from streaming result', async () => {
    const { executeStreamingSelect } = await import('../../../../src/data/relational/query/index.js');
    (executeStreamingSelect as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{ id: 1 }],
      rowCount: 1,
      chunkCount: 1,
      cancelled: true,
      memoryUsage: undefined,
    });

    const manager = createMockManager();
    const result = await executeSelect(manager, {
      table: 'events',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
      streaming: { enabled: true },
    });

    expect(result.streaming?.cancelled).toBe(true);
  });
});
