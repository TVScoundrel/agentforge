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
    it('should start in DISCONNECTED state', () => {
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
});

