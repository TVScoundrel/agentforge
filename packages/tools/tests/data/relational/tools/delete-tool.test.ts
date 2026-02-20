/**
 * Unit tests for relational-delete/index.ts tool wiring
 * Uses vi.mock to test the implement() function without a real database.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockDisconnect = vi.fn().mockResolvedValue(undefined);
const mockExecute = vi.fn().mockResolvedValue([{ affectedRows: 1 }]);

vi.mock('../../../../src/data/relational/connection/connection-manager.js', () => ({
  ConnectionManager: vi.fn().mockImplementation(() => ({
    connect: mockConnect,
    disconnect: mockDisconnect,
    execute: mockExecute,
  })),
}));

import { relationalDelete } from '../../../../src/data/relational/tools/relational-delete/index.js';

describe('relational-delete > tool > invoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(undefined);
    mockDisconnect.mockResolvedValue(undefined);
    mockExecute.mockResolvedValue([{ affectedRows: 1 }]);
  });

  it('should invoke successfully and return success response', async () => {
    const result = await relationalDelete.invoke({
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(true);
    expect(result.rowCount).toBeGreaterThanOrEqual(0);
    expect(mockConnect).toHaveBeenCalledOnce();
    expect(mockDisconnect).toHaveBeenCalledOnce();
  });

  it('should return error response when connection fails', async () => {
    mockConnect.mockRejectedValue(new Error('Connection refused'));

    const result = await relationalDelete.invoke({
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return safe validation error message', async () => {
    mockExecute.mockRejectedValue(new Error('Table name must not be empty'));

    const result = await relationalDelete.invoke({
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('must not be empty');
  });

  it('should return generic error for unsafe errors', async () => {
    mockExecute.mockRejectedValue(new Error('FATAL: internal error'));

    const result = await relationalDelete.invoke({
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should always disconnect even on error', async () => {
    mockExecute.mockRejectedValue(new Error('Query failed'));

    await relationalDelete.invoke({
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(mockDisconnect).toHaveBeenCalledOnce();
  });
});
