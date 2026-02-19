/**
 * Relational Get Schema Tool Tests
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { relationalGetSchema } from '../../../src/data/relational/tools/relational-get-schema.js';
import { hasSQLiteBindings } from './relational-select/test-utils.js';

async function createTestDatabase(): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const fs = await import('fs');
  const os = await import('os');
  const path = await import('path');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'relational-schema-test-'));
  const dbPath = path.join(tmpDir, 'test.db');

  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT
    );

    CREATE TABLE posts (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX idx_posts_user_id ON posts(user_id);
  `);
  db.close();

  return dbPath;
}

describe('Relational Get Schema Tool', () => {
  let dbPath: string | undefined;

  const getDbPath = (): string => {
    if (!dbPath) {
      throw new Error('SQLite test database path not initialized');
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
        // Ignore cleanup failures in test teardown.
      }
    }
  });

  it('should expose schema validation for required fields', () => {
    const valid = relationalGetSchema.schema.safeParse({
      vendor: 'sqlite',
      connectionString: ':memory:',
    });
    expect(valid.success).toBe(true);

    const invalid = relationalGetSchema.schema.safeParse({
      vendor: 'sqlite',
      connectionString: '',
    });
    expect(invalid.success).toBe(false);
  });

  it.skipIf(!hasSQLiteBindings)('should introspect tables, columns, keys, and indexes', async () => {
    const result = await relationalGetSchema.invoke({
      vendor: 'sqlite',
      connectionString: getDbPath(),
      cacheTtlMs: 10_000,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.schema.tables).toHaveLength(2);
    expect(result.summary.tableCount).toBe(2);

    const users = result.schema.tables.find((table: { name: string }) => table.name === 'users');
    const posts = result.schema.tables.find((table: { name: string }) => table.name === 'posts');
    expect(users).toBeDefined();
    expect(posts).toBeDefined();

    expect(users?.columns.some((column: { name: string }) => column.name === 'email')).toBe(true);
    expect(posts?.foreignKeys).toHaveLength(1);
    expect(posts?.indexes.some((index: { name: string }) => index.name === 'idx_posts_user_id')).toBe(true);
  });

  it.skipIf(!hasSQLiteBindings)('should support table filtering', async () => {
    const result = await relationalGetSchema.invoke({
      vendor: 'sqlite',
      connectionString: getDbPath(),
      tables: ['posts'],
      refreshCache: true,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.schema.tables).toHaveLength(1);
    expect(result.schema.tables[0].name).toBe('posts');
  });
});
