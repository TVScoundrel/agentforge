/**
 * Tool Invocation Tests for Relational DELETE Tool
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { relationalDelete } from '../../../../src/data/relational/tools/relational-delete/index.js';
import { relationalInsert } from '../../../../src/data/relational/tools/relational-insert/index.js';
import { hasSQLiteBindings } from './test-utils.js';

async function createTestDatabase(): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const path = await import('path');
  const os = await import('os');
  const fs = await import('fs');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'relational-delete-test-'));
  const dbPath = path.join(tmpDir, 'test.db');

  const db = new Database(dbPath);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      deleted_at TEXT
    );
    CREATE TABLE sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    INSERT INTO users (name, email)
    VALUES
      ('Alice', 'alice@example.com'),
      ('Bob', 'bob@example.com'),
      ('Carol', 'carol@example.com');

    INSERT INTO sessions (user_id, token)
    VALUES
      (1, 'session-1'),
      (1, 'session-2');
  `);
  db.close();

  return dbPath;
}

async function relationalInsertForDeleteSeed(
  dbPath: string,
  rows: Array<Record<string, number | string>>
): Promise<boolean> {
  const result = await relationalInsert.invoke({
    table: 'sessions',
    data: rows,
    vendor: 'sqlite',
    connectionString: dbPath,
  });

  return result.success && result.rowCount === rows.length;
}

describe('Relational DELETE - Tool Invocation', () => {
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

  it.skipIf(!hasSQLiteBindings)('should delete one row with WHERE condition', async () => {
    const result = await relationalDelete.invoke({
      table: 'users',
      where: [{ column: 'email', operator: 'eq', value: 'bob@example.com' }],
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    expect(result.success).toBe(true);
    expect(result.rowCount).toBe(1);
    expect(result.softDeleted).toBe(false);
  });

  it.skipIf(!hasSQLiteBindings)('should prevent full-table delete by default', async () => {
    const result = await relationalDelete.invoke({
      table: 'users',
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/WHERE conditions are required/i);
    expect(result.rowCount).toBe(0);
  });

  it.skipIf(!hasSQLiteBindings)('should allow full-table delete when explicitly enabled', async () => {
    const result = await relationalDelete.invoke({
      table: 'sessions',
      allowFullTableDelete: true,
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    expect(result.success).toBe(true);
    expect(result.rowCount).toBeGreaterThan(0);
  });

  it.skipIf(!hasSQLiteBindings)('should soft-delete rows when configured', async () => {
    const result = await relationalDelete.invoke({
      table: 'users',
      where: [{ column: 'email', operator: 'eq', value: 'carol@example.com' }],
      softDelete: { column: 'deleted_at', value: '2026-02-19T00:00:00.000Z' },
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    expect(result.success).toBe(true);
    expect(result.rowCount).toBe(1);
    expect(result.softDeleted).toBe(true);
  });

  it.skipIf(!hasSQLiteBindings)('should execute batch delete operations with configurable batch size', async () => {
    await relationalDelete.invoke({
      table: 'sessions',
      allowFullTableDelete: true,
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    const seedSessions = await relationalInsertForDeleteSeed(getDbPath(), [
      { user_id: 1, token: 'batch-session-1' },
      { user_id: 1, token: 'batch-session-2' },
    ]);
    expect(seedSessions).toBe(true);

    const result = await relationalDelete.invoke({
      table: 'sessions',
      operations: [
        {
          where: [{ column: 'token', operator: 'eq', value: 'batch-session-1' }],
        },
        {
          where: [{ column: 'token', operator: 'eq', value: 'batch-session-2' }],
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
      expect(result.batch?.failedItems).toBe(0);
      expect(result.batch?.totalItems).toBe(2);
    }
  });

  it.skipIf(!hasSQLiteBindings)('should report partial success for batch deletes when continueOnError is enabled', async () => {
    // Re-seed sessions for Alice so FK enforcement applies
    const seeded = await relationalInsertForDeleteSeed(getDbPath(), [
      { user_id: 1, token: 'fk-guard-session-partial' },
    ]);
    expect(seeded).toBe(true);

    const result = await relationalDelete.invoke({
      table: 'users',
      operations: [
        {
          where: [{ column: 'email', operator: 'eq', value: 'carol@example.com' }],
          softDelete: { column: 'deleted_at', value: '2026-02-20T00:00:00.000Z' },
        },
        {
          where: [{ column: 'email', operator: 'eq', value: 'alice@example.com' }],
          cascade: true,
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

  it.skipIf(!hasSQLiteBindings)('should return clear foreign key message and cascade guidance', async () => {
    // Re-seed sessions for Alice so FK enforcement applies
    const seeded = await relationalInsertForDeleteSeed(getDbPath(), [
      { user_id: 1, token: 'fk-guard-session-cascade' },
    ]);
    expect(seeded).toBe(true);

    const result = await relationalDelete.invoke({
      table: 'users',
      where: [{ column: 'email', operator: 'eq', value: 'alice@example.com' }],
      cascade: true,
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('foreign key constraint violation');
    expect(result.error).toContain('ON DELETE CASCADE');
    expect(result.rowCount).toBe(0);
  });
});
