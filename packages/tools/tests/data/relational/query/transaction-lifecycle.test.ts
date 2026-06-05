import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sql as drizzleSql } from 'drizzle-orm';
import { withTransaction } from '../../../../src/data/relational/query/transaction.js';
import type { ConnectionManager } from '../../../../src/data/relational/connection/connection-manager.js';
import type { TransactionContext } from '../../../../src/data/relational/query/transaction.js';
import { createMockManager } from './transaction.test-utils.js';

describe('withTransaction lifecycle', () => {
  let mockManager: ReturnType<typeof createMockManager>;

  beforeEach(() => {
    mockManager = createMockManager();
  });

  it('commits on success', async () => {
    const result = await withTransaction(mockManager, async (tx) => {
      expect(tx.isActive()).toBe(true);
      return 'success';
    });

    expect(result).toBe('success');
    expect(mockManager.executeInConnection).toHaveBeenCalledOnce();
    expect(mockManager._executeQuery.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('rolls back on failure', async () => {
    await expect(
      withTransaction(mockManager, async () => {
        throw new Error('Boom');
      })
    ).rejects.toThrow('Boom');

    expect(mockManager._executeQuery.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it.each(['postgresql', 'mysql', 'sqlite'] as const)('passes %s vendor through the transaction context', async (vendor) => {
    const manager = createMockManager(vendor);
    await withTransaction(manager, async (tx) => {
      expect(tx.vendor).toBe(vendor);
      return true;
    });
  });

  it('provides unique transaction ids', async () => {
    let id1 = '';
    let id2 = '';

    await withTransaction(mockManager, async (tx) => {
      id1 = tx.id;
      return true;
    });
    await withTransaction(mockManager, async (tx) => {
      id2 = tx.id;
      return true;
    });

    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it('transaction context can execute queries', async () => {
    await withTransaction(mockManager, async (tx) => {
      await tx.execute(drizzleSql.raw('SELECT 1'));
      return true;
    });

    expect(mockManager._executeQuery.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('transaction context rejects execute after commit', async () => {
    let capturedTx: TransactionContext | null = null;

    await withTransaction(mockManager, async (tx) => {
      capturedTx = tx;
      return true;
    });

    expect(capturedTx!.isActive()).toBe(false);
    await expect(capturedTx!.execute(drizzleSql.raw('SELECT 1'))).rejects.toThrow('no longer active');
  });

  it('handles rollback error gracefully', async () => {
    const executeQuery = vi.fn()
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('Operation error'))
      .mockRejectedValueOnce(new Error('Rollback error'));

    const manager = {
      getVendor: vi.fn().mockReturnValue('postgresql'),
      executeInConnection: vi.fn().mockImplementation(
        async (callback: (...args: unknown[]) => unknown) => callback(executeQuery)
      ),
    } as unknown as ConnectionManager;

    await expect(
      withTransaction(manager, async () => {
        throw new Error('Operation error');
      })
    ).rejects.toThrow('Operation error');
  });

  it('commit is a no-op when already committed', async () => {
    await withTransaction(mockManager, async (tx) => {
      await tx.commit();
      return true;
    });
  });

  it('rollback is a no-op when already committed', async () => {
    await withTransaction(mockManager, async (tx) => {
      await tx.commit();
      await tx.rollback();
      return true;
    });
  });
});
