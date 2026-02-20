/**
 * SQLite Schema Introspection Integration Tests
 *
 * Tests real schema introspection against in-memory SQLite.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ConnectionManager } from '../../../../../src/data/relational/connection/connection-manager.js';
import { executeQuery } from '../../../../../src/data/relational/query/query-executor.js';
import type { ConnectionConfig } from '../../../../../src/data/relational/connection/types.js';
import { setupTestSchema } from '../setup/test-helpers.js';

// Lazy-import SchemaInspector to avoid import errors if module structure changes
let SchemaInspector: any;

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

describe.skipIf(!hasSQLiteBindings)('SQLite Schema Introspection Integration', () => {
  let manager: ConnectionManager;

  beforeAll(async () => {
    // Dynamically import SchemaInspector
    const mod = await import('../../../../../src/data/relational/schema/schema-inspector.js');
    SchemaInspector = mod.SchemaInspector;

    const config: ConnectionConfig = {
      vendor: 'sqlite',
      connection: ':memory:',
    };
    manager = new ConnectionManager(config);
    await manager.connect();
    await setupTestSchema(manager, 'sqlite');
  });

  afterAll(async () => {
    if (manager?.isConnected()) {
      await manager.disconnect();
    }
  });

  describe('Table Discovery', () => {
    it('should discover all tables', async () => {
      const inspector = new SchemaInspector(manager, 'sqlite');
      const schema = await inspector.inspect();

      const tableNames = schema.tables.map((t: any) => t.name).sort();
      expect(tableNames).toEqual(['orders', 'products', 'users']);
    });

    it('should filter tables by name', async () => {
      const inspector = new SchemaInspector(manager, 'sqlite');
      const schema = await inspector.inspect({ tables: ['users'] });

      expect(schema.tables).toHaveLength(1);
      expect(schema.tables[0].name).toBe('users');
    });
  });

  describe('Column Discovery', () => {
    it('should discover columns for users table', async () => {
      const inspector = new SchemaInspector(manager, 'sqlite');
      const schema = await inspector.inspect({ tables: ['users'] });

      const users = schema.tables.find((t: any) => t.name === 'users');
      expect(users).toBeDefined();

      const columnNames = users!.columns.map((c: any) => c.name).sort();
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('age');
      expect(columnNames).toContain('active');
      expect(columnNames).toContain('created_at');
    });

    it('should report column types', async () => {
      const inspector = new SchemaInspector(manager, 'sqlite');
      const schema = await inspector.inspect({ tables: ['products'] });

      const products = schema.tables.find((t: any) => t.name === 'products');
      expect(products).toBeDefined();

      const priceCol = products!.columns.find((c: any) => c.name === 'price');
      expect(priceCol).toBeDefined();
      // SQLite reports DECIMAL(10, 2) or similar
      expect(priceCol!.type.toLowerCase()).toContain('decimal');
    });

    it('should report nullable columns', async () => {
      const inspector = new SchemaInspector(manager, 'sqlite');
      const schema = await inspector.inspect({ tables: ['users'] });

      const users = schema.tables.find((t: any) => t.name === 'users');
      const ageCol = users!.columns.find((c: any) => c.name === 'age');
      expect(ageCol).toBeDefined();
      // age is nullable (no NOT NULL constraint)
      expect(ageCol!.isNullable).toBe(true);

      const nameCol = users!.columns.find((c: any) => c.name === 'name');
      expect(nameCol).toBeDefined();
      expect(nameCol!.isNullable).toBe(false);
    });
  });

  describe('Primary Keys', () => {
    it('should detect primary keys', async () => {
      const inspector = new SchemaInspector(manager, 'sqlite');
      const schema = await inspector.inspect({ tables: ['users'] });

      const users = schema.tables.find((t: any) => t.name === 'users');
      expect(users).toBeDefined();
      expect(users!.primaryKey).toContain('id');
    });
  });

  describe('Foreign Keys', () => {
    it('should detect foreign keys in orders table', async () => {
      const inspector = new SchemaInspector(manager, 'sqlite');
      const schema = await inspector.inspect({ tables: ['orders'] });

      const orders = schema.tables.find((t: any) => t.name === 'orders');
      expect(orders).toBeDefined();
      expect(orders!.foreignKeys.length).toBeGreaterThan(0);

      const fkTables = orders!.foreignKeys.map((fk: any) => fk.referencedTable);
      expect(fkTables).toContain('users');
      expect(fkTables).toContain('products');
    });
  });

  describe('Caching', () => {
    it('should cache schema results', async () => {
      const inspector = new SchemaInspector(manager, 'sqlite', {
        cacheTtlMs: 5000,
        cacheKey: 'sqlite-cache-test',
      });

      const schema1 = await inspector.inspect();
      const schema2 = await inspector.inspect();

      // Should return from cache - deep equal
      expect(schema1).toEqual(schema2);

      // Clean up cache
      SchemaInspector.clearCache('sqlite-cache-test');
    });
  });
});
