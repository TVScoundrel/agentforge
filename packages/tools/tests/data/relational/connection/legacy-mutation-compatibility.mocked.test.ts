import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ConnectionManager,
  mockPgExecute,
  mockPool,
  mockPoolEnd,
} from './connection-manager.mock-harness.js';
import {
  relationalDelete,
  relationalInsert,
  relationalUpdate,
} from '../../../../src/data/relational/tools/index.js';

describe('legacy Relational mutation Tool compatibility', () => {
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

  it.each([
    [
      'Insert',
      () => relationalInsert.invoke({ ...database, table: 'users', data: { name: 'Alice' } }),
    ],
    [
      'Update',
      () =>
        relationalUpdate.invoke({
          ...database,
          table: 'users',
          data: { status: 'inactive' },
          where: [{ column: 'id', operator: 'eq' as const, value: 42 }],
        }),
    ],
    [
      'Delete',
      () =>
        relationalDelete.invoke({
          ...database,
          table: 'users',
          where: [{ column: 'id', operator: 'eq' as const, value: 42 }],
        }),
    ],
  ])('runs %s through one ephemeral Relational Tool Set', async (_name, invoke) => {
    await expectEphemeralLifecycle(async () => {
      const result = await invoke();
      expect(result.success).toBe(true);
    });
  });

  it.each([
    [
      'Insert',
      () => relationalInsert.invoke({ ...database, table: 'users', data: { name: 'Alice' } }),
      {
        success: false,
        error: 'Failed to execute INSERT query. Please verify your input and database connection.',
        rowCount: 0,
        insertedIds: [],
        rows: [],
      },
    ],
    [
      'Update',
      () =>
        relationalUpdate.invoke({
          ...database,
          table: 'users',
          data: { status: 'inactive' },
          where: [{ column: 'id', operator: 'eq' as const, value: 42 }],
        }),
      {
        success: false,
        error: 'Failed to execute UPDATE query. Please verify your input and database connection.',
        rowCount: 0,
      },
    ],
    [
      'Delete',
      () =>
        relationalDelete.invoke({
          ...database,
          table: 'users',
          where: [{ column: 'id', operator: 'eq' as const, value: 42 }],
        }),
      {
        success: false,
        error: 'Failed to execute DELETE query. Please verify your input and database connection.',
        rowCount: 0,
        softDeleted: false,
      },
    ],
  ])('preserves the legacy %s connection-failure result', async (_name, invoke, expected) => {
    mockPgExecute.mockRejectedValueOnce(new Error('connection refused'));

    await expectEphemeralLifecycle(async () => {
      await expect(invoke()).resolves.toEqual(expected);
    });
  });
});
