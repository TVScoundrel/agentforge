import { describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { ConnectionManager } from '../../../../src/data/relational/connection/connection-manager.js';
import type { ConnectionConfig } from '../../../../src/data/relational/connection/types.js';
import { hasSQLiteBindings } from './sqlite-bindings.js';

describe('ConnectionManager sqlite runtime', () => {
  describe('initialization', () => {
    it.skipIf(!hasSQLiteBindings)('initializes SQLite connection with in-memory database', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: ':memory:',
      });

      await expect(manager.connect()).resolves.not.toThrow();
      await expect(manager.isHealthy()).resolves.toBe(true);
      await manager.disconnect();
    });

    it.skipIf(!hasSQLiteBindings)('initializes SQLite connection with config object', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: {
          url: ':memory:',
        },
      });

      await expect(manager.connect()).resolves.not.toThrow();
      await expect(manager.isHealthy()).resolves.toBe(true);
      await manager.disconnect();
    });

    it.skipIf(!hasSQLiteBindings)('throws when SQLite config object has no url', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: {} as ConnectionConfig['connection'],
      });

      await expect(manager.connect()).rejects.toThrow('SQLite connection requires a url property');
    });
  });

  describe('health and lifecycle', () => {
    it('returns false for an uninitialized connection', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: ':memory:',
      });

      await expect(manager.isHealthy()).resolves.toBe(false);
    });

    it.skipIf(!hasSQLiteBindings)('returns true for a healthy connection', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: ':memory:',
      });

      await manager.connect();
      await expect(manager.isHealthy()).resolves.toBe(true);
      await manager.disconnect();
    });

    it.skipIf(!hasSQLiteBindings)('returns false after connection is closed', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: ':memory:',
      });

      await manager.connect();
      await manager.disconnect();

      await expect(manager.isHealthy()).resolves.toBe(false);
    });

    it.skipIf(!hasSQLiteBindings)('closes connection gracefully', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: ':memory:',
      });

      await manager.connect();
      await expect(manager.disconnect()).resolves.not.toThrow();
    });

    it('handles disconnect on an uninitialized connection', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: ':memory:',
      });

      await expect(manager.disconnect()).resolves.not.toThrow();
    });

    it.skipIf(!hasSQLiteBindings)('handles multiple disconnect calls', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: ':memory:',
      });

      await manager.connect();
      await manager.disconnect();
      await expect(manager.disconnect()).resolves.not.toThrow();
    });
  });

  describe('error handling and metrics', () => {
    it('throws when executing a query on an uninitialized connection', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: ':memory:',
      });

      await expect(manager.execute(sql`SELECT 1`)).rejects.toThrow('Database not initialized');
    });

    it.skipIf(!hasSQLiteBindings)('surfaces a clear initialization failure with a driver cause', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: '/invalid/path/that/does/not/exist/database.db',
      });

      await expect(manager.connect()).rejects.toThrow(/Failed to initialize sqlite connection/);

      try {
        await manager.connect();
      } catch (error) {
        expect((error as Error).cause).toBeDefined();
      }
    });

    it('returns zero metrics when not initialized', () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost:5432/test',
      });

      expect(manager.getPoolMetrics()).toEqual({
        totalCount: 0,
        activeCount: 0,
        idleCount: 0,
        waitingCount: 0,
      });
    });

    it.skipIf(!hasSQLiteBindings)('returns sqlite metrics after connect', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: ':memory:',
      });

      await manager.connect();
      expect(manager.getPoolMetrics()).toEqual({
        totalCount: 1,
        activeCount: 1,
        idleCount: 0,
        waitingCount: 0,
      });
      await manager.disconnect();
    });

    it('returns neutral metrics for mysql without a stable pool API', () => {
      const manager = new ConnectionManager({
        vendor: 'mysql',
        connection: 'mysql://localhost:3306/test',
      });

      expect(manager.getPoolMetrics()).toEqual({
        totalCount: 0,
        activeCount: 0,
        idleCount: 0,
        waitingCount: 0,
      });
    });
  });
});
