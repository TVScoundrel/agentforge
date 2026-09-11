/**
 * Unit tests for relational-update/index.ts tool wiring
 * Uses vi.mock to test the implement() function without a real database.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockDispose = vi.fn().mockResolvedValue(undefined);
const mockExecute = vi.fn().mockResolvedValue([{ affectedRows: 1 }]);

vi.mock('../../../../src/data/relational/connection/connection-manager.js', () => ({
  ConnectionManager: vi.fn().mockImplementation(() => ({
    connect: mockConnect,
    dispose: mockDispose,
    execute: mockExecute,
  })),
}));

import { relationalUpdate } from '../../../../src/data/relational/tools/relational-update/index.js';

describe('relational-update > tool > invoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(undefined);
    mockDispose.mockResolvedValue(undefined);
    mockExecute.mockResolvedValue([{ affectedRows: 1 }]);
  });

  it('should invoke successfully and return success response', async () => {
    const result = await relationalUpdate.invoke({
      table: 'users',
      data: { status: 'active' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(true);
    expect(result.rowCount).toBeGreaterThanOrEqual(0);
    expect(mockConnect).toHaveBeenCalledOnce();
    expect(mockDispose).toHaveBeenCalledOnce();
  });

  it('should return error response when connection fails', async () => {
    mockConnect.mockRejectedValue(new Error('Connection refused'));

    const result = await relationalUpdate.invoke({
      table: 'users',
      data: { status: 'active' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return safe validation error message', async () => {
    mockExecute.mockRejectedValue(new Error('Update data must not be empty'));

    const result = await relationalUpdate.invoke({
      table: 'users',
      data: { name: 'X' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('must not be empty');
  });

  it('should return generic error for unsafe errors', async () => {
    mockExecute.mockRejectedValue(new Error('FATAL: internal error'));

    const result = await relationalUpdate.invoke({
      table: 'users',
      data: { name: 'Y' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should always dispose even on error', async () => {
    mockExecute.mockRejectedValue(new Error('Query failed'));

    await relationalUpdate.invoke({
      table: 'users',
      data: { name: 'Z' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(mockDispose).toHaveBeenCalledOnce();
  });
});
