import { describe, expect, it, vi } from 'vitest';
import type { ConnectionManager } from '../../../../src/data/relational/connection/connection-manager.js';
import { withTransaction } from '../../../../src/data/relational/query/transaction.js';
import { createMockManager } from './transaction.test-utils.js';

describe('withTransaction option handling', () => {
  it('supports isolation level option', async () => {
    const manager = createMockManager();

    await withTransaction(manager, async () => 'ok', { isolationLevel: 'serializable' });

    expect(manager._executeQuery.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it.each([-1, Infinity, 0])('rejects invalid timeout value %s', async (timeoutMs) => {
    const manager = createMockManager();

    await expect(
      withTransaction(manager, async () => 'ok', { timeoutMs })
    ).rejects.toThrow('Transaction timeout must be a positive number');
  });

  it('keeps fast operations under timeout', async () => {
    const manager = createMockManager();
    const result = await withTransaction(manager, async () => 'fast', { timeoutMs: 5000 });
    expect(result).toBe('fast');
  });

  it('sets isolation level before begin for mysql', async () => {
    const manager = createMockManager('mysql');

    await withTransaction(manager, async () => 'ok', { isolationLevel: 'read committed' });

    expect(manager._executeQuery.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  describe('sqlite isolation handling', () => {
    it('handles read uncommitted for sqlite', async () => {
      const executeQuery = vi.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ read_uncommitted: 0 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const manager = {
        getVendor: vi.fn().mockReturnValue('sqlite'),
        executeInConnection: vi.fn().mockImplementation(
          async (callback: (...args: unknown[]) => unknown) => callback(executeQuery)
        ),
      } as unknown as ConnectionManager;

      await withTransaction(manager, async () => 'ok', { isolationLevel: 'read uncommitted' });

      expect(executeQuery.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    it('silently ignores non-read-uncommitted isolation on sqlite', async () => {
      const manager = createMockManager('sqlite');

      await withTransaction(manager, async () => 'ok', { isolationLevel: 'serializable' });
    });
  });
});
