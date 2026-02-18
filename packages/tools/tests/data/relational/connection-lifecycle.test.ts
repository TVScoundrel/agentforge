/**
 * Connection Lifecycle Management Tests
 *
 * Unit tests for connection lifecycle features including:
 * - Connection state tracking
 * - Event emissions
 * - Automatic reconnection
 * - Exponential backoff
 */

import { describe, it, expect, vi } from 'vitest';
import { ConnectionManager, ConnectionState } from '../../../src/data/relational/connection/connection-manager.js';
import type { ConnectionConfig } from '../../../src/data/relational/connection/types.js';

/**
 * Check if better-sqlite3 native bindings are available
 */
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

describe('Connection Lifecycle Management', () => {
  describe('Connection State Tracking', () => {
    it.skipIf(!hasSQLiteBindings)('should start in DISCONNECTED state', () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
      expect(manager.isConnected()).toBe(false);
    });

    it.skipIf(!hasSQLiteBindings)('should transition to CONNECTED state after successful connection', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      await manager.connect();

      expect(manager.getState()).toBe(ConnectionState.CONNECTED);
      expect(manager.isConnected()).toBe(true);

      await manager.disconnect();
    });

    it.skipIf(!hasSQLiteBindings)('should transition to DISCONNECTED state after disconnect', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      await manager.connect();
      await manager.disconnect();

      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
      expect(manager.isConnected()).toBe(false);
    });

    it('should transition to ERROR state on connection failure', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: '/invalid/path/that/does/not/exist/database.db',
      };

      const manager = new ConnectionManager(config);
      
      await expect(manager.connect()).rejects.toThrow();

      expect(manager.getState()).toBe(ConnectionState.ERROR);
      expect(manager.isConnected()).toBe(false);
    });
  });

  describe('Event Emissions', () => {
    it.skipIf(!hasSQLiteBindings)('should emit connected event on successful connection', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      const connectedHandler = vi.fn();
      manager.on('connected', connectedHandler);

      await manager.connect();

      expect(connectedHandler).toHaveBeenCalledTimes(1);

      await manager.disconnect();
    });

    it.skipIf(!hasSQLiteBindings)('should emit disconnected event on disconnect', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      const disconnectedHandler = vi.fn();
      manager.on('disconnected', disconnectedHandler);

      await manager.connect();
      await manager.disconnect();

      expect(disconnectedHandler).toHaveBeenCalledTimes(1);
    });

    it('should emit error event on connection failure', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: '/invalid/path/that/does/not/exist/database.db',
      };

      const manager = new ConnectionManager(config);
      const errorHandler = vi.fn();
      manager.on('error', errorHandler);

      await expect(manager.connect()).rejects.toThrow();

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Connection Behavior', () => {
    it.skipIf(!hasSQLiteBindings)('should not reconnect if already connected', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      const connectedHandler = vi.fn();
      manager.on('connected', connectedHandler);

      await manager.connect();
      await manager.connect(); // Second call should be no-op

      expect(connectedHandler).toHaveBeenCalledTimes(1);

      await manager.disconnect();
    });

    it.skipIf(!hasSQLiteBindings)('should handle disconnect on unconnected manager', async () => {
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
      const disconnectedHandler = vi.fn();
      manager.on('disconnected', disconnectedHandler);

      await manager.connect();
      await manager.disconnect();
      await manager.disconnect(); // Second call should be no-op

      // Should only emit once
      expect(disconnectedHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Reconnection Configuration', () => {
    it('should accept reconnection configuration', () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const reconnectionConfig = {
        enabled: true,
        maxAttempts: 3,
        baseDelayMs: 500,
        maxDelayMs: 5000,
      };

      expect(() => new ConnectionManager(config, reconnectionConfig)).not.toThrow();
    });

    it('should use default reconnection config when not provided', () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);
      expect(manager).toBeDefined();
      // Reconnection is disabled by default
      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('should emit reconnecting event when reconnection is enabled', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: '/invalid/path/database.db',
      };

      const reconnectionConfig = {
        enabled: true,
        maxAttempts: 2,
        baseDelayMs: 50,
        maxDelayMs: 1000,
      };

      const manager = new ConnectionManager(config, reconnectionConfig);
      const reconnectingHandler = vi.fn();
      const errorHandler = vi.fn();
      manager.on('reconnecting', reconnectingHandler);
      manager.on('error', errorHandler);

      await expect(manager.connect()).rejects.toThrow();

      // Should have emitted reconnecting event when reconnection was scheduled
      // (emitted synchronously during scheduleReconnection())
      expect(reconnectingHandler).toHaveBeenCalled();
      expect(reconnectingHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          attempt: expect.any(Number),
          maxAttempts: 2,
          delayMs: expect.any(Number),
        })
      );

      // Clean up - disconnect to cancel any pending reconnection
      await manager.disconnect();
    });
  });

  describe('Edge case lifecycle interactions', () => {
    it('should allow connect() to be called again after entering ERROR state', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: '/invalid/path/database.db',
      };

      // Disable reconnection to force a terminal ERROR-like state
      const reconnectionConfig = {
        enabled: false,
      };

      const manager = new ConnectionManager(config, reconnectionConfig);

      // First connect attempt fails and moves manager into ERROR state
      await expect(manager.connect()).rejects.toThrow();
      expect(manager.getState()).toBe(ConnectionState.ERROR);

      // Calling connect() again in ERROR state should not throw synchronously
      await expect(manager.connect()).rejects.toThrow();
      expect(manager.getState()).toBe(ConnectionState.ERROR);
    });

    it.skipIf(!process.env.POSTGRES_CONNECTION_STRING)(
      'should handle connect() calls while in RECONNECTING state',
      async () => {
        // Use the PostgreSQL connection string from env but with invalid database
        // to trigger reconnection without assuming localhost
        const baseConnString = process.env.POSTGRES_CONNECTION_STRING!;
        const invalidConnString = baseConnString.replace(/\/[^/]*$/, '/nonexistent_db_for_test');

        const config: ConnectionConfig = {
          vendor: 'postgresql',
          connection: invalidConnString,
        };

        const reconnectionConfig = {
          enabled: true,
          maxAttempts: 2,
          baseDelayMs: 10,
          maxDelayMs: 50,
        };

        const manager = new ConnectionManager(config, reconnectionConfig);

        let secondaryConnectPromise: Promise<unknown> | null = null;
        const reconnectingHandler = vi.fn((info) => {
          // We should be in RECONNECTING state when this event fires
          expect(manager.getState()).toBe(ConnectionState.RECONNECTING);

          // Call connect() again while a reconnection attempt is scheduled/active
          if (!secondaryConnectPromise) {
            secondaryConnectPromise = manager.connect();
            expect(secondaryConnectPromise).toBeInstanceOf(Promise);
          }

          // Basic shape of the reconnect event payload
          expect(info).toEqual(
            expect.objectContaining({
              attempt: expect.any(Number),
              maxAttempts: reconnectionConfig.maxAttempts,
              delayMs: expect.any(Number),
            })
          );
        });

        manager.on('reconnecting', reconnectingHandler);

        await expect(manager.connect()).rejects.toThrow();

        // We should have entered RECONNECTING at least once
        expect(reconnectingHandler).toHaveBeenCalled();

        if (secondaryConnectPromise) {
          // The secondary connect() call should also settle cleanly
          await expect(secondaryConnectPromise).rejects.toThrow();
        }

        // Clean up
        await manager.disconnect();
      }
    );

    it('should support disconnect() while connect() / reconnection is in progress', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: '/invalid/path/database.db',
      };

      const reconnectionConfig = {
        enabled: true,
        maxAttempts: 2,
        baseDelayMs: 10,
        maxDelayMs: 50,
      };

      const manager = new ConnectionManager(config, reconnectionConfig);

      // Start connection attempt but do not await immediately
      const connectPromise = manager.connect();

      // While connect()/reconnection is in progress, request a disconnect
      const disconnectPromise = manager.disconnect();

      // connect() should eventually fail given the invalid configuration
      await expect(connectPromise).rejects.toThrow();

      // disconnect() should resolve cleanly and leave the manager disconnected
      await expect(disconnectPromise).resolves.toBeUndefined();
      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    });

    it.skipIf(!process.env.POSTGRES_CONNECTION_STRING)(
      'should cancel scheduled reconnection when disconnect() is called',
      async () => {
        // Use the PostgreSQL connection string from env but with invalid database
        const baseConnString = process.env.POSTGRES_CONNECTION_STRING!;
        const invalidConnString = baseConnString.replace(/\/[^/]*$/, '/nonexistent_db_for_test');

        const config: ConnectionConfig = {
          vendor: 'postgresql',
          connection: invalidConnString,
        };

        const reconnectionConfig = {
          enabled: true,
          maxAttempts: 3,
          baseDelayMs: 50,
          maxDelayMs: 200,
        };

        const manager = new ConnectionManager(config, reconnectionConfig);

        vi.useFakeTimers();
        const reconnectingHandler = vi.fn();
        manager.on('reconnecting', reconnectingHandler);

        // Trigger initial connection attempt; ignore its rejection for test purposes
        const connectPromise = manager.connect().catch(() => undefined);

        // Run timers enough to schedule at least one reconnection
        vi.runOnlyPendingTimers();

        // We should have scheduled at least one reconnection attempt
        expect(reconnectingHandler).toHaveBeenCalled();

        // Now disconnect the manager, which should cancel any further reconnection attempts
        await manager.disconnect();
        expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);

        // Advance all remaining timers; no additional reconnecting events should fire
        reconnectingHandler.mockClear();
        vi.runAllTimers();
        expect(reconnectingHandler).not.toHaveBeenCalled();

        await connectPromise;
        vi.useRealTimers();
      }
    );

    it('should handle multiple concurrent connect() calls in ERROR state', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: '/invalid/path/database.db',
      };

      const reconnectionConfig = {
        enabled: false,
      };

      const manager = new ConnectionManager(config, reconnectionConfig);

      // Move to ERROR state
      await expect(manager.connect()).rejects.toThrow();
      expect(manager.getState()).toBe(ConnectionState.ERROR);

      // Fire off multiple concurrent connect() calls while in ERROR
      const p1 = manager.connect();
      const p2 = manager.connect();

      const results = await Promise.allSettled([p1, p2]);
      for (const result of results) {
        expect(result.status).toBe('rejected');
      }

      // State should remain ERROR after failed attempts
      expect(manager.getState()).toBe(ConnectionState.ERROR);
    });

    it.skipIf(!process.env.POSTGRES_CONNECTION_STRING)(
      'should properly dispose of ConnectionManager instance',
      async () => {
        const config: ConnectionConfig = {
          vendor: 'postgresql',
          connection: process.env.POSTGRES_CONNECTION_STRING!,
        };

        const manager = new ConnectionManager(config);

        // Register event listeners
        const connectedHandler = vi.fn();
        const disconnectedHandler = vi.fn();
        const errorHandler = vi.fn();

        manager.on('connected', connectedHandler);
        manager.on('disconnected', disconnectedHandler);
        manager.on('error', errorHandler);

        // Connect successfully
        await manager.connect();
        expect(manager.getState()).toBe(ConnectionState.CONNECTED);
        expect(connectedHandler).toHaveBeenCalledTimes(1);

        // Call dispose() which should disconnect and remove all listeners
        await manager.dispose();

        // Should be disconnected
        expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
        expect(disconnectedHandler).toHaveBeenCalledTimes(1);

        // Verify all event listeners are removed by checking listenerCount
        expect(manager.listenerCount('connected')).toBe(0);
        expect(manager.listenerCount('disconnected')).toBe(0);
        expect(manager.listenerCount('error')).toBe(0);
        expect(manager.listenerCount('reconnecting')).toBe(0);
      }
    );

    it.skipIf(!process.env.POSTGRES_CONNECTION_STRING)(
      'should allow dispose() to be called multiple times safely',
      async () => {
        const config: ConnectionConfig = {
          vendor: 'postgresql',
          connection: process.env.POSTGRES_CONNECTION_STRING!,
        };

        const manager = new ConnectionManager(config);

        // Connect and dispose
        await manager.connect();
        expect(manager.getState()).toBe(ConnectionState.CONNECTED);

        await manager.dispose();
        expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);

        // Calling dispose() again should not throw
        await expect(manager.dispose()).resolves.toBeUndefined();
        expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
      }
    );

    it('should remove listeners when dispose() is called without prior connection', async () => {
      const config: ConnectionConfig = {
        vendor: 'sqlite',
        connection: ':memory:',
      };

      const manager = new ConnectionManager(config);

      // Register listeners without connecting
      const errorHandler = vi.fn();
      manager.on('error', errorHandler);

      expect(manager.listenerCount('error')).toBe(1);

      // Dispose should still remove listeners even if never connected
      await manager.dispose();

      expect(manager.listenerCount('error')).toBe(0);
      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    });
  });
});

