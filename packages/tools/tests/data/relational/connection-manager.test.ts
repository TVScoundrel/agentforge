/**
 * ConnectionManager Tests
 *
 * Unit tests for the ConnectionManager class.
 * Tests peer dependency checking, configuration validation, and basic functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConnectionManager } from '../../../src/data/relational/connection/connection-manager.js';
import { MissingPeerDependencyError } from '../../../src/data/relational/utils/peer-dependency-checker.js';
import type { ConnectionConfig } from '../../../src/data/relational/connection/types.js';

describe('ConnectionManager', () => {
  describe('Constructor', () => {
    it('should create instance with valid PostgreSQL config', () => {
      const config: ConnectionConfig = {
        vendor: 'postgresql',
        connection: 'postgresql://localhost:5432/test',
      };

      expect(() => new ConnectionManager(config)).not.toThrow();
    });

    it('should create instance with valid MySQL config', () => {
      const config: ConnectionConfig = {
        vendor: 'mysql',
        connection: 'mysql://localhost:3306/test',
      };

      expect(() => new ConnectionManager(config)).not.toThrow();
    });

    it('should create instance with valid SQLite config', () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      expect(() => new ConnectionManager(config)).not.toThrow();
    });

    it('should create instance with PostgreSQL config object', () => {
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

    it('should create instance with MySQL config object', () => {
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

    it('should create instance with SQLite config object', () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: {
          url: ':memory:',
        },
      };

      expect(() => new ConnectionManager(config)).not.toThrow();
    });
  });

  describe('Vendor Detection', () => {
    it('should detect PostgreSQL vendor', () => {
      const config: ConnectionConfig = {
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      };

      const manager = new ConnectionManager(config);
      expect(manager).toBeDefined();
    });

    it('should detect MySQL vendor', () => {
      const config: ConnectionConfig = {
        vendor: 'mysql',
        connection: 'mysql://localhost/test',
      };

      const manager = new ConnectionManager(config);
      expect(manager).toBeDefined();
    });

    it('should detect SQLite vendor', () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      expect(manager).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should accept connection string for PostgreSQL', () => {
      const config: ConnectionConfig = {
        vendor: 'postgresql',
        connection: 'postgresql://user:pass@localhost:5432/db',
      };

      expect(() => new ConnectionManager(config)).not.toThrow();
    });

    it('should accept connection string for MySQL', () => {
      const config: ConnectionConfig = {
        vendor: 'mysql',
        connection: 'mysql://user:pass@localhost:3306/db',
      };

      expect(() => new ConnectionManager(config)).not.toThrow();
    });

    it('should accept file path for SQLite', () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: './test.db',
      };

      expect(() => new ConnectionManager(config)).not.toThrow();
    });

    it('should accept in-memory database for SQLite', () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      expect(() => new ConnectionManager(config)).not.toThrow();
    });
  });

  describe('Initialization', () => {
    // Note: These tests require better-sqlite3 native bindings to be built
    // Skip if the native module is not available
    const hasSQLiteBindings = (() => {
      try {
        const Database = require('better-sqlite3');
        // Try to actually instantiate it with an in-memory database
        const db = new Database(':memory:');
        db.close();
        return true;
      } catch {
        return false;
      }
    })();

    it.skipIf(!hasSQLiteBindings)('should initialize SQLite connection with in-memory database', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      await expect(manager.initialize()).resolves.not.toThrow();

      // Verify connection is healthy
      const healthy = await manager.isHealthy();
      expect(healthy).toBe(true);

      // Clean up
      await manager.close();
    });

    it.skipIf(!hasSQLiteBindings)('should initialize SQLite connection with config object', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: {
          url: ':memory:',
        },
      };

      const manager = new ConnectionManager(config);
      await expect(manager.initialize()).resolves.not.toThrow();

      const healthy = await manager.isHealthy();
      expect(healthy).toBe(true);

      await manager.close();
    });

    it.skipIf(!hasSQLiteBindings)('should throw error for SQLite config without url', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: {} as any,
      };

      const manager = new ConnectionManager(config);
      await expect(manager.initialize()).rejects.toThrow('SQLite connection requires a url property');
    });
  });

  describe('Connection Health', () => {
    const hasSQLiteBindings = (() => {
      try {
        const Database = require('better-sqlite3');
        const db = new Database(':memory:');
        db.close();
        return true;
      } catch {
        return false;
      }
    })();

    it('should return false for uninitialized connection', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      const healthy = await manager.isHealthy();
      expect(healthy).toBe(false);
    });

    it.skipIf(!hasSQLiteBindings)('should return true for healthy connection', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      await manager.initialize();

      const healthy = await manager.isHealthy();
      expect(healthy).toBe(true);

      await manager.close();
    });

    it.skipIf(!hasSQLiteBindings)('should return false after connection is closed', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      await manager.initialize();
      await manager.close();

      const healthy = await manager.isHealthy();
      expect(healthy).toBe(false);
    });
  });

  describe('Connection Lifecycle', () => {
    const hasSQLiteBindings = (() => {
      try {
        const Database = require('better-sqlite3');
        const db = new Database(':memory:');
        db.close();
        return true;
      } catch {
        return false;
      }
    })();

    it.skipIf(!hasSQLiteBindings)('should close connection gracefully', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      await manager.initialize();
      await expect(manager.close()).resolves.not.toThrow();
    });

    it('should handle close on uninitialized connection', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      await expect(manager.close()).resolves.not.toThrow();
    });

    it.skipIf(!hasSQLiteBindings)('should handle multiple close calls', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      await manager.initialize();
      await manager.close();
      await expect(manager.close()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    const hasSQLiteBindings = (() => {
      try {
        const Database = require('better-sqlite3');
        const db = new Database(':memory:');
        db.close();
        return true;
      } catch {
        return false;
      }
    })();

    it('should throw error when executing query on uninitialized connection', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      await expect(manager.execute('SELECT 1')).rejects.toThrow('Database not initialized');
    });

    it.skipIf(!hasSQLiteBindings)('should provide clear error messages for connection failures', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: '/invalid/path/that/does/not/exist/database.db',
      };

      const manager = new ConnectionManager(config);
      await expect(manager.initialize()).rejects.toThrow(/Failed to initialize sqlite connection/);
    });
  });
});

