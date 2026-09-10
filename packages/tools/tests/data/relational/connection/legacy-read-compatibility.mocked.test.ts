import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConnectionManager, mockPool, mockPoolEnd } from './connection-manager.mock-harness.js';
import {
  relationalGetSchema,
  relationalQuery,
  relationalSelect,
} from '../../../../src/data/relational/tools/index.js';

describe('legacy Relational read Tool compatibility', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function expectEphemeralLifecycle(invoke: () => Promise<unknown>): Promise<void> {
    const dispose = vi.spyOn(ConnectionManager.prototype, 'dispose');
    const emitWarning = vi.spyOn(process, 'emitWarning');

    await invoke();

    expect(mockPool).toHaveBeenCalledOnce();
    expect(dispose).toHaveBeenCalledOnce();
    expect(mockPoolEnd).toHaveBeenCalledOnce();
    expect(emitWarning).not.toHaveBeenCalled();
  }

  const database = {
    vendor: 'postgresql' as const,
    connectionString: 'postgresql://localhost/agentforge',
  };

  it('runs Query through one ephemeral Relational Tool Set', async () => {
    await expectEphemeralLifecycle(async () => {
      const result = await relationalQuery.invoke({ ...database, sql: 'SELECT 1 AS value' });
      expect(result.success).toBe(true);
    });
  });

  it('runs Select through one ephemeral Relational Tool Set', async () => {
    await expectEphemeralLifecycle(async () => {
      const result = await relationalSelect.invoke({ ...database, table: 'users' });
      expect(result.success).toBe(true);
    });
  });

  it('runs Get Schema through one ephemeral Relational Tool Set', async () => {
    await expectEphemeralLifecycle(async () => {
      const result = await relationalGetSchema.invoke({
        ...database,
        database: 'agentforge',
        cacheTtlMs: 0,
        refreshCache: true,
      });
      expect(result.success).toBe(true);
    });
  });
});
