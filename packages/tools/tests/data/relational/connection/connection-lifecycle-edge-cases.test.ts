import { describe, expect, it, vi } from 'vitest';
import { ConnectionManager, ConnectionState } from '../../../../src/data/relational/connection/connection-manager.js';
import { hasSQLiteBindings } from './sqlite-bindings.js';

describe('Connection lifecycle edge cases', () => {
  it.skipIf(!hasSQLiteBindings)('handles multiple concurrent connect calls in ERROR state', async () => {
    const manager = new ConnectionManager(
      {
        vendor: 'sqlite',
        connection: '/invalid/path/database.db',
      },
      {
        enabled: false,
      }
    );

    await expect(manager.connect()).rejects.toThrow();
    expect(manager.getState()).toBe(ConnectionState.ERROR);

    const results = await Promise.allSettled([manager.connect(), manager.connect()]);
    for (const result of results) {
      expect(result.status).toBe('rejected');
    }

    expect(manager.getState()).toBe(ConnectionState.ERROR);
  });

  it.skipIf(!process.env.POSTGRES_CONNECTION_STRING)(
    'properly disposes a connected manager',
    async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: process.env.POSTGRES_CONNECTION_STRING!,
      });
      const connected = vi.fn();
      const disconnected = vi.fn();
      const errorHandler = vi.fn();

      manager.on('connected', connected);
      manager.on('disconnected', disconnected);
      manager.on('error', errorHandler);

      await manager.connect();
      expect(manager.getState()).toBe(ConnectionState.CONNECTED);
      expect(connected).toHaveBeenCalledTimes(1);

      await manager.dispose();

      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
      expect(disconnected).toHaveBeenCalledTimes(1);
      expect(manager.listenerCount('connected')).toBe(0);
      expect(manager.listenerCount('disconnected')).toBe(0);
      expect(manager.listenerCount('error')).toBe(0);
      expect(manager.listenerCount('reconnecting')).toBe(0);
    }
  );

  it.skipIf(!process.env.POSTGRES_CONNECTION_STRING)(
    'allows dispose to be called multiple times safely',
    async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: process.env.POSTGRES_CONNECTION_STRING!,
      });

      await manager.connect();
      expect(manager.getState()).toBe(ConnectionState.CONNECTED);

      await manager.dispose();
      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);

      await expect(manager.dispose()).resolves.toBeUndefined();
      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    }
  );

  it('removes listeners when dispose is called without a prior connection', async () => {
    const manager = new ConnectionManager({
      vendor: 'sqlite',
      connection: ':memory:',
    });
    const errorHandler = vi.fn();

    manager.on('error', errorHandler);
    expect(manager.listenerCount('error')).toBe(1);

    await manager.dispose();

    expect(manager.listenerCount('error')).toBe(0);
    expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
  });
});
