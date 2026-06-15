import type { ConnectionPoolRuntime, PooledConnection } from './pool-types.js';
import { destroyConnection, getPoolConfig } from './pool-runtime.js';

function selectIdleConnectionsForEviction<T>(
  runtime: ConnectionPoolRuntime<T>,
  idleTimeout: number,
  min: number,
  now: number
): PooledConnection<T>[] {
  const idleConnections = runtime.connections.filter(
    (connection) => !connection.inUse && now - connection.lastUsedAt > idleTimeout
  );
  const evictableCount = Math.max(0, runtime.connections.length - min);
  return idleConnections.slice(0, evictableCount);
}

export async function evictIdleConnections<T>(runtime: ConnectionPoolRuntime<T>): Promise<void> {
  const poolConfig = getPoolConfig(runtime);
  const idleTimeout = poolConfig.idleTimeout || 60000;
  const min = poolConfig.min || 0;
  const now = Date.now();

  const toEvict = selectIdleConnectionsForEviction(runtime, idleTimeout, min, now);
  for (const pooled of toEvict) {
    await destroyConnection(runtime, pooled);
  }
}
