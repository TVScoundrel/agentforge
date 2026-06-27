import { describe, expect, it } from 'vitest';
import { createMockManager, executeUpdate } from './shared.js';

describe('relational-update > executor > result shaping', () => {
  it('should execute a single UPDATE and return rowCount', async () => {
    const manager = createMockManager([{ affectedRows: 3 }]);

    const result = await executeUpdate(manager, {
      table: 'users',
      data: { status: 'active' },
      where: [{ column: 'status', operator: 'eq', value: 'pending' }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rowCount).toBe(3);
    expect(result.executionTime).toBeGreaterThanOrEqual(0);
    expect(manager.execute).toHaveBeenCalledOnce();
  });

  it('should handle object-style result with rowCount property', async () => {
    const manager = createMockManager({ rowCount: 5, rows: [] });

    const result = await executeUpdate(manager, {
      table: 'users',
      data: { active: true },
      where: [{ column: 'org_id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rowCount).toBe(5);
  });

  it('should handle SQLite changes result', async () => {
    const manager = createMockManager([{ changes: 2 }]);

    const result = await executeUpdate(manager, {
      table: 'users',
      data: { name: 'Updated' },
      where: [{ column: 'id', operator: 'in', value: [1, 2] }],
      vendor: 'sqlite',
      connectionString: ':memory:',
    });

    expect(result.rowCount).toBe(2);
  });

  it('should normalize null result to rowCount 0', async () => {
    const manager = createMockManager(null);

    const result = await executeUpdate(manager, {
      table: 'users',
      data: { name: 'X' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rowCount).toBe(0);
  });

  it('should succeed on optimistic lock when rowCount > 0', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeUpdate(manager, {
      table: 'users',
      data: { name: 'OL-OK' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      optimisticLock: {
        column: 'version',
        expectedValue: 5,
      },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rowCount).toBe(1);
  });
});
