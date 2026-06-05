import { beforeEach, describe, expect, it } from 'vitest';
import type { TransactionContext } from '../../../../src/data/relational/query/transaction.js';
import { withTransaction } from '../../../../src/data/relational/query/transaction.js';
import { createMockManager } from './transaction.test-utils.js';

describe('withTransaction savepoint behavior', () => {
  let mockManager: ReturnType<typeof createMockManager>;

  beforeEach(() => {
    mockManager = createMockManager();
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

  it('supports withSavepoint helper on success', async () => {
    const result = await withTransaction(mockManager, async (tx) => {
      return tx.withSavepoint(async () => 'savepoint-result', 'nested');
    });

    expect(result).toBe('savepoint-result');
  });

  it('supports withSavepoint helper rollback on failure', async () => {
    await expect(
      withTransaction(mockManager, async (tx) => {
        return tx.withSavepoint(async () => {
          throw new Error('Savepoint error');
        }, 'failing_sp');
      })
    ).rejects.toThrow('Savepoint error');
  });

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
