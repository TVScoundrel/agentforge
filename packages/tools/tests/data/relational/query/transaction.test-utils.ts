import { vi } from 'vitest';
import type { SQL } from 'drizzle-orm';
import type { ConnectionManager } from '../../../../src/data/relational/connection/connection-manager.js';

export function createMockManager(
  vendor: 'postgresql' | 'mysql' | 'sqlite' = 'postgresql'
): ConnectionManager & { _executeQuery: ReturnType<typeof vi.fn> } {
  const executeQuery = vi.fn().mockResolvedValue([]);

  return {
    getVendor: vi.fn().mockReturnValue(vendor),
    executeInConnection: vi.fn().mockImplementation(
      async (callback: (execute: (query: SQL) => Promise<unknown>) => Promise<unknown>) => {
        return callback(executeQuery);
      }
    ),
    _executeQuery: executeQuery,
  } as unknown as ConnectionManager & { _executeQuery: ReturnType<typeof vi.fn> };
}
