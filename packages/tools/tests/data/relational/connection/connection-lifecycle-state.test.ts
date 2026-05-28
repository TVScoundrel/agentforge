import { describe, expect, it } from 'vitest';
import { ConnectionManager, ConnectionState } from '../../../../src/data/relational/connection/connection-manager.js';
import { hasSQLiteBindings } from './sqlite-bindings.js';

describe('Connection lifecycle state tracking', () => {
  it.skipIf(!hasSQLiteBindings)('starts in DISCONNECTED state', () => {
    const manager = new ConnectionManager({
      vendor: 'sqlite',
      connection: ':memory:',
    });

    expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    expect(manager.isConnected()).toBe(false);
  });

  it.skipIf(!hasSQLiteBindings)('transitions to CONNECTED after successful connect', async () => {
    const manager = new ConnectionManager({
      vendor: 'sqlite',
      connection: ':memory:',
    });

    await manager.connect();
    expect(manager.getState()).toBe(ConnectionState.CONNECTED);
    expect(manager.isConnected()).toBe(true);
    await manager.disconnect();
  });

  it.skipIf(!hasSQLiteBindings)('transitions to DISCONNECTED after disconnect', async () => {
    const manager = new ConnectionManager({
      vendor: 'sqlite',
      connection: ':memory:',
    });

    await manager.connect();
    await manager.disconnect();

    expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    expect(manager.isConnected()).toBe(false);
  });

  it.skipIf(!hasSQLiteBindings)('transitions to ERROR after a failed connect', async () => {
    const manager = new ConnectionManager({
      vendor: 'sqlite',
      connection: '/invalid/path/that/does/not/exist/database.db',
    });

    await expect(manager.connect()).rejects.toThrow();
    expect(manager.getState()).toBe(ConnectionState.ERROR);
    expect(manager.isConnected()).toBe(false);
  });
});
