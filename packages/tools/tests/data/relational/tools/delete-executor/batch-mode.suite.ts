import { describe, expect, it } from 'vitest';
import { createMockManager, executeDelete } from './shared.js';

describe('relational-delete > executor > batch mode', () => {
  it('should execute in batch mode when operations and batch.enabled', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeDelete(manager, {
      table: 'users',
      operations: [
        { where: [{ column: 'id', operator: 'eq', value: 1 }] },
        { where: [{ column: 'id', operator: 'eq', value: 2 }] },
      ],
      batch: { enabled: true, batchSize: 10 },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.batch).toBeDefined();
    expect(result.batch?.enabled).toBe(true);
    expect(result.batch?.totalItems).toBe(2);
  });

  it('should NOT use batch mode when batch is undefined', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeDelete(manager, {
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.batch).toBeUndefined();
  });

  it('should resolve batch defaults', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeDelete(manager, {
      table: 'users',
      operations: [
        { where: [{ column: 'id', operator: 'eq', value: 1 }] },
      ],
      batch: { enabled: true },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.batch?.batchSize).toBe(100);
  });

  it('should handle batch soft-delete operations', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeDelete(manager, {
      table: 'users',
      operations: [
        { where: [{ column: 'id', operator: 'eq', value: 1 }], softDelete: { column: 'deleted_at' } },
      ],
      batch: { enabled: true },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.batch).toBeDefined();
  });
});
