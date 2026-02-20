/**
 * Unit tests for relational-get-schema tool
 * Uses vi.mock to test the implement() function without a real database.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockDisconnect = vi.fn().mockResolvedValue(undefined);
const mockExecute = vi.fn().mockResolvedValue([]);

vi.mock('../../../../src/data/relational/connection/connection-manager.js', () => ({
  ConnectionManager: vi.fn().mockImplementation(() => ({
    connect: mockConnect,
    disconnect: mockDisconnect,
    execute: mockExecute,
  })),
}));

const mockInspect = vi.fn().mockResolvedValue({
  tables: [
    {
      name: 'users',
      columns: [
        { name: 'id', dataType: 'integer', nullable: false },
        { name: 'name', dataType: 'text', nullable: false },
      ],
      primaryKey: ['id'],
      foreignKeys: [],
      indexes: [{ name: 'pk_users', columns: ['id'], unique: true }],
    },
  ],
});
const mockInvalidateCache = vi.fn();

vi.mock('../../../../src/data/relational/schema/schema-inspector.js', () => ({
  SchemaInspector: vi.fn().mockImplementation(() => ({
    inspect: mockInspect,
    invalidateCache: mockInvalidateCache,
  })),
}));

import { relationalGetSchema } from '../../../../src/data/relational/tools/relational-get-schema.js';

describe('relational-get-schema > tool > invoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(undefined);
    mockDisconnect.mockResolvedValue(undefined);
    mockInspect.mockResolvedValue({
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', dataType: 'integer', nullable: false },
            { name: 'name', dataType: 'text', nullable: false },
          ],
          primaryKey: ['id'],
          foreignKeys: [],
          indexes: [{ name: 'pk_users', columns: ['id'], unique: true }],
        },
      ],
    });
  });

  it('should inspect schema and return success', async () => {
    const result = await relationalGetSchema.invoke({
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(true);
    expect(result.schema).toBeDefined();
    expect(result.summary?.tableCount).toBe(1);
    expect(result.summary?.columnCount).toBe(2);
    expect(result.summary?.indexCount).toBe(1);
    expect(mockConnect).toHaveBeenCalledOnce();
    expect(mockDisconnect).toHaveBeenCalledOnce();
  });

  it('should pass table filters to inspector', async () => {
    await relationalGetSchema.invoke({
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
      tables: ['public_users'],
    });

    expect(mockInspect).toHaveBeenCalledWith({ tables: ['public_users'] });
  });

  it('should invalidate cache when refreshCache is true', async () => {
    await relationalGetSchema.invoke({
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
      refreshCache: true,
    });

    expect(mockInvalidateCache).toHaveBeenCalledOnce();
  });

  it('should not invalidate cache by default', async () => {
    await relationalGetSchema.invoke({
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(mockInvalidateCache).not.toHaveBeenCalled();
  });

  it('should return error on connection failure', async () => {
    mockConnect.mockRejectedValue(new Error('Connection refused'));

    const result = await relationalGetSchema.invoke({
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return safe validation error messages', async () => {
    mockInspect.mockRejectedValue(new Error('Table filter contains invalid characters'));

    const result = await relationalGetSchema.invoke({
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
      tables: ['bad;table'],
    });

    expect(result.success).toBe(false);
    // The error should propagate the safe message
    expect(result.error).toBeDefined();
  });

  it('should sanitize unknown errors', async () => {
    mockInspect.mockRejectedValue(new Error('FATAL: internal database error'));

    const result = await relationalGetSchema.invoke({
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to inspect schema. See logs for details.');
  });

  it('should always disconnect even on error', async () => {
    mockInspect.mockRejectedValue(new Error('kaboom'));

    await relationalGetSchema.invoke({
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(mockDisconnect).toHaveBeenCalledOnce();
  });

  it('should calculate correct summary', async () => {
    mockInspect.mockResolvedValue({
      tables: [
        {
          name: 'orders',
          columns: [{ name: 'id' }, { name: 'user_id' }, { name: 'amount' }],
          primaryKey: ['id'],
          foreignKeys: [{ name: 'fk_user', columns: ['user_id'], references: { table: 'users', columns: ['id'] } }],
          indexes: [],
        },
        {
          name: 'items',
          columns: [{ name: 'id' }],
          primaryKey: ['id'],
          foreignKeys: [],
          indexes: [{ name: 'idx_1', columns: ['id'], unique: false }],
        },
      ],
    });

    const result = await relationalGetSchema.invoke({
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.summary?.tableCount).toBe(2);
    expect(result.summary?.columnCount).toBe(4);
    expect(result.summary?.foreignKeyCount).toBe(1);
    expect(result.summary?.indexCount).toBe(1);
  });
});
