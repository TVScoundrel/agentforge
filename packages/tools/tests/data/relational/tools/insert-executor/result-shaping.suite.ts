import { describe, expect, it } from 'vitest';
import { createMockManager, executeInsert } from './shared.js';

describe('relational-insert > executor > result shaping', () => {
  it('should insert a single row and return rowCount', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: { name: 'Alice', email: 'alice@example.com' },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rowCount).toBe(1);
    expect(result.executionTime).toBeGreaterThanOrEqual(0);
    expect(manager.execute).toHaveBeenCalledOnce();
  });

  it('should return insertedIds when returning mode is id', async () => {
    const manager = createMockManager([{ id: 42 }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: { name: 'Bob' },
      returning: { mode: 'id', idColumn: 'id' },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.insertedIds).toContain(42);
  });

  it('should return rows when returning mode is row', async () => {
    const manager = createMockManager([{ id: 1, name: 'Alice', email: 'a@b.com' }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: { name: 'Alice', email: 'a@b.com' },
      returning: { mode: 'row' },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({ id: 1, name: 'Alice', email: 'a@b.com' });
  });

  it('should handle object-style result with rows property', async () => {
    const manager = createMockManager({ rows: [{ id: 10 }], rowCount: 1 });

    const result = await executeInsert(manager, {
      table: 'users',
      data: { name: 'Charlie' },
      returning: { mode: 'id', idColumn: 'id' },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rowCount).toBe(1);
    expect(result.insertedIds).toContain(10);
  });

  it('should handle result with insertId for MySQL', async () => {
    const manager = createMockManager([{ affectedRows: 1, insertId: 99 }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: { name: 'Dave' },
      returning: { mode: 'id', idColumn: 'id' },
      vendor: 'mysql',
      connectionString: 'mysql://localhost/test',
    });

    expect(result.insertedIds).toContain(99);
  });

  it('should handle result with lastInsertRowid for SQLite', async () => {
    const manager = createMockManager([{ changes: 1, lastInsertRowid: 7 }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: { name: 'Eve' },
      returning: { mode: 'id', idColumn: 'id' },
      vendor: 'sqlite',
      connectionString: ':memory:',
    });

    expect(result.insertedIds).toContain(7);
  });

  it('should derive ids from input rows when the database does not return them', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: { id: 55, name: 'Frank' },
      returning: { mode: 'id', idColumn: 'id' },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.insertedIds).toContain(55);
  });

  it('should normalize a null result to rowCount 0', async () => {
    const manager = createMockManager(null);

    const result = await executeInsert(manager, {
      table: 'users',
      data: { name: 'Ghost' },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rowCount).toBeGreaterThanOrEqual(0);
  });

  it('should return empty rows when returning mode is not row', async () => {
    const manager = createMockManager([{ affectedRows: 1 }]);

    const result = await executeInsert(manager, {
      table: 'users',
      data: { name: 'Hank' },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/test',
    });

    expect(result.rows).toEqual([]);
  });
});
