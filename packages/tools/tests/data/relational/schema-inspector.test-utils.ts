import { vi } from 'vitest';
import type { ConnectionManager } from '../../../src/data/relational/connection/connection-manager.js';

export function createMockManager(queue: Array<{ rows: unknown[] }>): {
  manager: ConnectionManager;
  executeMock: ReturnType<typeof vi.fn>;
} {
  const executeMock = vi.fn();
  for (const result of queue) {
    executeMock.mockResolvedValueOnce(result);
  }

  const manager = { execute: executeMock } as unknown as ConnectionManager;
  return { manager, executeMock };
}
