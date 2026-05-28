import { describe, expect, it, vi } from 'vitest';
import { ConnectionManager, ConnectionState } from '../../../../src/data/relational/connection/connection-manager.js';
import type { ConnectionConfig } from '../../../../src/data/relational/connection/types.js';
import { hasSQLiteBindings } from './sqlite-bindings.js';

describe('Connection lifecycle behavior', () => {
  it.skipIf(!hasSQLiteBindings)('does not reconnect if already connected', async () => {
    const manager = new ConnectionManager({
      vendor: 'sqlite',
      connection: ':memory:',
    });
    const connected = vi.fn();

    manager.on('connected', connected);
    await manager.connect();
    await manager.connect();

    expect(connected).toHaveBeenCalledTimes(1);
    await manager.disconnect();
  });

  it.skipIf(!hasSQLiteBindings)('handles disconnect on an unconnected manager', async () => {
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
    const disconnected = vi.fn();

    manager.on('disconnected', disconnected);
    await manager.connect();
    await manager.disconnect();
    await manager.disconnect();

    expect(disconnected).toHaveBeenCalledTimes(1);
  });

  it('accepts explicit reconnection configuration', () => {
    const config: ConnectionConfig = {
      vendor: 'sqlite',
      connection: ':memory:',
    };

    expect(
      () =>
        new ConnectionManager(config, {
          enabled: true,
          maxAttempts: 3,
          baseDelayMs: 500,
          maxDelayMs: 5000,
        })
    ).not.toThrow();
  });

  it('uses default reconnection configuration when not provided', () => {
    const manager = new ConnectionManager({
      vendor: 'sqlite',
      connection: ':memory:',
    });

    expect(manager).toBeDefined();
    expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
  });
});
