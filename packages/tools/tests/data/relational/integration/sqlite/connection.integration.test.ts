/**
 * SQLite Connection Integration Tests
 *
 * Tests real SQLite connection lifecycle using better-sqlite3 in-memory databases.
 * Requires compiled better-sqlite3 native bindings.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { ConnectionManager, ConnectionState } from '../../../../../src/data/relational/connection/connection-manager.js';
import type { ConnectionConfig } from '../../../../../src/data/relational/connection/types.js';

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

describe.skipIf(!hasSQLiteBindings)('SQLite Connection Integration', () => {
  let manager: ConnectionManager;

  afterEach(async () => {
    if (manager && manager.isConnected()) {
      await manager.disconnect();
    }
  });

  describe('Connection Lifecycle', () => {
    it('should connect to an in-memory database', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      manager = new ConnectionManager(config);
      await manager.connect();

      expect(manager.isConnected()).toBe(true);
      expect(manager.getState()).toBe(ConnectionState.CONNECTED);
    });

    it('should connect using config object with url', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: { url: ':memory:' },
      };

      manager = new ConnectionManager(config);
      await manager.connect();

      expect(manager.isConnected()).toBe(true);
    });

    it('should report healthy after connection', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      manager = new ConnectionManager(config);
      await manager.connect();

      const healthy = await manager.isHealthy();
      expect(healthy).toBe(true);
    });

    it('should disconnect cleanly', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      manager = new ConnectionManager(config);
      await manager.connect();
      await manager.disconnect();

      expect(manager.isConnected()).toBe(false);
      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('should emit lifecycle events', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      manager = new ConnectionManager(config);

      const events: string[] = [];
      manager.on('connected', () => events.push('connected'));
      manager.on('disconnected', () => events.push('disconnected'));

      await manager.connect();
      await manager.disconnect();

      expect(events).toContain('connected');
      expect(events).toContain('disconnected');
    });

    it('should fail to connect with invalid path', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: '/nonexistent/directory/database.db',
      };

      manager = new ConnectionManager(config);
      await expect(manager.connect()).rejects.toThrow();
      expect(manager.getState()).toBe(ConnectionState.ERROR);
    });

    it('should support reconnection after disconnect', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      manager = new ConnectionManager(config);
      await manager.connect();
      expect(manager.isConnected()).toBe(true);

      await manager.disconnect();
      expect(manager.isConnected()).toBe(false);

      // Reconnect
      await manager.connect();
      expect(manager.isConnected()).toBe(true);
    });

    it('should dispose cleanly', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      manager = new ConnectionManager(config);
      await manager.connect();
      await manager.dispose();

      expect(manager.isConnected()).toBe(false);
    });

    it('should return pool metrics', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      manager = new ConnectionManager(config);
      await manager.connect();

      const metrics = manager.getPoolMetrics();
      // SQLite returns 0 or 1 for pool metrics (single connection)
      expect(metrics).toBeDefined();
      expect(typeof metrics.totalCount).toBe('number');
    });
  });
});
