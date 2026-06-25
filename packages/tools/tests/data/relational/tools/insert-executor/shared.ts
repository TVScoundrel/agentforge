import { vi } from 'vitest';
import type { ConnectionManager } from '../../../../../src/data/relational/connection/connection-manager.js';
import { executeInsert } from '../../../../../src/data/relational/tools/relational-insert/executor.js';

export function createMockManager(executeResult: unknown = []): ConnectionManager {
  return {
    execute: vi.fn().mockResolvedValue(executeResult),
  } as unknown as ConnectionManager;
}

export { executeInsert };
