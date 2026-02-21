/**
 * MySQL CRUD Integration Tests
 *
 * Tests real SQL execution against a MySQL testcontainer.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ConnectionManager } from '../../../../../src/data/relational/connection/connection-manager.js';
import { executeQuery } from '../../../../../src/data/relational/query/query-executor.js';
import type { ConnectionConfig } from '../../../../../src/data/relational/connection/types.js';
import {
  startMySQLContainer,
  stopMySQLContainer,
  type MySQLContainerInfo,
} from '../setup/containers.js';
import { setupTestSchema } from '../setup/test-helpers.js';

let mysqlContainer: MySQLContainerInfo;
let manager: ConnectionManager;

describe('MySQL CRUD Integration', () => {
  beforeAll(async () => {
    mysqlContainer = await startMySQLContainer();

    const config: ConnectionConfig = {
      vendor: 'mysql',
      connection: {
        host: mysqlContainer.host,
        port: mysqlContainer.port,
        database: mysqlContainer.database,
        user: mysqlContainer.user,
        password: mysqlContainer.password,
      },
    };
    manager = new ConnectionManager(config);
    await manager.connect();
  }, 120_000);

  afterAll(async () => {
    if (manager?.isConnected()) {
      await manager.disconnect();
    }
    if (mysqlContainer) {
      await stopMySQLContainer(mysqlContainer);
    }
  }, 30_000);

  beforeEach(async () => {
    await setupTestSchema(manager, 'mysql');
  });

  describe('SELECT Operations', () => {
    it('should select all users', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT * FROM users ORDER BY id',
        vendor: 'mysql',
      });

      expect(result.rows).toHaveLength(3);
      expect(result.rows[0]).toMatchObject({ name: 'Alice', email: 'alice@example.com' });
    });

    it('should select with positional parameters (?)', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT * FROM users WHERE age > ?',
        params: [28],
        vendor: 'mysql',
      });

      expect(result.rows).toHaveLength(2);
      const names = result.rows.map((r: any) => r.name);
      expect(names).toContain('Alice');
      expect(names).toContain('Carol');
    });

    it('should select with named parameters', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT * FROM users WHERE name = :name',
        params: { name: 'Bob' },
        vendor: 'mysql',
      });

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({ name: 'Bob', age: 25 });
    });

    it('should select with ORDER BY and LIMIT', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT name FROM users ORDER BY age DESC LIMIT ?',
        params: [2],
        vendor: 'mysql',
      });

      expect(result.rows).toHaveLength(2);
      expect((result.rows[0] as any).name).toBe('Carol');
    });

    it('should select with JOIN', async () => {
      const result = await executeQuery(manager, {
        sql: `SELECT u.name, p.name as product_name, o.quantity, o.total
              FROM orders o
              JOIN users u ON o.user_id = u.id
              JOIN products p ON o.product_id = p.id
              ORDER BY o.id`,
        vendor: 'mysql',
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
        vendor: 'mysql',
      });

      expect(result.rows).toHaveLength(0);
    });
  });

  describe('INSERT Operations', () => {
    it('should insert a single row', async () => {
      await executeQuery(manager, {
        sql: 'INSERT INTO users (name, email, age, active) VALUES (?, ?, ?, ?)',
        params: ['Dave', 'dave@example.com', 40, 1],
        vendor: 'mysql',
      });

      const verify = await executeQuery(manager, {
        sql: 'SELECT * FROM users WHERE name = ?',
        params: ['Dave'],
        vendor: 'mysql',
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
          vendor: 'mysql',
        }),
      ).rejects.toThrow();
    });

    it('should auto-increment IDs', async () => {
      await executeQuery(manager, {
        sql: 'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
        params: ['User1', 'u1@test.com', 20],
        vendor: 'mysql',
      });

      await executeQuery(manager, {
        sql: 'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
        params: ['User2', 'u2@test.com', 21],
        vendor: 'mysql',
      });

      const result = await executeQuery(manager, {
        sql: "SELECT id FROM users WHERE name IN (?, ?) ORDER BY id",
        params: ['User1', 'User2'],
        vendor: 'mysql',
      });

      expect(result.rows).toHaveLength(2);
      expect((result.rows[1] as any).id).toBeGreaterThan((result.rows[0] as any).id);
    });
  });

  describe('UPDATE Operations', () => {
    it('should update matching rows', async () => {
      await executeQuery(manager, {
        sql: 'UPDATE users SET age = ? WHERE name = ?',
        params: [31, 'Alice'],
        vendor: 'mysql',
      });

      const result = await executeQuery(manager, {
        sql: 'SELECT age FROM users WHERE name = ?',
        params: ['Alice'],
        vendor: 'mysql',
      });

      expect((result.rows[0] as any).age).toBe(31);
    });

    it('should update multiple rows', async () => {
      await executeQuery(manager, {
        sql: "UPDATE products SET stock = ? WHERE category = ?",
        params: [0, 'widgets'],
        vendor: 'mysql',
      });

      const result = await executeQuery(manager, {
        sql: "SELECT stock FROM products WHERE category = ?",
        params: ['widgets'],
        vendor: 'mysql',
      });

      for (const row of result.rows) {
        expect((row as any).stock).toBe(0);
      }
    });
  });

  describe('DELETE Operations', () => {
    it('should delete matching rows', async () => {
      await executeQuery(manager, {
        sql: 'DELETE FROM orders WHERE user_id = ?',
        params: [2],
        vendor: 'mysql',
      });

      const result = await executeQuery(manager, {
        sql: 'SELECT * FROM orders WHERE user_id = ?',
        params: [2],
        vendor: 'mysql',
      });

      expect(result.rows).toHaveLength(0);
    });

    it('should enforce foreign key constraints', async () => {
      await expect(
        executeQuery(manager, {
          sql: 'DELETE FROM users WHERE id = ?',
          params: [1],
          vendor: 'mysql',
        }),
      ).rejects.toThrow();
    });
  });

  describe('Aggregate Queries', () => {
    it('should execute COUNT', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT COUNT(*) as user_count FROM users',
        vendor: 'mysql',
      });

      // MySQL returns COUNT as a number
      expect(Number((result.rows[0] as any).user_count)).toBe(3);
    });

    it('should execute SUM', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT SUM(total) as order_total FROM orders',
        vendor: 'mysql',
      });

      const total = Number((result.rows[0] as any).order_total);
      expect(total).toBeCloseTo(129.94, 1);
    });

    it('should execute GROUP BY', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY category',
        vendor: 'mysql',
      });

      expect(result.rows).toHaveLength(2);
      expect((result.rows[0] as any).category).toBe('gadgets');
      expect(Number((result.rows[0] as any).count)).toBe(1);
    });
  });

  describe('MySQL-Specific Features', () => {
    it('should handle TINYINT(1) as boolean-like', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT name, active FROM users WHERE active = ? ORDER BY name',
        params: [1],
        vendor: 'mysql',
      });

      expect(result.rows).toHaveLength(2);
      for (const row of result.rows) {
        expect(Number((row as any).active)).toBe(1);
      }
    });

    it('should handle AUTO_INCREMENT', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT MAX(id) as max_id FROM users',
        vendor: 'mysql',
      });

      const maxId = Number((result.rows[0] as any).max_id);
      expect(maxId).toBeGreaterThanOrEqual(3);
    });
  });
});
