import { describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import type { ConnectionManager } from '../../../src/data/relational/connection/connection-manager.js';
import { withTransaction } from '../../../src/data/relational/query/transaction.js';

function createMockManager(vendor: 'sqlite' | 'mysql' = 'sqlite') {
  let executeCallCount = 0;

  const manager = {
    getVendor: () => vendor,
    executeInConnection: async <T>(
      callback: (execute: (query: ReturnType<typeof sql.raw>) => Promise<unknown>) => Promise<T>
    ): Promise<T> => {
      return callback(async () => {
        executeCallCount += 1;
        return [];
      });
    },
  } as unknown as ConnectionManager;

  return {
    manager,
    getExecuteCallCount: () => executeCallCount,
  };
}

describe('transaction timeout and savepoint safety', () => {
  it('rejects invalid savepoint names', async () => {
    const { manager } = createMockManager();

    await expect(
      withTransaction(manager, async (transaction) => {
        await transaction.createSavepoint('bad name with spaces');
      })
    ).rejects.toThrow('Invalid savepoint name');
  });

  it('prevents late execute calls after timeout cancellation', async () => {
    const { manager, getExecuteCallCount } = createMockManager();
    let lateExecutionError: Error | null = null;

    await expect(
      withTransaction(
        manager,
        async (transaction) => {
          await new Promise((resolve) => setTimeout(resolve, 20));
          try {
            await transaction.execute(sql.raw('SELECT 1'));
          } catch (error) {
            lateExecutionError = error as Error;
          }
        },
        { timeoutMs: 5 }
      )
    ).rejects.toThrow('Transaction timed out after 5ms');

    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(lateExecutionError).toBeInstanceOf(Error);
    expect(lateExecutionError?.message).toContain('Transaction timed out after 5ms');
    // BEGIN + ROLLBACK only; late execute() must be blocked before hitting executor.
    expect(getExecuteCallCount()).toBe(2);
  });
});
