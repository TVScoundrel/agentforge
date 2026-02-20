/**
 * Unit tests for query-executor.ts
 * Uses mock ConnectionManager to test query building and execution without a real database.
 */

import { describe, expect, it, vi } from 'vitest';
import type { ConnectionManager } from '../../../../src/data/relational/connection/connection-manager.js';
import { executeQuery } from '../../../../src/data/relational/query/query-executor.js';

function createMockManager(executeResult: unknown = []): ConnectionManager {
  return {
    execute: vi.fn().mockResolvedValue(executeResult),
  } as unknown as ConnectionManager;
}

// ---------------------------------------------------------------------------
// executeQuery – basic execution
// ---------------------------------------------------------------------------

describe('query-executor > executeQuery', () => {
  it('should execute a simple query without parameters', async () => {
    const rows = [{ value: 1 }];
    const manager = createMockManager(rows);

    const result = await executeQuery(manager, {
      sql: 'SELECT 1 as value',
      vendor: 'postgresql',
    });

    expect(result.rows).toEqual(rows);
    expect(result.rowCount).toBe(1);
    expect(result.executionTime).toBeGreaterThanOrEqual(0);
  });

  it('should handle positional parameters ($1, $2)', async () => {
    const manager = createMockManager([{ id: 1, name: 'Alice' }]);

    const result = await executeQuery(manager, {
      sql: 'SELECT * FROM users WHERE id = $1',
      params: [1],
      vendor: 'postgresql',
    });

    expect(result.rows).toHaveLength(1);
    expect(manager.execute).toHaveBeenCalledOnce();
  });

  it('should handle question-mark placeholders', async () => {
    const manager = createMockManager([{ id: 1 }]);

    const result = await executeQuery(manager, {
      sql: 'SELECT * FROM users WHERE id = ?',
      params: [1],
      vendor: 'mysql',
    });

    expect(result.rows).toHaveLength(1);
  });

  it('should handle named parameters (:name)', async () => {
    const manager = createMockManager([{ id: 1 }]);

    const result = await executeQuery(manager, {
      sql: 'SELECT * FROM users WHERE name = :name',
      params: { name: 'Alice' },
      vendor: 'postgresql',
    });

    expect(result.rows).toHaveLength(1);
  });

  // ---------- Object-style results ----------------------------------------

  it('should handle object-style result with .rows property', async () => {
    const manager = createMockManager({ rows: [{ id: 1 }], rowCount: 1 });

    const result = await executeQuery(manager, {
      sql: 'SELECT 1',
      vendor: 'postgresql',
    });

    expect(result.rows).toEqual([{ id: 1 }]);
    expect(result.rowCount).toBe(1);
  });

  it('should read affectedRows from object result', async () => {
    const manager = createMockManager({ rows: [], affectedRows: 5 });

    const result = await executeQuery(manager, {
      sql: 'UPDATE users SET active = $1 WHERE status = $2',
      params: [true, 'pending'],
      vendor: 'postgresql',
    });

    expect(result.rowCount).toBe(5);
  });

  // ---------- Transaction context -----------------------------------------

  it('should use transaction context when provided', async () => {
    const txExecute = vi.fn().mockResolvedValue([{ id: 1 }]);
    const manager = createMockManager();
    const tx = { execute: txExecute } as unknown as import('../../../../src/data/relational/query/transaction.js').TransactionContext;

    await executeQuery(
      manager,
      { sql: 'SELECT 1', vendor: 'postgresql' },
      { transaction: tx },
    );

    expect(txExecute).toHaveBeenCalledOnce();
    expect(manager.execute).not.toHaveBeenCalled();
  });

  // ---------- Validation errors -------------------------------------------

  it('should throw for mixed placeholder styles', async () => {
    const manager = createMockManager();

    await expect(
      executeQuery(manager, {
        sql: 'SELECT * FROM users WHERE id = $1 AND name = ?',
        params: [1, 'Alice'],
        vendor: 'postgresql',
      }),
    ).rejects.toThrow('Mixed parameter styles');
  });

  it('should throw for missing positional parameter', async () => {
    const manager = createMockManager();

    await expect(
      executeQuery(manager, {
        sql: 'SELECT * FROM users WHERE id = $1 AND name = $2',
        params: [1],
        vendor: 'postgresql',
      }),
    ).rejects.toThrow('Missing parameter: $2');
  });

  it('should throw for missing named parameter', async () => {
    const manager = createMockManager();

    await expect(
      executeQuery(manager, {
        sql: 'SELECT * FROM users WHERE name = :name AND age = :age',
        params: { name: 'Alice' },
        vendor: 'postgresql',
      }),
    ).rejects.toThrow('Missing parameter: age');
  });

  it('should throw when params given but no placeholders found (array)', async () => {
    const manager = createMockManager();

    await expect(
      executeQuery(manager, {
        sql: 'SELECT * FROM users',
        params: [1],
        vendor: 'postgresql',
      }),
    ).rejects.toThrow('no placeholders ($n or ?)');
  });

  it('should throw when params given but no named placeholders found', async () => {
    const manager = createMockManager();

    await expect(
      executeQuery(manager, {
        sql: 'SELECT * FROM users',
        params: { name: 'Alice' },
        vendor: 'postgresql',
      }),
    ).rejects.toThrow('no placeholders (:name)');
  });

  // ---------- SQL validation errors ---------------------------------------

  it('should throw for empty SQL string', async () => {
    const manager = createMockManager();

    await expect(
      executeQuery(manager, {
        sql: '',
        vendor: 'postgresql',
      }),
    ).rejects.toThrow('must not be empty');
  });

  // ---------- Generic database errors -------------------------------------

  it('should sanitize database driver errors', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('FATAL: password authentication failed for user "dbuser"'),
    );

    await expect(
      executeQuery(manager, {
        sql: 'SELECT 1',
        vendor: 'postgresql',
      }),
    ).rejects.toThrow('Query execution failed. See server logs for details.');
  });

  it('should let parameter validation errors propagate', async () => {
    const manager = createMockManager();

    // This triggers "Missing parameter" which should propagate
    await expect(
      executeQuery(manager, {
        sql: 'SELECT * FROM users WHERE id = $1 AND name = $2',
        params: [1],
        vendor: 'postgresql',
      }),
    ).rejects.toThrow('Missing parameter');
  });

  // ---------- PostgreSQL JSON operators -----------------------------------

  it('should allow PostgreSQL JSON operators without params', async () => {
    const manager = createMockManager([{ exists: true }]);

    const result = await executeQuery(manager, {
      sql: "SELECT payload ? 'owner' AS exists FROM events",
      vendor: 'postgresql',
    });

    expect(result.rows).toHaveLength(1);
  });

  // ---------- Multiple positional parameters ------------------------------

  it('should handle multiple positional parameters', async () => {
    const manager = createMockManager([{ id: 1 }]);

    const result = await executeQuery(manager, {
      sql: 'SELECT * FROM users WHERE id = $1 AND status = $2 AND age > $3',
      params: [1, 'active', 18],
      vendor: 'postgresql',
    });

    expect(result.rows).toHaveLength(1);
  });

  it('should handle multiple question-mark placeholders', async () => {
    const manager = createMockManager([{ id: 1 }]);

    const result = await executeQuery(manager, {
      sql: 'SELECT * FROM users WHERE id = ? AND status = ?',
      params: [1, 'active'],
      vendor: 'mysql',
    });

    expect(result.rows).toHaveLength(1);
  });
});
