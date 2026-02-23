/**
 * Tool Invocation Tests for Relational UPDATE Tool
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { relationalUpdate } from '../../../../src/data/relational/tools/relational-update/index.js';
import { hasSQLiteBindings } from './test-utils.js';

async function createTestDatabase(): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const path = await import('path');
  const os = await import('os');
  const fs = await import('fs');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'relational-update-test-'));
  const dbPath = path.join(tmpDir, 'test.db');

  const db = new Database(dbPath);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'active',
      version INTEGER DEFAULT 1
    );
    INSERT INTO users (name, email, status, version)
    VALUES
      ('Alice', 'alice@example.com', 'active', 1),
      ('Bob', 'bob@example.com', 'active', 1),
      ('Carol', 'carol@example.com', 'active', 1);
  `);
  db.close();

  return dbPath;
}

describe('Relational UPDATE - Tool Invocation', () => {
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

  it.skipIf(!hasSQLiteBindings)('should update one row with WHERE condition', async () => {
    const result = await relationalUpdate.invoke({
      table: 'users',
      data: { status: 'inactive' },
      where: [{ column: 'email', operator: 'eq', value: 'alice@example.com' }],
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    expect(result.success).toBe(true);
    expect(result.rowCount).toBe(1);
    if (result.success) {
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    }
  });

  it.skipIf(!hasSQLiteBindings)('should prevent full-table update by default', async () => {
    const result = await relationalUpdate.invoke({
      table: 'users',
      data: { status: 'inactive' },
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/WHERE conditions are required/i);
    expect(result.rowCount).toBe(0);
  });

  it.skipIf(!hasSQLiteBindings)('should allow full-table update when explicitly enabled', async () => {
    const result = await relationalUpdate.invoke({
      table: 'users',
      data: { status: 'archived' },
      allowFullTableUpdate: true,
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    expect(result.success).toBe(true);
    expect(result.rowCount).toBeGreaterThan(0);
  });

  it.skipIf(!hasSQLiteBindings)('should support optimistic locking and detect stale updates', async () => {
    const first = await relationalUpdate.invoke({
      table: 'users',
      data: { version: 2, status: 'active' },
      where: [{ column: 'email', operator: 'eq', value: 'bob@example.com' }],
      optimisticLock: { column: 'version', expectedValue: 1 },
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    expect(first.success).toBe(true);
    expect(first.rowCount).toBe(1);

    const stale = await relationalUpdate.invoke({
      table: 'users',
      data: { version: 3, status: 'inactive' },
      where: [{ column: 'email', operator: 'eq', value: 'bob@example.com' }],
      optimisticLock: { column: 'version', expectedValue: 1 },
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    expect(stale.success).toBe(false);
    expect(stale.error).toBe('Update failed: optimistic lock check failed.');
    expect(stale.rowCount).toBe(0);
  });

  it.skipIf(!hasSQLiteBindings)('should execute batch update operations with configurable batch size', async () => {
    const result = await relationalUpdate.invoke({
      table: 'users',
      operations: [
        {
          data: { status: 'paused' },
          where: [{ column: 'email', operator: 'eq', value: 'alice@example.com' }],
        },
        {
          data: { status: 'paused' },
          where: [{ column: 'email', operator: 'eq', value: 'bob@example.com' }],
        },
      ],
      batch: {
        batchSize: 1,
      },
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    expect(result.success).toBe(true);
    expect(result.rowCount).toBe(2);
    if (result.success) {
      expect(result.batch?.enabled).toBe(true);
      expect(result.batch?.batchSize).toBe(1);
      expect(result.batch?.totalItems).toBe(2);
      expect(result.batch?.failedItems).toBe(0);
    }
  });

  it.skipIf(!hasSQLiteBindings)('should report partial success for batch updates when continueOnError is enabled', async () => {
    const result = await relationalUpdate.invoke({
      table: 'users',
      operations: [
        {
          data: { version: 2, status: 'active' },
          where: [{ column: 'email', operator: 'eq', value: 'carol@example.com' }],
          optimisticLock: { column: 'version', expectedValue: 1 },
        },
        {
          data: { version: 3, status: 'inactive' },
          where: [{ column: 'email', operator: 'eq', value: 'carol@example.com' }],
          optimisticLock: { column: 'version', expectedValue: 1 },
        },
      ],
      batch: {
        batchSize: 1,
        continueOnError: true,
      },
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    expect(result.success).toBe(true);
    expect(result.rowCount).toBe(1);
    if (result.success) {
      expect(result.batch?.partialSuccess).toBe(true);
      expect(result.batch?.failedItems).toBe(1);
      expect(result.batch?.successfulItems).toBe(1);
      expect(result.batch?.failures.length).toBeGreaterThanOrEqual(1);
    }
  });

  it.skipIf(!hasSQLiteBindings)('should return clear error for unique constraint violations', async () => {
    const result = await relationalUpdate.invoke({
      table: 'users',
      data: { email: 'alice@example.com' },
      where: [{ column: 'email', operator: 'eq', value: 'carol@example.com' }],
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Update failed: unique constraint violation.');
    expect(result.rowCount).toBe(0);
  });
});
