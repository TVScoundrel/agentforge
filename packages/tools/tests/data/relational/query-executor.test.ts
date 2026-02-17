/**
 * Query Executor Tests
 *
 * Unit tests for the executeQuery function and parameter binding.
 * Tests query execution with different parameter types and error handling.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ConnectionManager } from '../../../src/data/relational/connection/connection-manager.js';
import { executeQuery } from '../../../src/data/relational/query/query-executor.js';
import type { ConnectionConfig } from '../../../src/data/relational/connection/types.js';

/**
 * Check if better-sqlite3 native bindings are available
 * This is used to conditionally skip tests that require SQLite
 */
const hasSQLiteBindings = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3');
    // Try to actually instantiate it with an in-memory database
    const db = new Database(':memory:');
    db.close();
    return true;
  } catch {
    return false;
  }
})();

describe('Query Executor', () => {
  describe('SQLite Query Execution', () => {
    let manager: ConnectionManager;

    beforeAll(async () => {
      if (!hasSQLiteBindings) return;

      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      manager = new ConnectionManager(config);
      await manager.initialize();

      // Create test table
      await manager['db'].run('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)');
    });

    afterAll(async () => {
      if (!hasSQLiteBindings) return;
      await manager.close();
    });

    it.skipIf(!hasSQLiteBindings)('should execute SELECT query without parameters', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT 1 as value',
        vendor: 'sqlite'
      });

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ value: 1 });
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it.skipIf(!hasSQLiteBindings)('should execute INSERT with positional parameters', async () => {
      const result = await executeQuery(manager, {
        sql: 'INSERT INTO users (name, email) VALUES (?, ?)',
        params: ['John Doe', 'john@example.com'],
        vendor: 'sqlite'
      });

      expect(result.rowCount).toBeGreaterThan(0);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it.skipIf(!hasSQLiteBindings)('should execute SELECT with positional parameters', async () => {
      // First insert a record
      await executeQuery(manager, {
        sql: 'INSERT INTO users (name, email) VALUES (?, ?)',
        params: ['Jane Doe', 'jane@example.com'],
        vendor: 'sqlite'
      });

      // Then query it
      const result = await executeQuery(manager, {
        sql: 'SELECT * FROM users WHERE name = ?',
        params: ['Jane Doe'],
        vendor: 'sqlite'
      });

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        name: 'Jane Doe',
        email: 'jane@example.com'
      });
    });

    it.skipIf(!hasSQLiteBindings)('should execute UPDATE with positional parameters', async () => {
      // Insert a record
      await executeQuery(manager, {
        sql: 'INSERT INTO users (name, email) VALUES (?, ?)',
        params: ['Bob Smith', 'bob@example.com'],
        vendor: 'sqlite'
      });

      // Update it
      const result = await executeQuery(manager, {
        sql: 'UPDATE users SET email = ? WHERE name = ?',
        params: ['bob.smith@example.com', 'Bob Smith'],
        vendor: 'sqlite'
      });

      expect(result.rowCount).toBeGreaterThan(0);
    });

    it.skipIf(!hasSQLiteBindings)('should execute DELETE with positional parameters', async () => {
      // Insert a record
      await executeQuery(manager, {
        sql: 'INSERT INTO users (name, email) VALUES (?, ?)',
        params: ['Alice Johnson', 'alice@example.com'],
        vendor: 'sqlite'
      });

      // Delete it
      const result = await executeQuery(manager, {
        sql: 'DELETE FROM users WHERE name = ?',
        params: ['Alice Johnson'],
        vendor: 'sqlite'
      });

      expect(result.rowCount).toBeGreaterThan(0);
    });

    it.skipIf(!hasSQLiteBindings)('should handle query errors gracefully', async () => {
      await expect(executeQuery(manager, {
        sql: 'SELECT * FROM nonexistent_table',
        vendor: 'sqlite'
      })).rejects.toThrow(/Query execution failed/);
    });

    it.skipIf(!hasSQLiteBindings)('should sanitize error messages', async () => {
      try {
        await executeQuery(manager, {
          sql: 'INVALID SQL SYNTAX',
          vendor: 'sqlite'
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Query execution failed');
      }
    });
  });
});

