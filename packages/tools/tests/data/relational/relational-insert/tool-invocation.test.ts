/**
 * Tool Invocation Tests for Relational INSERT Tool
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { relationalInsert } from '../../../../src/data/relational/tools/relational-insert/index.js';
import { hasSQLiteBindings } from './test-utils.js';

async function createTestDatabase(): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const path = await import('path');
  const os = await import('os');
  const fs = await import('fs');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'relational-insert-test-'));
  const dbPath = path.join(tmpDir, 'test.db');

  const db = new Database(dbPath);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    );
    INSERT INTO accounts (name) VALUES ('Acme');
  `);
  db.close();

  return dbPath;
}

describe('Relational INSERT - Tool Invocation', () => {
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

  it.skipIf(!hasSQLiteBindings)('should insert a single row and return generated ID', async () => {
    const result = await relationalInsert.invoke({
      table: 'users',
      data: {
        account_id: 1,
        name: 'Alice',
        email: 'alice@example.com',
      },
      returning: { mode: 'id', idColumn: 'id' },
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    expect(result.success).toBe(true);
    expect(result.rowCount).toBe(1);
    expect(result.insertedIds).toHaveLength(1);
    expect(typeof result.insertedIds[0]).toBe('number');
  });

  it.skipIf(!hasSQLiteBindings)('should insert multiple rows in batch mode', async () => {
    const result = await relationalInsert.invoke({
      table: 'users',
      data: [
        { account_id: 1, name: 'Bob', email: 'bob@example.com' },
        { account_id: 1, name: 'Carol', email: 'carol@example.com', status: 'inactive' },
      ],
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    expect(result.success).toBe(true);
    expect(result.rowCount).toBe(2);
    expect(result.rows).toEqual([]);
    expect(result.insertedIds).toEqual([]);
  });

  it.skipIf(!hasSQLiteBindings)('should return full inserted rows when returning.mode is row', async () => {
    const result = await relationalInsert.invoke({
      table: 'users',
      data: { account_id: 1, name: 'Dave', email: 'dave@example.com' },
      returning: { mode: 'row' },
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    expect(result.success).toBe(true);
    expect(result.rowCount).toBe(1);
    expect(result.rows).toHaveLength(1);
    const row = result.rows[0] as Record<string, unknown>;
    expect(row).toMatchObject({
      name: 'Dave',
      email: 'dave@example.com',
      status: 'active',
    });
  });

  it.skipIf(!hasSQLiteBindings)('should return clear error for unique constraint violations', async () => {
    await relationalInsert.invoke({
      table: 'users',
      data: { account_id: 1, name: 'Erin', email: 'erin@example.com' },
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    const result = await relationalInsert.invoke({
      table: 'users',
      data: { account_id: 1, name: 'Erin Duplicate', email: 'erin@example.com' },
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Insert failed: unique constraint violation.');
    expect(result.rowCount).toBe(0);
  });

  it.skipIf(!hasSQLiteBindings)('should return clear error for foreign key constraint violations', async () => {
    const result = await relationalInsert.invoke({
      table: 'users',
      data: { account_id: 9999, name: 'Ghost', email: 'ghost@example.com' },
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Insert failed: foreign key constraint violation.');
    expect(result.rowCount).toBe(0);
  });

  it.skipIf(!hasSQLiteBindings)('should support default values and auto-increment fields', async () => {
    const result = await relationalInsert.invoke({
      table: 'users',
      data: {
        account_id: 1,
        name: 'Frank',
        email: 'frank@example.com',
      },
      returning: { mode: 'row' },
      vendor: 'sqlite',
      connectionString: getDbPath(),
    });

    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(1);

    const insertedRow = result.rows[0] as Record<string, unknown>;
    expect(insertedRow.status).toBe('active');
    expect(typeof insertedRow.id).toBe('number');
  });
});
