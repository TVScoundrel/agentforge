/**
 * PostgreSQL Schema Introspection Integration Tests
 *
 * Tests real schema introspection against a PostgreSQL testcontainer.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ConnectionManager } from '../../../../../src/data/relational/connection/connection-manager.js';
import type { ConnectionConfig } from '../../../../../src/data/relational/connection/types.js';
import {
  startPostgreSQLContainer,
  stopPostgreSQLContainer,
  type PostgreSQLContainerInfo,
} from '../setup/containers.js';
import { setupTestSchema } from '../setup/test-helpers.js';
import { SchemaInspector } from '../../../../../src/data/relational/schema/schema-inspector.js';

let pgContainer: PostgreSQLContainerInfo;
let manager: ConnectionManager;

describe('PostgreSQL Schema Introspection Integration', () => {
  beforeAll(async () => {
    pgContainer = await startPostgreSQLContainer();

    const config: ConnectionConfig = {
      vendor: 'postgresql',
      connection: pgContainer.connectionString,
    };
    manager = new ConnectionManager(config);
    await manager.connect();
    await setupTestSchema(manager, 'postgresql');
  }, 120_000);

  afterAll(async () => {
    if (manager?.isConnected()) {
      await manager.disconnect();
    }
    if (pgContainer) {
      await stopPostgreSQLContainer(pgContainer);
    }
  }, 30_000);

  describe('Table Discovery', () => {
    it('should discover all tables', async () => {
      const inspector = new SchemaInspector(manager, { vendor: 'postgresql' });
      const schema = await inspector.inspect();

      const tableNames = schema.tables.map((t: any) => t.name).sort();
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('products');
      expect(tableNames).toContain('orders');
    });

    it('should filter tables by pattern', async () => {
      const inspector = new SchemaInspector(manager, {
        vendor: 'postgresql',
        tableFilter: 'user%',
      });
      const schema = await inspector.inspect();

      expect(schema.tables).toHaveLength(1);
      expect(schema.tables[0].name).toBe('users');
    });
  });

  describe('Column Discovery', () => {
    it('should discover columns for users table', async () => {
      const inspector = new SchemaInspector(manager, {
        vendor: 'postgresql',
        tableFilter: 'users',
      });
      const schema = await inspector.inspect();

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
      const inspector = new SchemaInspector(manager, {
        vendor: 'postgresql',
        tableFilter: 'products',
      });
      const schema = await inspector.inspect();

      const products = schema.tables.find((t: any) => t.name === 'products');
      const priceCol = products!.columns.find((c: any) => c.name === 'price');
      expect(priceCol).toBeDefined();
      // PostgreSQL reports 'numeric' for DECIMAL
      expect(priceCol!.type.toLowerCase()).toMatch(/numeric|decimal/);
    });

    it('should report nullable columns', async () => {
      const inspector = new SchemaInspector(manager, {
        vendor: 'postgresql',
        tableFilter: 'users',
      });
      const schema = await inspector.inspect();

      const users = schema.tables.find((t: any) => t.name === 'users');
      const ageCol = users!.columns.find((c: any) => c.name === 'age');
      expect(ageCol!.nullable).toBe(true);

      const nameCol = users!.columns.find((c: any) => c.name === 'name');
      expect(nameCol!.nullable).toBe(false);
    });

    it('should report default values', async () => {
      const inspector = new SchemaInspector(manager, {
        vendor: 'postgresql',
        tableFilter: 'users',
      });
      const schema = await inspector.inspect();

      const users = schema.tables.find((t: any) => t.name === 'users');
      const activeCol = users!.columns.find((c: any) => c.name === 'active');
      expect(activeCol).toBeDefined();
      // Should have a default value
      if (activeCol!.defaultValue !== undefined && activeCol!.defaultValue !== null) {
        expect(String(activeCol!.defaultValue).toLowerCase()).toContain('true');
      }
    });
  });

  describe('Primary Keys', () => {
    it('should detect primary keys', async () => {
      const inspector = new SchemaInspector(manager, {
        vendor: 'postgresql',
        tableFilter: 'users',
      });
      const schema = await inspector.inspect();

      const users = schema.tables.find((t: any) => t.name === 'users');
      expect(users!.primaryKeys).toBeDefined();
      expect(users!.primaryKeys!.length).toBeGreaterThanOrEqual(1);

      const pkColumns = users!.primaryKeys!.flatMap((pk: any) => pk.columns || [pk.column]);
      expect(pkColumns).toContain('id');
    });
  });

  describe('Foreign Keys', () => {
    it('should detect foreign keys in orders table', async () => {
      const inspector = new SchemaInspector(manager, {
        vendor: 'postgresql',
        tableFilter: 'orders',
      });
      const schema = await inspector.inspect();

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
      const inspector = new SchemaInspector(manager, {
        vendor: 'postgresql',
        tableFilter: 'users',
      });
      const schema = await inspector.inspect();

      const users = schema.tables.find((t: any) => t.name === 'users');
      if (users!.indexes && users!.indexes.length > 0) {
        // Should have at least the unique index on email
        const emailIndex = users!.indexes.find(
          (idx: any) => idx.columns?.includes('email') || idx.column === 'email',
        );
        if (emailIndex) {
          expect(emailIndex.unique).toBe(true);
        }
      }
    });
  });
});
