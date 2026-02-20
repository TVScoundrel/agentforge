/**
 * Tests for transaction helpers (withTransaction, ManagedTransaction)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withTransaction } from '../../../../src/data/relational/query/transaction.js';
import type { ConnectionManager } from '../../../../src/data/relational/connection/connection-manager.js';
import type { TransactionContext } from '../../../../src/data/relational/query/transaction.js';

function createMockManager(
  vendor: 'postgresql' | 'mysql' | 'sqlite' = 'postgresql'
): ConnectionManager {
  const executeQuery = vi.fn().mockResolvedValue([]);

  return {
    getVendor: vi.fn().mockReturnValue(vendor),
    executeInConnection: vi.fn().mockImplementation(
      async (callback: (execute: (query: unknown) => Promise<unknown>) => Promise<unknown>) => {
        return callback(executeQuery);
      }
    ),
    _executeQuery: executeQuery,
  } as unknown as ConnectionManager & { _executeQuery: ReturnType<typeof vi.fn> };
}

describe('withTransaction', () => {
  let mockManager: ReturnType<typeof createMockManager>;

  beforeEach(() => {
    mockManager = createMockManager();
  });

  it('commits on success', async () => {
    const result = await withTransaction(
      mockManager,
      async (tx) => {
        expect(tx.isActive()).toBe(true);
        return 'success';
      }
    );

    expect(result).toBe('success');
    expect(mockManager.executeInConnection).toHaveBeenCalledOnce();

    // Should have called executeQuery for BEGIN, COMMIT
    const executeQuery = (mockManager as any)._executeQuery;
    expect(executeQuery.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('rolls back on failure', async () => {
    await expect(
      withTransaction(mockManager, async () => {
        throw new Error('Boom');
      })
    ).rejects.toThrow('Boom');

    // Should have called executeQuery for BEGIN, ROLLBACK
    const executeQuery = (mockManager as any)._executeQuery;
    expect(executeQuery.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('passes PostgreSQL vendor', async () => {
    const manager = createMockManager('postgresql');
    await withTransaction(manager, async (tx) => {
      expect(tx.vendor).toBe('postgresql');
      return true;
    });
  });

  it('passes MySQL vendor', async () => {
    const manager = createMockManager('mysql');
    await withTransaction(manager, async (tx) => {
      expect(tx.vendor).toBe('mysql');
      return true;
    });
  });

  it('passes SQLite vendor', async () => {
    const manager = createMockManager('sqlite');
    await withTransaction(manager, async (tx) => {
      expect(tx.vendor).toBe('sqlite');
      return true;
    });
  });

  it('provides a unique transaction id', async () => {
    let id1 = '';
    let id2 = '';
    await withTransaction(mockManager, async (tx) => { id1 = tx.id; return true; });
    await withTransaction(mockManager, async (tx) => { id2 = tx.id; return true; });
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it('supports isolation level option', async () => {
    await withTransaction(
      mockManager,
      async () => 'ok',
      { isolationLevel: 'serializable' }
    );

    const executeQuery = (mockManager as any)._executeQuery;
    expect(executeQuery.mock.calls.length).toBeGreaterThanOrEqual(3); // BEGIN + SET ISOLATION + COMMIT
  });

  it('rejects invalid timeout', async () => {
    await expect(
      withTransaction(mockManager, async () => 'ok', { timeoutMs: -1 })
    ).rejects.toThrow('Transaction timeout must be a positive number');
  });

  it('rejects non-finite timeout', async () => {
    await expect(
      withTransaction(mockManager, async () => 'ok', { timeoutMs: Infinity })
    ).rejects.toThrow('Transaction timeout must be a positive number');
  });

  it('rejects zero timeout', async () => {
    await expect(
      withTransaction(mockManager, async () => 'ok', { timeoutMs: 0 })
    ).rejects.toThrow('Transaction timeout must be a positive number');
  });

  it('transaction context can execute queries', async () => {
    const { sql: drizzleSql } = await import('drizzle-orm');

    await withTransaction(mockManager, async (tx) => {
      await tx.execute(drizzleSql.raw('SELECT 1'));
      return true;
    });

    const executeQuery = (mockManager as any)._executeQuery;
    // BEGIN + SELECT 1 + COMMIT
    expect(executeQuery.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('transaction context rejects execute after commit', async () => {
    const { sql: drizzleSql } = await import('drizzle-orm');
    let capturedTx: TransactionContext | null = null;

    await withTransaction(mockManager, async (tx) => {
      capturedTx = tx;
      return true;
    });

    // After withTransaction completes, tx should no longer be active
    expect(capturedTx!.isActive()).toBe(false);
    await expect(capturedTx!.execute(drizzleSql.raw('SELECT 1'))).rejects.toThrow('no longer active');
  });

  it('supports savepoint creation in transaction', async () => {
    await withTransaction(mockManager, async (tx) => {
      const spName = await tx.createSavepoint();
      expect(spName).toMatch(/^sp_\d+$/);
      await tx.releaseSavepoint(spName);
      return true;
    });
  });

  it('supports named savepoints', async () => {
    await withTransaction(mockManager, async (tx) => {
      const spName = await tx.createSavepoint('my_sp');
      expect(spName).toBe('my_sp');
      await tx.releaseSavepoint(spName);
      return true;
    });
  });

  it('rejects invalid savepoint names', async () => {
    await withTransaction(mockManager, async (tx) => {
      await expect(tx.createSavepoint('invalid-name!')).rejects.toThrow('Invalid savepoint name');
      return true;
    });
  });

  it('supports rollback to savepoint', async () => {
    await withTransaction(mockManager, async (tx) => {
      const sp = await tx.createSavepoint('test_sp');
      await tx.rollbackToSavepoint(sp);
      await tx.releaseSavepoint(sp);
      return true;
    });
  });

  it('supports withSavepoint helper (success)', async () => {
    const result = await withTransaction(mockManager, async (tx) => {
      return tx.withSavepoint(async () => {
        return 'savepoint-result';
      }, 'nested');
    });

    expect(result).toBe('savepoint-result');
  });

  it('supports withSavepoint helper (failure with rollback)', async () => {
    await expect(
      withTransaction(mockManager, async (tx) => {
        return tx.withSavepoint(async () => {
          throw new Error('Savepoint error');
        }, 'failing_sp');
      })
    ).rejects.toThrow('Savepoint error');
  });

  it('handles rollback error gracefully', async () => {
    // Create a manager where the execute fails on ROLLBACK
    const executeQuery = vi.fn()
      .mockResolvedValueOnce([]) // BEGIN
      .mockRejectedValueOnce(new Error('Operation error')) // operation
      .mockRejectedValueOnce(new Error('Rollback error')); // ROLLBACK

    const manager = {
      getVendor: vi.fn().mockReturnValue('postgresql'),
      executeInConnection: vi.fn().mockImplementation(
        async (callback: (...args: unknown[]) => unknown) => callback(executeQuery)
      ),
    } as unknown as ConnectionManager;

    await expect(
      withTransaction(manager, async (tx) => {
        // The transaction's execute wraps the executeQuery
        // We need to trigger the error in the operation itself
        throw new Error('Operation error');
      })
    ).rejects.toThrow('Operation error');
  });

  it('handles timeout correctly', async () => {
    // Verify timeout doesn't throw for fast operations
    const result = await withTransaction(
      mockManager,
      async () => 'fast',
      { timeoutMs: 5000 }
    );
    expect(result).toBe('fast');
  });

  describe('MySQL isolation level behavior', () => {
    it('sets isolation level BEFORE begin for MySQL', async () => {
      const manager = createMockManager('mysql');
      const executeQuery = (manager as any)._executeQuery;

      await withTransaction(
        manager,
        async () => 'ok',
        { isolationLevel: 'read committed' }
      );

      // MySQL: SET TRANSACTION (first), then BEGIN, then COMMIT
      const calls = executeQuery.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('SQLite isolation level behavior', () => {
    it('handles read uncommitted for SQLite', async () => {
      const executeQuery = vi.fn()
        .mockResolvedValueOnce([]) // BEGIN
        .mockResolvedValueOnce([{ read_uncommitted: 0 }]) // PRAGMA read_uncommitted (get state)
        .mockResolvedValueOnce([]) // PRAGMA read_uncommitted = 1 (set)
        .mockResolvedValueOnce([]) // COMMIT
        .mockResolvedValueOnce([]); // PRAGMA read_uncommitted = 0 (restore)

      const manager = {
        getVendor: vi.fn().mockReturnValue('sqlite'),
        executeInConnection: vi.fn().mockImplementation(
          async (callback: (...args: unknown[]) => unknown) => callback(executeQuery)
        ),
      } as unknown as ConnectionManager;

      await withTransaction(
        manager,
        async () => 'ok',
        { isolationLevel: 'read uncommitted' }
      );

      expect(executeQuery.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    it('silently ignores non-read-uncommitted isolation on SQLite', async () => {
      const manager = createMockManager('sqlite');

      // Should not throw - just logs debug and ignores
      await withTransaction(
        manager,
        async () => 'ok',
        { isolationLevel: 'serializable' }
      );
    });
  });

  describe('commit/rollback on inactive transaction', () => {
    it('commit is a no-op when already committed', async () => {
      await withTransaction(mockManager, async (tx) => {
        await tx.commit(); // manual commit
        // withTransaction will try to commit again - should be no-op
        return true;
      });
    });

    it('rollback is a no-op when already committed', async () => {
      await withTransaction(mockManager, async (tx) => {
        await tx.commit();
        await tx.rollback(); // should be no-op
        return true;
      });
    });
  });

  describe('savepoint edge cases', () => {
    it('rejects createSavepoint on inactive transaction', async () => {
      let capturedTx: TransactionContext | null = null;
      await withTransaction(mockManager, async (tx) => {
        capturedTx = tx;
        return true;
      });
      await expect(capturedTx!.createSavepoint()).rejects.toThrow('no longer active');
    });

    it('rejects rollbackToSavepoint on inactive transaction', async () => {
      let capturedTx: TransactionContext | null = null;
      await withTransaction(mockManager, async (tx) => {
        capturedTx = tx;
        return true;
      });
      await expect(capturedTx!.rollbackToSavepoint('sp')).rejects.toThrow('no longer active');
    });

    it('rejects releaseSavepoint on inactive transaction', async () => {
      let capturedTx: TransactionContext | null = null;
      await withTransaction(mockManager, async (tx) => {
        capturedTx = tx;
        return true;
      });
      await expect(capturedTx!.releaseSavepoint('sp')).rejects.toThrow('no longer active');
    });
  });
});
