import { describe, expect, it, vi } from 'vitest';
import { ConnectionManager, ConnectionState } from '../../../../src/data/relational/connection/connection-manager.js';
import { hasSQLiteBindings } from './sqlite-bindings.js';

describe('Connection lifecycle reconnection', () => {
  it('emits reconnecting when reconnection is enabled', async () => {
    const manager = new ConnectionManager(
      {
        vendor: 'sqlite',
        connection: '/invalid/path/database.db',
      },
      {
        enabled: true,
        maxAttempts: 2,
        baseDelayMs: 50,
        maxDelayMs: 1000,
      }
    );
    const reconnecting = vi.fn();
    const errorHandler = vi.fn();

    manager.on('reconnecting', reconnecting);
    manager.on('error', errorHandler);

    await expect(manager.connect()).rejects.toThrow();

    expect(reconnecting).toHaveBeenCalled();
    expect(reconnecting).toHaveBeenCalledWith(
      expect.objectContaining({
        attempt: expect.any(Number),
        maxAttempts: 2,
        delayMs: expect.any(Number),
      })
    );

    await manager.disconnect();
  });

  it.skipIf(!hasSQLiteBindings)('allows connect after entering ERROR state', async () => {
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
    await expect(manager.connect()).rejects.toThrow();
    expect(manager.getState()).toBe(ConnectionState.ERROR);
  });

  it.skipIf(!process.env.POSTGRES_CONNECTION_STRING)(
    'handles connect calls while already reconnecting',
    async () => {
      const invalidConnString = process.env.POSTGRES_CONNECTION_STRING!.replace(
        /\/[^/]*$/,
        '/nonexistent_db_for_test'
      );
      const manager = new ConnectionManager(
        {
          vendor: 'postgresql',
          connection: invalidConnString,
        },
        {
          enabled: true,
          maxAttempts: 2,
          baseDelayMs: 10,
          maxDelayMs: 50,
        }
      );

      let secondaryConnectPromise: Promise<void> | null = null;
      const reconnecting = vi.fn((info) => {
        expect(manager.getState()).toBe(ConnectionState.RECONNECTING);

        if (!secondaryConnectPromise) {
          secondaryConnectPromise = manager.connect();
          expect(secondaryConnectPromise).toBeInstanceOf(Promise);
        }

        expect(info).toEqual(
          expect.objectContaining({
            attempt: expect.any(Number),
            maxAttempts: 2,
            delayMs: expect.any(Number),
          })
        );
      });

      manager.on('reconnecting', reconnecting);
      await expect(manager.connect()).rejects.toThrow();
      expect(reconnecting).toHaveBeenCalled();

      if (secondaryConnectPromise) {
        await expect(secondaryConnectPromise).rejects.toThrow();
      }

      await manager.disconnect();
    }
  );

  it.skipIf(!hasSQLiteBindings)('supports disconnect while connect or reconnect is in progress', async () => {
    const manager = new ConnectionManager(
      {
        vendor: 'sqlite',
        connection: '/invalid/path/database.db',
      },
      {
        enabled: true,
        maxAttempts: 2,
        baseDelayMs: 10,
        maxDelayMs: 50,
      }
    );

    const connectPromise = manager.connect();
    const disconnectPromise = manager.disconnect();

    await expect(connectPromise).rejects.toThrow();
    await expect(disconnectPromise).resolves.toBeUndefined();
    expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
  });

  it.skipIf(!process.env.POSTGRES_CONNECTION_STRING)(
    'cancels scheduled reconnection when disconnect is called',
    async () => {
      const invalidConnString = process.env.POSTGRES_CONNECTION_STRING!.replace(
        /\/[^/]*$/,
        '/nonexistent_db_for_test'
      );
      const manager = new ConnectionManager(
        {
          vendor: 'postgresql',
          connection: invalidConnString,
        },
        {
          enabled: true,
          maxAttempts: 3,
          baseDelayMs: 50,
          maxDelayMs: 200,
        }
      );

      vi.useFakeTimers();
      try {
        const reconnecting = vi.fn();
        manager.on('reconnecting', reconnecting);

        const connectPromise = manager.connect().catch(() => undefined);
        vi.runOnlyPendingTimers();
        expect(reconnecting).toHaveBeenCalled();

        await manager.disconnect();
        expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);

        reconnecting.mockClear();
        vi.runAllTimers();
        expect(reconnecting).not.toHaveBeenCalled();

        await connectPromise;
      } finally {
        vi.useRealTimers();
      }
    }
  );
});
