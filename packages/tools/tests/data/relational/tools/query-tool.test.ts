/**
 * Unit tests for relational-query tool
 * Uses vi.mock to test the implement() function without a real database.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockInitialize = vi.fn().mockResolvedValue(undefined);
const mockClose = vi.fn().mockResolvedValue(undefined);
const mockExecute = vi.fn().mockResolvedValue([{ id: 1, name: 'Alice' }]);

vi.mock('../../../../src/data/relational/connection/connection-manager.js', () => ({
  ConnectionManager: vi.fn().mockImplementation(() => ({
    initialize: mockInitialize,
    close: mockClose,
    execute: mockExecute,
  })),
}));

vi.mock('../../../../src/data/relational/query/query-executor.js', () => ({
  executeQuery: vi.fn().mockResolvedValue({
    rows: [{ id: 1, name: 'Alice' }],
    rowCount: 1,
    executionTime: 5,
  }),
}));

import { relationalQuery } from '../../../../src/data/relational/tools/relational-query.js';
import { executeQuery as mockExecuteQuery } from '../../../../src/data/relational/query/query-executor.js';

describe('relational-query > tool > invoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInitialize.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);
    (mockExecuteQuery as ReturnType<typeof vi.fn>).mockResolvedValue({
      rows: [{ id: 1, name: 'Alice' }],
      rowCount: 1,
      executionTime: 5,
    });
  });

  it('should execute a query and return success', async () => {
    const result = await relationalQuery.invoke({
      sql: 'SELECT * FROM users',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(1);
    expect(result.rowCount).toBe(1);
    expect(result.executionTime).toBe(5);
    expect(mockInitialize).toHaveBeenCalledOnce();
    expect(mockClose).toHaveBeenCalledOnce();
  });

  it('should pass params to executeQuery', async () => {
    await relationalQuery.invoke({
      sql: 'SELECT * FROM users WHERE id = $1',
      params: [42],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(mockExecuteQuery as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        sql: 'SELECT * FROM users WHERE id = $1',
        params: [42],
        vendor: 'postgresql',
      }),
    );
  });

  it('should return error on initialization failure', async () => {
    mockInitialize.mockRejectedValue(new Error('Connection refused'));

    const result = await relationalQuery.invoke({
      sql: 'SELECT 1',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Connection refused');
    expect(result.rows).toEqual([]);
    expect(result.rowCount).toBe(0);
  });

  it('should return error on query execution failure', async () => {
    (mockExecuteQuery as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Invalid SQL syntax'));

    const result = await relationalQuery.invoke({
      sql: 'SELECTT * FROM users',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid SQL syntax');
  });

  it('should always close connection even on error', async () => {
    (mockExecuteQuery as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Query error'));

    await relationalQuery.invoke({
      sql: 'SELECT 1',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(mockClose).toHaveBeenCalledOnce();
  });

  it('should handle non-Error exceptions', async () => {
    (mockExecuteQuery as ReturnType<typeof vi.fn>).mockRejectedValue('string error');

    const result = await relationalQuery.invoke({
      sql: 'SELECT 1',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unknown error occurred');
  });
});
