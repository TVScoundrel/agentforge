import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ConnectionManager,
  ConnectionState,
  mockPgExecute,
  mockPool,
  mockPoolEnd,
} from './connection-manager.mock-harness.js';

describe('ConnectionManager mocked lifecycle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('creates instance with PostgreSQL vendor', () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      expect(manager.getVendor()).toBe('postgresql');
      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('applies default reconnection config', () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      expect(manager.isConnected()).toBe(false);
    });

    it('accepts custom reconnection config', () => {
      const manager = new ConnectionManager(
        { vendor: 'postgresql', connection: 'postgresql://localhost/test' },
        { enabled: true, maxAttempts: 10, baseDelayMs: 500, maxDelayMs: 60000 }
      );

      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    });
  });

  describe('connect and disconnect', () => {
    it('connects to PostgreSQL and disconnects cleanly', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      await manager.connect();
      expect(manager.getState()).toBe(ConnectionState.CONNECTED);

      await manager.disconnect();
      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('treats connect as a no-op when already connected', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      await manager.connect();
      await manager.connect();

      expect(manager.isConnected()).toBe(true);

      await manager.disconnect();
    });

    it('emits connected and disconnected events', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });
      const connected = vi.fn();
      const disconnected = vi.fn();

      manager.on('connected', connected);
      manager.on('disconnected', disconnected);

      await manager.connect();
      await manager.disconnect();

      expect(connected).toHaveBeenCalledOnce();
      expect(disconnected).toHaveBeenCalledOnce();
    });

    it('cancels an in-flight initialize during disconnect', async () => {
      let resolveHealthCheck:
        | ((value: Array<{ '?column?': number }>) => void)
        | undefined;
      const healthCheckPromise = new Promise<Array<{ '?column?': number }>>((resolve) => {
        resolveHealthCheck = resolve;
      });
      mockPgExecute.mockReturnValueOnce(healthCheckPromise);

      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      const connectPromise = manager.connect();
      const disconnectPromise = manager.disconnect();
      resolveHealthCheck?.([{ '?column?': 1 }]);

      await expect(connectPromise).rejects.toThrow('Failed to initialize postgresql connection');
      await disconnectPromise;

      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
      expect(mockPoolEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe('dispose and close', () => {
    it('disconnects and removes listeners during dispose', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });
      const listener = vi.fn();

      manager.on('connected', listener);

      await manager.connect();
      await manager.dispose();

      expect(manager.isConnected()).toBe(false);
      expect(manager.listenerCount('connected')).toBe(0);
    });

    it('closes the PostgreSQL pool', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      await manager.connect();
      await manager.close();

      expect(mockPoolEnd).toHaveBeenCalled();
      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('handles close errors gracefully', async () => {
      mockPoolEnd.mockRejectedValueOnce(new Error('Close error'));

      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });
      const errorListener = vi.fn();

      await manager.connect();
      manager.on('error', errorListener);
      await manager.close();

      expect(manager.getState()).toBe(ConnectionState.ERROR);
      expect(errorListener).toHaveBeenCalled();
    });

    it('no-ops close when there is no client but state is not disconnected', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      (manager as unknown as { state: ConnectionState }).state = ConnectionState.ERROR;
      await manager.close();

      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('cancels a pending reconnection timer during close', async () => {
      vi.useFakeTimers();

      try {
        mockPgExecute.mockRejectedValue(new Error('Health check failed'));

        const manager = new ConnectionManager(
          { vendor: 'postgresql', connection: 'postgresql://localhost/test' },
          { enabled: true, maxAttempts: 1, baseDelayMs: 10, maxDelayMs: 100 }
        );
        const errorListener = vi.fn();

        manager.on('error', errorListener);

        await expect(manager.connect()).rejects.toThrow('Failed to initialize postgresql connection');
        expect(manager.getState()).toBe(ConnectionState.RECONNECTING);

        await manager.close();
        await vi.advanceTimersByTimeAsync(20);

        expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
        expect(mockPool).toHaveBeenCalledTimes(1);
        expect(errorListener).toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('reconnection and initialization errors', () => {
    it('schedules reconnection on error when configured', async () => {
      mockPgExecute.mockRejectedValue(new Error('Health check failed'));

      const manager = new ConnectionManager(
        { vendor: 'postgresql', connection: 'postgresql://localhost/test' },
        { enabled: true, maxAttempts: 1, baseDelayMs: 10, maxDelayMs: 100 }
      );
      const errorListener = vi.fn();
      const reconnectingListener = vi.fn();

      manager.on('error', errorListener);
      manager.on('reconnecting', reconnectingListener);

      await expect(manager.connect()).rejects.toThrow();

      expect(errorListener).toHaveBeenCalled();
      expect(reconnectingListener).toHaveBeenCalled();
      expect(manager.getState()).toBe(ConnectionState.RECONNECTING);

      await manager.disconnect();
    });

    it('emits error on initialization failure', async () => {
      mockPgExecute.mockRejectedValue(new Error('Connection refused'));

      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });
      const errorListener = vi.fn();

      manager.on('error', errorListener);

      await expect(manager.connect()).rejects.toThrow('Failed to initialize');
      expect(errorListener).toHaveBeenCalled();
      expect(manager.getState()).toBe(ConnectionState.ERROR);
    });

    it('throws for unsupported vendors', async () => {
      const manager = new ConnectionManager({
        vendor: 'oracle' as never,
        connection: 'oracle://localhost/test',
      });

      await expect(manager.connect()).rejects.toThrow('Unsupported database vendor');
    });
  });
});
