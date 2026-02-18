/**
 * Tool Invocation Tests for Relational SELECT Tool
 *
 * Tests tool invocation and query execution for the relational-select tool.
 * Uses a real temporary SQLite table for accurate testing instead of subqueries.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { relationalSelect } from '../../../../src/data/relational/tools/relational-select/index.js';
import { hasSQLiteBindings } from './test-utils.js';

/**
 * Helper to create a temporary SQLite database file with test data.
 * Returns the path to the database file.
 */
async function createTestDatabase(): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const path = await import('path');
  const os = await import('os');
  const fs = await import('fs');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'relational-select-test-'));
  const dbPath = path.join(tmpDir, 'test.db');

  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE test_users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      status TEXT DEFAULT 'active'
    );
    INSERT INTO test_users (id, name, email, status) VALUES (1, 'Alice', 'alice@example.com', 'active');
    INSERT INTO test_users (id, name, email, status) VALUES (2, 'Bob', 'bob@example.com', 'inactive');
    INSERT INTO test_users (id, name, email, status) VALUES (3, 'Charlie', 'charlie@example.com', 'active');
  `);
  db.close();

  return dbPath;
}

describe('Relational SELECT - Tool Invocation', () => {
  let dbPath: string | undefined;

  const getDbPath = (): string => {
    if (!dbPath) {
      throw new Error('SQLite test database path was not initialized');
    }
    return dbPath;
  };

  beforeAll(async () => {
    if (hasSQLiteBindings) {
      dbPath = await createTestDatabase();
    }
  });

  afterAll(async () => {
    if (dbPath) {
      const fs = await import('fs');
      const path = await import('path');
      try {
        fs.unlinkSync(dbPath);
        fs.rmdirSync(path.dirname(dbPath));
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it.skipIf(!hasSQLiteBindings)('should execute simple SELECT query', async () => {
    const result = await relationalSelect.invoke({
      table: 'test_users',
      vendor: 'sqlite',
      connectionString: getDbPath()
    });

    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(3);
    expect(result.executionTime).toBeGreaterThan(0);
  });

  it.skipIf(!hasSQLiteBindings)('should handle non-existent table gracefully', async () => {
    const result = await relationalSelect.invoke({
      table: 'nonexistent_table',
      vendor: 'sqlite',
      connectionString: getDbPath()
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.rows).toEqual([]);
    expect(result.rowCount).toBe(0);
  });

  it.skipIf(!hasSQLiteBindings)('should select specific columns', async () => {
    const result = await relationalSelect.invoke({
      table: 'test_users',
      columns: ['id', 'name'],
      vendor: 'sqlite',
      connectionString: getDbPath()
    });

    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(3);
    if (result.rows && result.rows.length > 0) {
      const firstRow = result.rows[0] as Record<string, unknown>;
      expect(firstRow).toHaveProperty('id');
      expect(firstRow).toHaveProperty('name');
      expect(firstRow).not.toHaveProperty('email');
      expect(firstRow).not.toHaveProperty('status');
    }
  });

  it.skipIf(!hasSQLiteBindings)('should apply LIMIT', async () => {
    const result = await relationalSelect.invoke({
      table: 'test_users',
      limit: 2,
      vendor: 'sqlite',
      connectionString: getDbPath()
    });

    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(2);
  });

  it.skipIf(!hasSQLiteBindings)('should apply OFFSET', async () => {
    const result = await relationalSelect.invoke({
      table: 'test_users',
      offset: 1,
      vendor: 'sqlite',
      connectionString: getDbPath()
    });

    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(2); // Should skip first row
  });

  it.skipIf(!hasSQLiteBindings)('should apply LIMIT and OFFSET together', async () => {
    const result = await relationalSelect.invoke({
      table: 'test_users',
      limit: 1,
      offset: 1,
      vendor: 'sqlite',
      connectionString: getDbPath()
    });

    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(1); // Skip 1, take 1
  });

  it.skipIf(!hasSQLiteBindings)('should apply ORDER BY on name ascending', async () => {
    const result = await relationalSelect.invoke({
      table: 'test_users',
      orderBy: [{ column: 'name', direction: 'asc' }],
      vendor: 'sqlite',
      connectionString: getDbPath()
    });

    expect(result.success).toBe(true);
    const names = (result.rows ?? []).map((row) => (row as Record<string, unknown>).name);
    expect(names).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it.skipIf(!hasSQLiteBindings)('should filter rows using WHERE conditions', async () => {
    const result = await relationalSelect.invoke({
      table: 'test_users',
      where: [{ column: 'status', operator: 'eq', value: 'active' }],
      orderBy: [{ column: 'id', direction: 'asc' }],
      vendor: 'sqlite',
      connectionString: getDbPath()
    });

    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(2);
    const allActive = (result.rows ?? []).every(
      (row) => (row as Record<string, unknown>).status === 'active'
    );
    expect(allActive).toBe(true);
  });

  it('should reject empty table name', () => {
    const result = relationalSelect.schema.safeParse({
      table: '',
      vendor: 'sqlite',
      connectionString: ':memory:'
    });

    expect(result.success).toBe(false);
  });

  it('should reject empty connection string', () => {
    const result = relationalSelect.schema.safeParse({
      table: 'users',
      vendor: 'sqlite',
      connectionString: ''
    });

    expect(result.success).toBe(false);
  });
});
