import { describe, expect, it } from 'vitest';
import { createMockManager, executeUpdate } from './shared.js';

describe('relational-update > executor > batch mode', () => {
  it('should execute in batch mode when operations and batch.enabled are provided', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeUpdate(manager, {
      table: 'users',
      operations: [
        { data: { name: 'A' }, where: [{ column: 'id', operator: 'eq', value: 1 }] },
        { data: { name: 'B' }, where: [{ column: 'id', operator: 'eq', value: 2 }] },
      ],
      batch: { enabled: true, batchSize: 10 },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.batch).toBeDefined();
    expect(result.batch?.enabled).toBe(true);
    expect(result.batch?.totalItems).toBe(2);
  });

  it('should not use batch mode when batch is undefined', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeUpdate(manager, {
      table: 'users',
      data: { name: 'X' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.batch).toBeUndefined();
  });

  it('should resolve batch defaults', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeUpdate(manager, {
      table: 'users',
      operations: [
        { data: { name: 'X' }, where: [{ column: 'id', operator: 'eq', value: 1 }] },
      ],
      batch: { enabled: true },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.batch?.batchSize).toBe(100);
  });
});
