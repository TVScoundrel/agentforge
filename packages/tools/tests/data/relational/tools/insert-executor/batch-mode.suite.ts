import { describe, expect, it } from 'vitest';
import { createMockManager, executeInsert } from './shared.js';

describe('relational-insert > executor > batch mode', () => {
  it('should insert in batch mode when batch.enabled is true', async () => {
    const manager = createMockManager([{ affectedRows: 2 }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: [
        { name: 'Row1', email: 'r1@example.com' },
        { name: 'Row2', email: 'r2@example.com' },
      ],
      batch: { enabled: true, batchSize: 10 },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rowCount).toBeGreaterThanOrEqual(2);
    expect(result.batch).toBeDefined();
    expect(result.batch?.enabled).toBe(true);
  });

  it('should not use batch mode when batch is undefined', async () => {
    const manager = createMockManager([{ affectedRows: 2 }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: [
        { name: 'A', email: 'a@a.com' },
        { name: 'B', email: 'b@b.com' },
      ],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.batch).toBeUndefined();
  });

  it('should resolve batch defaults when partial options are given', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: [{ name: 'Row1' }],
      batch: { enabled: true },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.batch?.batchSize).toBe(100);
  });

  it('should skip batch mode when batch.enabled is false', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: [{ name: 'Row1' }],
      batch: { enabled: false },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.batch).toBeUndefined();
  });
});
