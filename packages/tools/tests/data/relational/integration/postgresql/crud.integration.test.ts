/**
 * PostgreSQL CRUD Integration Tests
 *
 * Tests real SQL execution against a PostgreSQL testcontainer.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ConnectionManager } from '../../../../../src/data/relational/connection/connection-manager.js';
import { executeQuery } from '../../../../../src/data/relational/query/query-executor.js';
import type { ConnectionConfig } from '../../../../../src/data/relational/connection/types.js';
import {
  startPostgreSQLContainer,
  stopPostgreSQLContainer,
  type PostgreSQLContainerInfo,
} from '../setup/containers.js';
import { setupTestSchema, teardownTestSchema } from '../setup/test-helpers.js';

let pgContainer: PostgreSQLContainerInfo;
let manager: ConnectionManager;

describe('PostgreSQL CRUD Integration', () => {
  beforeAll(async () => {
    pgContainer = await startPostgreSQLContainer();

    const config: ConnectionConfig = {
      vendor: 'postgresql',
      connection: pgContainer.connectionString,
    };
    manager = new ConnectionManager(config);
    await manager.connect();
  }, 120_000);

  afterAll(async () => {
    if (manager?.isConnected()) {
      await manager.disconnect();
    }
    if (pgContainer) {
      await stopPostgreSQLContainer(pgContainer);
    }
  }, 30_000);

  beforeEach(async () => {
    await setupTestSchema(manager, 'postgresql');
  });

  describe('SELECT Operations', () => {
    it('should select all users', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT * FROM users ORDER BY id',
        vendor: 'postgresql',
      });

      expect(result.rows).toHaveLength(3);
      expect(result.rows[0]).toMatchObject({ name: 'Alice', email: 'alice@example.com' });
    });

    it('should select with positional parameters ($1)', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT * FROM users WHERE age > $1',
        params: [28],
        vendor: 'postgresql',
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
        vendor: 'postgresql',
      });

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({ name: 'Bob', age: 25 });
    });

    it('should select with ORDER BY and LIMIT', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT name FROM users ORDER BY age DESC LIMIT $1',
        params: [2],
        vendor: 'postgresql',
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
        vendor: 'postgresql',
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
        sql: 'SELECT * FROM users WHERE age > $1',
        params: [100],
        vendor: 'postgresql',
      });

      expect(result.rows).toHaveLength(0);
    });

    it('should handle type casting', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT $1::int as val',
        params: [42],
        vendor: 'postgresql',
      });

      expect(result.rows).toHaveLength(1);
      expect((result.rows[0] as any).val).toBe(42);
    });
  });

  describe('INSERT Operations', () => {
    it('should insert a single row', async () => {
      await executeQuery(manager, {
        sql: 'INSERT INTO users (name, email, age, active) VALUES ($1, $2, $3, $4)',
        params: ['Dave', 'dave@example.com', 40, true],
        vendor: 'postgresql',
      });

      const verify = await executeQuery(manager, {
        sql: 'SELECT * FROM users WHERE name = $1',
        params: ['Dave'],
        vendor: 'postgresql',
      });

      expect(verify.rows).toHaveLength(1);
      expect(verify.rows[0]).toMatchObject({
        name: 'Dave',
        email: 'dave@example.com',
        age: 40,
      });
    });

    it('should insert with RETURNING', async () => {
      const result = await executeQuery(manager, {
        sql: 'INSERT INTO users (name, email, age) VALUES ($1, $2, $3) RETURNING id, name',
        params: ['Eve', 'eve@example.com', 22],
        vendor: 'postgresql',
      });

      expect(result.rows).toHaveLength(1);
      expect((result.rows[0] as any).name).toBe('Eve');
      expect((result.rows[0] as any).id).toBeDefined();
    });

    it('should reject duplicate unique values', async () => {
      await expect(
        executeQuery(manager, {
          sql: 'INSERT INTO users (name, email, age) VALUES ($1, $2, $3)',
          params: ['Duplicate', 'alice@example.com', 20],
          vendor: 'postgresql',
        }),
      ).rejects.toThrow();
    });
  });

  describe('UPDATE Operations', () => {
    it('should update matching rows', async () => {
      await executeQuery(manager, {
        sql: 'UPDATE users SET age = $1 WHERE name = $2',
        params: [31, 'Alice'],
        vendor: 'postgresql',
      });

      const result = await executeQuery(manager, {
        sql: 'SELECT age FROM users WHERE name = $1',
        params: ['Alice'],
        vendor: 'postgresql',
      });

      expect((result.rows[0] as any).age).toBe(31);
    });

    it('should update multiple rows', async () => {
      await executeQuery(manager, {
        sql: "UPDATE products SET stock = $1 WHERE category = $2",
        params: [0, 'widgets'],
        vendor: 'postgresql',
      });

      const result = await executeQuery(manager, {
        sql: "SELECT stock FROM products WHERE category = $1",
        params: ['widgets'],
        vendor: 'postgresql',
      });

      for (const row of result.rows) {
        expect((row as any).stock).toBe(0);
      }
    });
  });

  describe('DELETE Operations', () => {
    it('should delete matching rows', async () => {
      await executeQuery(manager, {
        sql: 'DELETE FROM orders WHERE user_id = $1',
        params: [2],
        vendor: 'postgresql',
      });

      const result = await executeQuery(manager, {
        sql: 'SELECT * FROM orders WHERE user_id = $1',
        params: [2],
        vendor: 'postgresql',
      });

      expect(result.rows).toHaveLength(0);
    });

    it('should enforce foreign key constraints', async () => {
      await expect(
        executeQuery(manager, {
          sql: 'DELETE FROM users WHERE id = $1',
          params: [1],
          vendor: 'postgresql',
        }),
      ).rejects.toThrow();
    });
  });

  describe('Aggregate Queries', () => {
    it('should execute COUNT', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT COUNT(*)::int as user_count FROM users',
        vendor: 'postgresql',
      });

      expect((result.rows[0] as any).user_count).toBe(3);
    });

    it('should execute SUM', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT SUM(total)::float as order_total FROM orders',
        vendor: 'postgresql',
      });

      const total = Number((result.rows[0] as any).order_total);
      expect(total).toBeCloseTo(129.94, 1);
    });

    it('should execute GROUP BY', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT category, COUNT(*)::int as count FROM products GROUP BY category ORDER BY category',
        vendor: 'postgresql',
      });

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toMatchObject({ category: 'gadgets', count: 1 });
      expect(result.rows[1]).toMatchObject({ category: 'widgets', count: 2 });
    });
  });

  describe('PostgreSQL-Specific Features', () => {
    it('should handle boolean types natively', async () => {
      const result = await executeQuery(manager, {
        sql: 'SELECT name, active FROM users WHERE active = $1 ORDER BY name',
        params: [true],
        vendor: 'postgresql',
      });

      expect(result.rows).toHaveLength(2);
      for (const row of result.rows) {
        expect((row as any).active).toBe(true);
      }
    });

    it('should handle SERIAL auto-increment', async () => {
      const r1 = await executeQuery(manager, {
        sql: "INSERT INTO users (name, email, age) VALUES ($1, $2, $3) RETURNING id",
        params: ['User1', 'u1@test.com', 20],
        vendor: 'postgresql',
      });

      const r2 = await executeQuery(manager, {
        sql: "INSERT INTO users (name, email, age) VALUES ($1, $2, $3) RETURNING id",
        params: ['User2', 'u2@test.com', 21],
        vendor: 'postgresql',
      });

      const id1 = (r1.rows[0] as any).id;
      const id2 = (r2.rows[0] as any).id;
      expect(id2).toBeGreaterThan(id1);
    });
  });
});
