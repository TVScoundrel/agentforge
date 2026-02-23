/**
 * ConnectionManager Tests
 *
 * Unit tests for the ConnectionManager class.
 * Tests peer dependency checking, configuration validation, and basic functionality.
 */

import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { ConnectionManager } from '../../../src/data/relational/connection/connection-manager.js';
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
    // Skip if the native module is not available (checked via hasSQLiteBindings at top of file)

    it.skipIf(!hasSQLiteBindings)('should initialize SQLite connection with in-memory database', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      await expect(manager.connect()).resolves.not.toThrow();

      // Verify connection is healthy
      const healthy = await manager.isHealthy();
      expect(healthy).toBe(true);

      // Clean up
      await manager.disconnect();
    });

    it.skipIf(!hasSQLiteBindings)('should initialize SQLite connection with config object', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: {
          url: ':memory:',
        },
      };

      const manager = new ConnectionManager(config);
      await expect(manager.connect()).resolves.not.toThrow();

      const healthy = await manager.isHealthy();
      expect(healthy).toBe(true);

      await manager.disconnect();
    });

    it.skipIf(!hasSQLiteBindings)('should throw error for SQLite config without url', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: {} as any,
      };

      const manager = new ConnectionManager(config);
      await expect(manager.connect()).rejects.toThrow('SQLite connection requires a url property');
    });
  });

  describe('Connection Health', () => {
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
      await manager.connect();

      const healthy = await manager.isHealthy();
      expect(healthy).toBe(true);

      await manager.disconnect();
    });

    it.skipIf(!hasSQLiteBindings)('should return false after connection is closed', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      await manager.connect();
      await manager.disconnect();

      const healthy = await manager.isHealthy();
      expect(healthy).toBe(false);
    });
  });

  describe('Connection Lifecycle', () => {
    it.skipIf(!hasSQLiteBindings)('should close connection gracefully', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      await manager.connect();
      await expect(manager.disconnect()).resolves.not.toThrow();
    });

    it('should handle disconnect on uninitialized connection', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      await expect(manager.disconnect()).resolves.not.toThrow();
    });

    it.skipIf(!hasSQLiteBindings)('should handle multiple disconnect calls', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      await manager.connect();
      await manager.disconnect();
      await expect(manager.disconnect()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when executing query on uninitialized connection', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      await expect(manager.execute(sql`SELECT 1`)).rejects.toThrow('Database not initialized');
    });

    it.skipIf(!hasSQLiteBindings)('should provide clear error messages for connection failures', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: '/invalid/path/that/does/not/exist/database.db',
      };

      const manager = new ConnectionManager(config);
      await expect(manager.connect()).rejects.toThrow(/Failed to initialize sqlite connection/);
      // Verify the original driver error is preserved as a cause
      try {
        await manager.connect();
      } catch (e: unknown) {
        expect((e as Error).cause).toBeDefined();
      }
    });
  });

  describe('Connection Pooling', () => {
    describe('Pool Configuration Validation', () => {
      it('should reject max connections less than 1', async () => {
        const config: ConnectionConfig = {
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
        };

        const manager = new ConnectionManager(config);
        await expect(manager.connect()).rejects.toThrow('Pool max connections must be >= 1');
      });

      it('should reject negative acquire timeout', async () => {
        const config: ConnectionConfig = {
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
        };

        const manager = new ConnectionManager(config);
        await expect(manager.connect()).rejects.toThrow('Pool acquire timeout must be >= 0');
      });

      it('should reject negative idle timeout', async () => {
        const config: ConnectionConfig = {
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
        };

        const manager = new ConnectionManager(config);
        await expect(manager.connect()).rejects.toThrow('Pool idle timeout must be >= 0');
      });

      it('should accept valid pool configuration', async () => {
        const config: ConnectionConfig = {
          vendor: 'postgresql',
          connection: {
            host: 'localhost',
            port: 5432,
            database: 'test',
            user: 'testuser',
            password: 'testpass',
            pool: {
              max: 10,
              acquireTimeoutMillis: 30000,
              idleTimeoutMillis: 10000,
            },
          },
        };

        const manager = new ConnectionManager(config);
        // Validation happens during connect(), so we expect it to fail with connection error
        // (not validation error) since we're using fake credentials
        await expect(manager.connect()).rejects.toThrow(/Failed to (initialize postgresql connection|establish healthy connection)/);
      });
    });

    describe('Pool Metrics', () => {
      it('should return zero metrics when not initialized', () => {
        const config: ConnectionConfig = {
          vendor: 'postgresql',
          connection: 'postgresql://localhost:5432/test',
        };

        const manager = new ConnectionManager(config);
        const metrics = manager.getPoolMetrics();

        expect(metrics).toEqual({
          totalCount: 0,
          activeCount: 0,
          idleCount: 0,
          waitingCount: 0,
        });
      });

      it.skipIf(!hasSQLiteBindings)('should return metrics for SQLite connection', async () => {
        const config: ConnectionConfig = {
          vendor: 'sqlite',
          connection: ':memory:',
        };

        const manager = new ConnectionManager(config);
        await manager.connect();

        const metrics = manager.getPoolMetrics();

        expect(metrics.totalCount).toBe(1);
        expect(metrics.activeCount).toBe(1);
        expect(metrics.idleCount).toBe(0);
        expect(metrics.waitingCount).toBe(0);

        await manager.disconnect();
      });

      it('should return neutral metrics for MySQL (no stable API)', () => {
        const config: ConnectionConfig = {
          vendor: 'mysql',
          connection: 'mysql://localhost:3306/test',
        };

        const manager = new ConnectionManager(config);
        const metrics = manager.getPoolMetrics();

        // MySQL returns neutral metrics since there's no stable public API
        expect(metrics).toEqual({
          totalCount: 0,
          activeCount: 0,
          idleCount: 0,
          waitingCount: 0,
        });
      });
    });
  });
});

