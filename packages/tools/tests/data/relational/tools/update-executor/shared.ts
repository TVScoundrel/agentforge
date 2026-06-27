import { vi } from 'vitest';
import type { ConnectionManager } from '../../../../../src/data/relational/connection/connection-manager.js';
import { executeUpdate } from '../../../../../src/data/relational/tools/relational-update/executor.js';

export function createMockManager(executeResult: unknown = []): ConnectionManager {
  return {
    execute: vi.fn().mockResolvedValue(executeResult),
  } as unknown as ConnectionManager;
}

export { executeUpdate };
