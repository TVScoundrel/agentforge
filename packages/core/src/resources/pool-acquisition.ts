import type { ConnectionPoolRuntime } from './pool-types.js';
import { createConnection, destroyConnection, getPoolConfig } from './pool-runtime.js';

export async function acquireConnection<T>(runtime: ConnectionPoolRuntime<T>): Promise<T> {
  if (runtime.draining) {
    throw new Error('Pool is draining');
  }

  const available = runtime.connections.find((connection) => !connection.inUse);
  if (available) {
    available.inUse = true;
    available.lastUsedAt = Date.now();
    runtime.stats.available--;
    runtime.stats.acquired++;
    runtime.options.onAcquire?.(available.connection);
    return available.connection;
  }

  const poolConfig = getPoolConfig(runtime);
  const max = poolConfig.max || 10;
  if (runtime.connections.length + runtime.creating < max) {
    runtime.creating++;
    try {
      const connection = await createConnection(runtime);
      const pooled = runtime.connections.find((item) => item.connection === connection);
      if (!pooled) {
        throw new Error('Newly created connection not found in pool');
      }
      if (runtime.draining) {
        await destroyConnection(runtime, pooled);
        throw new Error('Pool is draining');
      }

      pooled.inUse = true;
      pooled.lastUsedAt = Date.now();
      runtime.stats.available--;
      runtime.stats.acquired++;
      runtime.options.onAcquire?.(connection);
      return connection;
    } finally {
      runtime.creating--;
    }
  }

  return new Promise<T>((resolve, reject) => {
    const timeout = poolConfig.acquireTimeout || 30000;
    const timer = setTimeout(() => {
      const index = runtime.pending.findIndex((pending) => pending.resolve === resolve);
      if (index !== -1) {
        runtime.pending.splice(index, 1);
        runtime.stats.pending--;
      }
      reject(new Error('Acquire timeout'));
    }, timeout);

    runtime.pending.push({ resolve, reject, timeout: timer });
    runtime.stats.pending++;
  });
}

export async function releaseConnection<T>(
  runtime: ConnectionPoolRuntime<T>,
  connection: T
): Promise<void> {
  const pooled = runtime.connections.find((item) => item.connection === connection);
  if (!pooled) {
    throw new Error('Connection not found in pool');
  }

  if (!pooled.inUse) {
    throw new Error('Connection is not in use');
  }

  pooled.inUse = false;
  pooled.lastUsedAt = Date.now();
  runtime.stats.available++;
  runtime.stats.acquired--;
  runtime.options.onRelease?.(connection);

  const pending = runtime.pending.shift();
  if (!pending) {
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
