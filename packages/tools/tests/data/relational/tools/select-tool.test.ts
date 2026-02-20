/**
 * Unit tests for relational-select/index.ts tool wiring
 * Uses vi.mock to test the implement() function without a real database.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockDisconnect = vi.fn().mockResolvedValue(undefined);
const mockExecute = vi.fn().mockResolvedValue([{ id: 1, name: 'Alice' }]);

vi.mock('../../../../src/data/relational/connection/connection-manager.js', () => ({
  ConnectionManager: vi.fn().mockImplementation(() => ({
    connect: mockConnect,
    disconnect: mockDisconnect,
    execute: mockExecute,
  })),
}));

import { relationalSelect } from '../../../../src/data/relational/tools/relational-select/index.js';

describe('relational-select > tool > invoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(undefined);
    mockDisconnect.mockResolvedValue(undefined);
    mockExecute.mockResolvedValue([{ id: 1, name: 'Alice' }]);
  });

  it('should invoke successfully and return rows', async () => {
    const result = await relationalSelect.invoke({
      table: 'users',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(true);
    expect(result.rows).toBeDefined();
    expect(result.rowCount).toBeGreaterThanOrEqual(0);
    expect(mockConnect).toHaveBeenCalledOnce();
    expect(mockDisconnect).toHaveBeenCalledOnce();
  });

  it('should return error response when connection fails', async () => {
    mockConnect.mockRejectedValue(new Error('Connection refused'));

    const result = await relationalSelect.invoke({
      table: 'users',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return safe validation error message', async () => {
    mockExecute.mockRejectedValue(new Error('Table name must not be empty'));

    const result = await relationalSelect.invoke({
      table: 'users',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('must not be empty');
  });

  it('should return generic error for unsafe errors', async () => {
    mockExecute.mockRejectedValue(new Error('FATAL: internal error'));

    const result = await relationalSelect.invoke({
      table: 'users',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should always disconnect even on error', async () => {
    mockExecute.mockRejectedValue(new Error('Query failed'));

    await relationalSelect.invoke({
      table: 'users',
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(mockDisconnect).toHaveBeenCalledOnce();
  });
});
