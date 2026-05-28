import { describe, expect, it, vi } from 'vitest';
import { ConnectionManager } from '../../../../src/data/relational/connection/connection-manager.js';
import { hasSQLiteBindings } from './sqlite-bindings.js';

describe('Connection lifecycle events', () => {
  it.skipIf(!hasSQLiteBindings)('emits connected on successful connect', async () => {
    const manager = new ConnectionManager({
      vendor: 'sqlite',
      connection: ':memory:',
    });
    const connected = vi.fn();

    manager.on('connected', connected);
    await manager.connect();

    expect(connected).toHaveBeenCalledTimes(1);
    await manager.disconnect();
  });

  it.skipIf(!hasSQLiteBindings)('emits disconnected on disconnect', async () => {
    const manager = new ConnectionManager({
      vendor: 'sqlite',
      connection: ':memory:',
    });
    const disconnected = vi.fn();

    manager.on('disconnected', disconnected);
    await manager.connect();
    await manager.disconnect();

    expect(disconnected).toHaveBeenCalledTimes(1);
  });

  it.skipIf(!hasSQLiteBindings)('emits error on connection failure', async () => {
    const manager = new ConnectionManager({
      vendor: 'sqlite',
      connection: '/invalid/path/that/does/not/exist/database.db',
    });
    const errorHandler = vi.fn();

    manager.on('error', errorHandler);
    await expect(manager.connect()).rejects.toThrow();

    expect(errorHandler).toHaveBeenCalledTimes(1);
    expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
  });
});
