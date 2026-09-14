import type { ConnectionPoolRuntime, PooledConnection, PoolStats } from './pool-types.js';

export function createInitialPoolStats(): PoolStats {
  return {
    size: 0,
    available: 0,
    pending: 0,
    acquired: 0,
    created: 0,
    destroyed: 0,
    healthChecksPassed: 0,
    healthChecksFailed: 0,
  };
}

export function checkoutConnection<T>(
  runtime: ConnectionPoolRuntime<T>,
  pooled: PooledConnection<T>
): T {
  const previousLastUsedAt = pooled.lastUsedAt;

  pooled.inUse = true;
  pooled.lastUsedAt = Date.now();
  runtime.stats.available--;
  runtime.stats.acquired++;

  try {
    runtime.options.onAcquire?.(pooled.connection);
    return pooled.connection;
  } catch (error) {
    pooled.inUse = false;
    pooled.lastUsedAt = previousLastUsedAt;
    runtime.stats.available++;
    runtime.stats.acquired--;
    throw error;
  }
}

export async function initializeConnections<T>(
  runtime: ConnectionPoolRuntime<T>,
  count: number
): Promise<void> {
  runtime.creating += count;
  const promises = Array.from({ length: count }, async () => {
    try {
      const connection = await createConnection(runtime);
      const pooled = runtime.connections.find((item) => item.connection === connection);
      if (!pooled) {
        throw new Error('Newly created connection not found in pool');
      }
      if (runtime.draining) {
        await destroyConnection(runtime, pooled);
        return;
      }

      assignConnectionToPendingAcquire(runtime, connection);
    } finally {
      runtime.creating--;
    }
  });
  await Promise.all(promises);
}

export function assignConnectionToPendingAcquire<T>(
  runtime: ConnectionPoolRuntime<T>,
  connection: T
): void {
  const pooled = runtime.connections.find((item) => item.connection === connection);
  if (!pooled) {
    return;
  }

  let pending = runtime.pending.shift();
  while (pending) {
    clearTimeout(pending.timeout);
    runtime.stats.pending--;

    try {
      pending.resolve(checkoutConnection(runtime, pooled));
      return;
    } catch (error) {
      pending.reject(error instanceof Error ? error : new Error(String(error)));
      pending = runtime.pending.shift();
    }
  }
}

export async function createConnection<T>(runtime: ConnectionPoolRuntime<T>): Promise<T> {
  const connection = await runtime.options.factory();
  const now = Date.now();

  runtime.connections.push({
    connection,
    createdAt: now,
    lastUsedAt: now,
    inUse: false,
  });
  runtime.stats.created++;
  runtime.stats.size++;
  runtime.stats.available++;

  return connection;
}

function finalizeDestroyedConnection<T>(
  runtime: ConnectionPoolRuntime<T>,
  pooled: PooledConnection<T>
): void {
  runtime.stats.destroyed++;
  runtime.stats.size--;
  if (pooled.inUse) {
    runtime.stats.acquired--;
  } else {
    runtime.stats.available--;
  }
}

export async function destroyConnection<T>(
  runtime: ConnectionPoolRuntime<T>,
  pooled: PooledConnection<T>
): Promise<void> {
  const index = runtime.connections.indexOf(pooled);
  if (index !== -1) {
    runtime.connections.splice(index, 1);
  }

  if (runtime.options.destroyer) {
    try {
      await runtime.options.destroyer(pooled.connection);
    } catch (error) {
      finalizeDestroyedConnection(runtime, pooled);
      throw error;
    }
  }

  runtime.options.onDestroy?.(pooled.connection);
  finalizeDestroyedConnection(runtime, pooled);
}

export function getPoolConfig<T>(runtime: ConnectionPoolRuntime<T>) {
  return runtime.options.pool || {};
}

export function getHealthCheckConfig<T>(runtime: ConnectionPoolRuntime<T>) {
  return runtime.options.healthCheck || {};
}

export function clonePoolStats<T>(runtime: ConnectionPoolRuntime<T>): PoolStats {
  return { ...runtime.stats };
}
