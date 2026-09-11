import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ConnectionManager,
  mockPgExecute,
  mockPool,
  mockPoolEnd,
} from './connection-manager.mock-harness.js';
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

  it('disposes the ephemeral Relational Tool Set after a failed invocation', async () => {
    mockPgExecute
      .mockResolvedValueOnce([{ '?column?': 1 }])
      .mockRejectedValueOnce(new Error('query failed'));

    await expectEphemeralLifecycle(async () => {
      const result = await relationalQuery.invoke({ ...database, sql: 'SELECT 1 AS value' });
      expect(result.success).toBe(false);
    });
  });

  it('preserves the legacy Query connection-failure result', async () => {
    mockPgExecute.mockRejectedValueOnce(new Error('connection refused'));

    await expectEphemeralLifecycle(async () => {
      const result = await relationalQuery.invoke({ ...database, sql: 'SELECT 1 AS value' });
      expect(result).toEqual({
        success: false,
        error: 'Failed to initialize postgresql connection',
        rows: [],
        rowCount: 0,
      });
    });
  });

  it('preserves the legacy Select connection-failure result', async () => {
    mockPgExecute.mockRejectedValueOnce(new Error('connection refused'));

    await expectEphemeralLifecycle(async () => {
      const result = await relationalSelect.invoke({ ...database, table: 'users' });
      expect(result).toEqual({
        success: false,
        error: 'Failed to execute SELECT query. Please verify your input and database connection.',
        rows: [],
        rowCount: 0,
      });
    });
  });

  const legacyConnectionFailureCases = (connectionString: string, connectionDescription: string) => [
    {
      name: 'Query',
      connectionDescription,
      invoke: () =>
        relationalQuery.invoke({
          vendor: 'postgresql',
          connectionString,
          sql: 'SELECT 1',
        }),
      expected: {
        success: false,
        error: 'Failed to initialize postgresql connection',
        rows: [],
        rowCount: 0,
      },
    },
    {
      name: 'Select',
      connectionDescription,
      invoke: () =>
        relationalSelect.invoke({
          vendor: 'postgresql',
          connectionString,
          table: 'users',
        }),
      expected: {
        success: false,
        error: 'Failed to execute SELECT query. Please verify your input and database connection.',
        rows: [],
        rowCount: 0,
      },
    },
    {
      name: 'Get Schema',
      connectionDescription,
      invoke: () =>
        relationalGetSchema.invoke({
          vendor: 'postgresql',
          connectionString,
        }),
      expected: {
        success: false,
        error: 'Failed to inspect schema. See logs for details.',
        schema: null,
      },
    },
  ];

  it.each([
    ...legacyConnectionFailureCases('', 'empty'),
    ...legacyConnectionFailureCases('   ', 'whitespace-only'),
  ])('preserves the legacy $name $connectionDescription connection behavior', async ({ invoke, expected }) => {
    mockPgExecute.mockRejectedValueOnce(new Error('connection refused'));

    await expectEphemeralLifecycle(async () => {
      await expect(invoke()).resolves.toEqual(expected);
    });
  });

  it.each([-1, 1.5])('preserves direct legacy Get Schema cacheTtlMs=%s behavior', async (cacheTtlMs) => {
    await expectEphemeralLifecycle(async () => {
      const result = await relationalGetSchema.invoke({ ...database, cacheTtlMs });
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

  it('preserves legacy schema caching across ephemeral Relational Tool Sets', async () => {
    const input = {
      ...database,
      database: 'legacy-cache-scope',
      cacheTtlMs: 60_000,
    };

    const first = await relationalGetSchema.invoke(input);
    const callsAfterFirstInspection = mockPgExecute.mock.calls.length;
    const second = await relationalGetSchema.invoke(input);

    expect(first).toEqual(second);
    expect(mockPgExecute).toHaveBeenCalledTimes(callsAfterFirstInspection + 1);

    await relationalGetSchema.invoke({ ...input, refreshCache: true });
    expect(mockPgExecute.mock.calls.length).toBeGreaterThan(callsAfterFirstInspection + 2);

    const callsAfterRefresh = mockPgExecute.mock.calls.length;
    await relationalGetSchema.invoke({ ...input, database: 'other-cache-scope' });
    expect(mockPgExecute.mock.calls.length).toBeGreaterThan(callsAfterRefresh + 1);

    expect(mockPool).toHaveBeenCalledTimes(4);
    expect(mockPoolEnd).toHaveBeenCalledTimes(4);
  });
});
