import { describe, expect, it } from 'vitest';
import { ConnectionManager } from '../../../../src/data/relational/connection/connection-manager.js';
import type { ConnectionConfig } from '../../../../src/data/relational/connection/types.js';

describe('ConnectionManager configuration', () => {
  describe('constructor', () => {
    it('creates instance with valid PostgreSQL config', () => {
      const config: ConnectionConfig = {
        vendor: 'postgresql',
        connection: 'postgresql://localhost:5432/test',
      };

      expect(() => new ConnectionManager(config)).not.toThrow();
    });

    it('creates instance with valid MySQL config', () => {
      const config: ConnectionConfig = {
        vendor: 'mysql',
        connection: 'mysql://localhost:3306/test',
      };

      expect(() => new ConnectionManager(config)).not.toThrow();
    });

    it('creates instance with valid SQLite config', () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      expect(() => new ConnectionManager(config)).not.toThrow();
    });

    it('creates instance with PostgreSQL config object', () => {
      const config: ConnectionConfig = {
        vendor: 'postgresql',
        connection: {
          host: 'localhost',
          port: 5432,
          database: 'test',
          user: 'testuser',
          password: 'testpass',
        },
      };

      expect(() => new ConnectionManager(config)).not.toThrow();
    });

    it('creates instance with MySQL config object', () => {
      const config: ConnectionConfig = {
        vendor: 'mysql',
        connection: {
          host: 'localhost',
          port: 3306,
          database: 'test',
          user: 'testuser',
          password: 'testpass',
        },
      };

      expect(() => new ConnectionManager(config)).not.toThrow();
    });

    it('creates instance with SQLite config object', () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: {
          url: ':memory:',
        },
      };

      expect(() => new ConnectionManager(config)).not.toThrow();
    });
  });

  describe('vendor detection', () => {
    it('detects PostgreSQL vendor', () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      expect(manager.getVendor()).toBe('postgresql');
    });

    it('detects MySQL vendor', () => {
      const manager = new ConnectionManager({
        vendor: 'mysql',
        connection: 'mysql://localhost/test',
      });

      expect(manager.getVendor()).toBe('mysql');
    });

    it('detects SQLite vendor', () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: ':memory:',
      });

      expect(manager.getVendor()).toBe('sqlite');
    });
  });

  describe('connection input forms', () => {
    it('accepts connection string for PostgreSQL', () => {
      expect(
        () =>
          new ConnectionManager({
            vendor: 'postgresql',
            connection: 'postgresql://user:pass@localhost:5432/db',
          })
      ).not.toThrow();
    });

    it('accepts connection string for MySQL', () => {
      expect(
        () =>
          new ConnectionManager({
            vendor: 'mysql',
            connection: 'mysql://user:pass@localhost:3306/db',
          })
      ).not.toThrow();
    });

    it('accepts file path for SQLite', () => {
      expect(
        () =>
          new ConnectionManager({
            vendor: 'sqlite',
            connection: './test.db',
          })
      ).not.toThrow();
    });

    it('accepts in-memory database for SQLite', () => {
      expect(
        () =>
          new ConnectionManager({
            vendor: 'sqlite',
            connection: ':memory:',
          })
      ).not.toThrow();
    });
  });

  describe('pool validation', () => {
    it('rejects max connections less than 1', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: {
          host: 'localhost',
          port: 5432,
          database: 'test',
          user: 'testuser',
          password: 'testpass',
          pool: {
            max: 0,
          },
        },
      });

      await expect(manager.connect()).rejects.toThrow('Pool max connections must be >= 1');
    });

    it('rejects negative acquire timeout', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: {
          host: 'localhost',
          port: 5432,
          database: 'test',
          user: 'testuser',
          password: 'testpass',
          pool: {
            acquireTimeoutMillis: -1000,
          },
        },
      });

      await expect(manager.connect()).rejects.toThrow('Pool acquire timeout must be >= 0');
    });

    it('rejects negative idle timeout', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: {
          host: 'localhost',
          port: 5432,
          database: 'test',
          user: 'testuser',
          password: 'testpass',
          pool: {
            idleTimeoutMillis: -5000,
          },
        },
      });

      await expect(manager.connect()).rejects.toThrow('Pool idle timeout must be >= 0');
    });
  });
});
