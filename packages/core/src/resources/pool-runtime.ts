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

export async function initializeConnections<T>(
  runtime: ConnectionPoolRuntime<T>,
  count: number
): Promise<void> {
  runtime.creating += count;
  const promises = Array.from({ length: count }, async () => {
    try {
      const connection = await createConnection(runtime);
      assignConnectionToPendingAcquire(runtime, connection);
    } finally {
      runtime.creating--;
    }
  });
  await Promise.all(promises);
}

function assignConnectionToPendingAcquire<T>(runtime: ConnectionPoolRuntime<T>, connection: T): void {
  const pending = runtime.pending.shift();
  if (!pending) {
    return;
  }

  const pooled = runtime.connections.find((item) => item.connection === connection);
  if (!pooled) {
    runtime.pending.unshift(pending);
    return;
  }

  clearTimeout(pending.timeout);
  runtime.stats.pending--;
  pooled.inUse = true;
  pooled.lastUsedAt = Date.now();
  runtime.stats.available--;
  runtime.stats.acquired++;
  runtime.options.onAcquire?.(connection);
  pending.resolve(connection);
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

export async function destroyConnection<T>(
  runtime: ConnectionPoolRuntime<T>,
  pooled: PooledConnection<T>
): Promise<void> {
  const index = runtime.connections.indexOf(pooled);
  if (index !== -1) {
    runtime.connections.splice(index, 1);
  }

  if (runtime.options.destroyer) {
    await runtime.options.destroyer(pooled.connection);
  }

  runtime.options.onDestroy?.(pooled.connection);
  runtime.stats.destroyed++;
  runtime.stats.size--;
  if (!pooled.inUse) {
    runtime.stats.available--;
  }
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
