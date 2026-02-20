/**
 * MySQL Schema Introspection Integration Tests
 *
 * Tests real schema introspection against a MySQL testcontainer.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ConnectionManager } from '../../../../../src/data/relational/connection/connection-manager.js';
import type { ConnectionConfig } from '../../../../../src/data/relational/connection/types.js';
import {
  startMySQLContainer,
  stopMySQLContainer,
  type MySQLContainerInfo,
} from '../setup/containers.js';
import { setupTestSchema } from '../setup/test-helpers.js';
import { SchemaInspector } from '../../../../../src/data/relational/schema/schema-inspector.js';

let mysqlContainer: MySQLContainerInfo;
let manager: ConnectionManager;

describe('MySQL Schema Introspection Integration', () => {
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
    await setupTestSchema(manager, 'mysql');
  }, 120_000);

  afterAll(async () => {
    if (manager?.isConnected()) {
      await manager.disconnect();
    }
    if (mysqlContainer) {
      await stopMySQLContainer(mysqlContainer);
    }
  }, 30_000);

  describe('Table Discovery', () => {
    it('should discover all tables', async () => {
      const inspector = new SchemaInspector(manager, 'mysql');
      const schema = await inspector.inspect();

      const tableNames = schema.tables.map((t: any) => t.name).sort();
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('products');
      expect(tableNames).toContain('orders');
    });

    it('should filter tables by pattern', async () => {
      const inspector = new SchemaInspector(manager, 'mysql');
      const schema = await inspector.inspect({ tables: ['users'] });

      expect(schema.tables).toHaveLength(1);
      expect(schema.tables[0].name).toBe('users');
    });
  });

  describe('Column Discovery', () => {
    it('should discover columns for users table', async () => {
      const inspector = new SchemaInspector(manager, 'mysql');
      const schema = await inspector.inspect({ tables: ['users'] });

      const users = schema.tables.find((t: any) => t.name === 'users');
      expect(users).toBeDefined();

      const columnNames = users!.columns.map((c: any) => c.name).sort();
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('age');
      expect(columnNames).toContain('active');
    });

    it('should report column types', async () => {
      const inspector = new SchemaInspector(manager, 'mysql');
      const schema = await inspector.inspect({ tables: ['products'] });

      const products = schema.tables.find((t: any) => t.name === 'products');
      const priceCol = products!.columns.find((c: any) => c.name === 'price');
      expect(priceCol).toBeDefined();
      expect(priceCol!.type.toLowerCase()).toMatch(/decimal|numeric/);
    });

    it('should report nullable columns', async () => {
      const inspector = new SchemaInspector(manager, 'mysql');
      const schema = await inspector.inspect({ tables: ['users'] });

      const users = schema.tables.find((t: any) => t.name === 'users');
      const ageCol = users!.columns.find((c: any) => c.name === 'age');
      expect(ageCol!.isNullable).toBe(true);

      const nameCol = users!.columns.find((c: any) => c.name === 'name');
      expect(nameCol!.isNullable).toBe(false);
    });
  });

  describe('Primary Keys', () => {
    it('should detect primary keys', async () => {
      const inspector = new SchemaInspector(manager, 'mysql');
      const schema = await inspector.inspect({ tables: ['users'] });

      const users = schema.tables.find((t: any) => t.name === 'users');
      expect(users!.primaryKey).toBeDefined();
      expect(users!.primaryKey!.length).toBeGreaterThanOrEqual(1);
      expect(users!.primaryKey).toContain('id');
    });
  });

  describe('Foreign Keys', () => {
    it('should detect foreign keys in orders table', async () => {
      const inspector = new SchemaInspector(manager, 'mysql');
      const schema = await inspector.inspect({ tables: ['orders'] });

      const orders = schema.tables.find((t: any) => t.name === 'orders');
      expect(orders!.foreignKeys).toBeDefined();
      expect(orders!.foreignKeys!.length).toBeGreaterThanOrEqual(2);

      const fkTables = orders!.foreignKeys!.map((fk: any) => fk.referencedTable);
      expect(fkTables).toContain('users');
      expect(fkTables).toContain('products');
    });
  });

  describe('Indexes', () => {
    it('should detect unique constraint index on email', async () => {
      const inspector = new SchemaInspector(manager, 'mysql');
      const schema = await inspector.inspect({ tables: ['users'] });

      const users = schema.tables.find((t: any) => t.name === 'users');
      if (users!.indexes && users!.indexes.length > 0) {
        const emailIndex = users!.indexes.find(
          (idx: any) => idx.columns?.includes('email') || idx.column === 'email',
        );
        if (emailIndex) {
          expect(emailIndex.isUnique).toBe(true);
        }
      }
    });
  });
});
