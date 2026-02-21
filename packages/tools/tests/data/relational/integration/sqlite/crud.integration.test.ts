/**
 * SQLite CRUD Integration Tests
 *
 * Tests real SQL execution (INSERT, SELECT, UPDATE, DELETE) against in-memory SQLite.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ConnectionManager } from '../../../../../src/data/relational/connection/connection-manager.js';
import { executeQuery } from '../../../../../src/data/relational/query/query-executor.js';
import type { ConnectionConfig } from '../../../../../src/data/relational/connection/types.js';
import { setupTestSchema } from '../setup/test-helpers.js';

const hasSQLiteBindings = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3');
    const db = new Database(':memory:');
    db.close();
    return true;
  } catch {
    return false;
  }
})();

describe.skipIf(!hasSQLiteBindings)('SQLite CRUD Integration', () => {
  let manager: ConnectionManager;

  beforeAll(async () => {
    const config: ConnectionConfig = {
      vendor: 'sqlite',
      connection: ':memory:',
    };
    manager = new ConnectionManager(config);
    await manager.connect();
  });

  afterAll(async () => {
    if (manager?.isConnected()) {
      await manager.disconnect();
    }
  });

  // Re-seed before each test for isolation
  beforeEach(async () => {
    await setupTestSchema(manager, 'sqlite');
  });

  describe('SELECT Operations', () => {
    it('should select all users', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT * FROM users ORDER BY id',
        vendor: 'sqlite',
      });

      expect(result.rows).toHaveLength(3);
      expect(result.rows[0]).toMatchObject({ name: 'Alice', email: 'alice@example.com' });
      expect(result.rows[1]).toMatchObject({ name: 'Bob' });
      expect(result.rows[2]).toMatchObject({ name: 'Carol' });
    });

    it('should select with WHERE clause using positional params', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT * FROM users WHERE age > ?',
        params: [28],
        vendor: 'sqlite',
      });

      expect(result.rows).toHaveLength(2);
      const names = result.rows.map((r: any) => r.name);
      expect(names).toContain('Alice');
      expect(names).toContain('Carol');
    });

    it('should select with ORDER BY and LIMIT', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT name FROM users ORDER BY age DESC LIMIT ?',
        params: [2],
        vendor: 'sqlite',
      });

      expect(result.rows).toHaveLength(2);
      expect((result.rows[0] as any).name).toBe('Carol');
      expect((result.rows[1] as any).name).toBe('Alice');
    });

    it('should select with JOIN', async () => {
      const result = await executeQuery(manager, {
        sql: `SELECT u.name, p.name as product_name, o.quantity, o.total 
              FROM orders o 
              JOIN users u ON o.user_id = u.id 
              JOIN products p ON o.product_id = p.id 
              ORDER BY o.id`,
        vendor: 'sqlite',
      });

      expect(result.rows).toHaveLength(3);
      expect(result.rows[0]).toMatchObject({
        name: 'Alice',
        product_name: 'Widget A',
        quantity: 2,
      });
    });

    it('should return empty result for no matches', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT * FROM users WHERE age > ?',
        params: [100],
        vendor: 'sqlite',
      });

      expect(result.rows).toHaveLength(0);
    });
  });

  describe('INSERT Operations', () => {
    it('should insert a single row', async () => {
      await executeQuery(manager, {
        sql: 'INSERT INTO users (name, email, age, active) VALUES (?, ?, ?, ?)',
        params: ['Dave', 'dave@example.com', 40, 1],
        vendor: 'sqlite',
      });

      // Verify the insert
      const verify = await executeQuery(manager, {
        sql: 'SELECT * FROM users WHERE name = ?',
        params: ['Dave'],
        vendor: 'sqlite',
      });

      expect(verify.rows).toHaveLength(1);
      expect(verify.rows[0]).toMatchObject({
        name: 'Dave',
        email: 'dave@example.com',
        age: 40,
      });
    });

    it('should reject duplicate unique values', async () => {
      await expect(
        executeQuery(manager, {
          sql: 'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
          params: ['Duplicate', 'alice@example.com', 20],
          vendor: 'sqlite',
        }),
      ).rejects.toThrow();
    });

    it('should insert multiple rows sequentially', async () => {
      for (let i = 0; i < 5; i++) {
        await executeQuery(manager, {
          sql: 'INSERT INTO products (name, price, category, stock) VALUES (?, ?, ?, ?)',
          params: [`Product ${i}`, 10 + i, 'batch', 10],
          vendor: 'sqlite',
        });
      }

      const result = await executeQuery(manager, {
        sql: 'SELECT COUNT(*) as count FROM products',
        vendor: 'sqlite',
      });

      // 3 seed + 5 new = 8
      expect((result.rows[0] as any).count).toBe(8);
    });
  });

  describe('UPDATE Operations', () => {
    it('should update matching rows', async () => {
      await executeQuery(manager, {
        sql: 'UPDATE users SET age = ? WHERE name = ?',
        params: [31, 'Alice'],
        vendor: 'sqlite',
      });

      const result = await executeQuery(manager, {
        sql: 'SELECT age FROM users WHERE name = ?',
        params: ['Alice'],
        vendor: 'sqlite',
      });

      expect((result.rows[0] as any).age).toBe(31);
    });

    it('should update multiple rows', async () => {
      await executeQuery(manager, {
        sql: 'UPDATE products SET stock = ? WHERE category = ?',
        params: [0, 'widgets'],
        vendor: 'sqlite',
      });

      const result = await executeQuery(manager, {
        sql: 'SELECT stock FROM products WHERE category = ?',
        params: ['widgets'],
        vendor: 'sqlite',
      });

      for (const row of result.rows) {
        expect((row as any).stock).toBe(0);
      }
    });

    it('should not affect rows that do not match', async () => {
      await executeQuery(manager, {
        sql: 'UPDATE users SET age = ? WHERE name = ?',
        params: [99, 'NonExistent'],
        vendor: 'sqlite',
      });

      const result = await executeQuery(manager, {
        sql: 'SELECT * FROM users WHERE age = ?',
        params: [99],
        vendor: 'sqlite',
      });

      expect(result.rows).toHaveLength(0);
    });
  });

  describe('DELETE Operations', () => {
    it('should delete matching rows', async () => {
      await executeQuery(manager, {
        sql: 'DELETE FROM orders WHERE user_id = ?',
        params: [2],
        vendor: 'sqlite',
      });

      const result = await executeQuery(manager, {
        sql: 'SELECT * FROM orders WHERE user_id = ?',
        params: [2],
        vendor: 'sqlite',
      });

      expect(result.rows).toHaveLength(0);
    });

    it('should delete with complex WHERE', async () => {
      await executeQuery(manager, {
        sql: "DELETE FROM orders WHERE status = ? AND quantity > ?",
        params: ['pending', 0],
        vendor: 'sqlite',
      });

      const result = await executeQuery(manager, {
        sql: "SELECT * FROM orders WHERE status = ?",
        params: ['pending'],
        vendor: 'sqlite',
      });

      expect(result.rows).toHaveLength(0);
    });

    it('should respect foreign key constraints when PRAGMA is on', async () => {
      // Enable FK enforcement for this test
      await executeQuery(manager, {
        sql: 'PRAGMA foreign_keys = ON',
        vendor: 'sqlite',
      });

      // Trying to delete a user who has orders should fail
      await expect(
        executeQuery(manager, {
          sql: 'DELETE FROM users WHERE id = ?',
          params: [1],
          vendor: 'sqlite',
        }),
      ).rejects.toThrow();

      // Disable again so other tests aren't affected
      await executeQuery(manager, {
        sql: 'PRAGMA foreign_keys = OFF',
        vendor: 'sqlite',
      });
    });
  });

  describe('Aggregate Queries', () => {
    it('should execute COUNT', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT COUNT(*) as user_count FROM users',
        vendor: 'sqlite',
      });

      expect((result.rows[0] as any).user_count).toBe(3);
    });

    it('should execute SUM', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT SUM(total) as order_total FROM orders',
        vendor: 'sqlite',
      });

      // 19.98 + 49.99 + 59.97 = 129.94
      const total = Number((result.rows[0] as any).order_total);
      expect(total).toBeCloseTo(129.94, 1);
    });

    it('should execute GROUP BY', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY category',
        vendor: 'sqlite',
      });

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toMatchObject({ category: 'gadgets', count: 1 });
      expect(result.rows[1]).toMatchObject({ category: 'widgets', count: 2 });
    });
  });
});
