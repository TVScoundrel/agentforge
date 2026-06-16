import type { ConnectionPoolRuntime } from './pool-types.js';
import { destroyConnection } from './pool-runtime.js';

function rejectPendingAcquisitions<T>(runtime: ConnectionPoolRuntime<T>, message: string): void {
  for (const pending of runtime.pending) {
    clearTimeout(pending.timeout);
    pending.reject(new Error(message));
  }
  runtime.pending = [];
  runtime.stats.pending = 0;
}

export async function drainPool<T>(runtime: ConnectionPoolRuntime<T>): Promise<void> {
  runtime.draining = true;
  rejectPendingAcquisitions(runtime, 'Pool is draining');

  while (runtime.connections.some((connection) => connection.inUse)) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

export async function clearPool<T>(runtime: ConnectionPoolRuntime<T>): Promise<void> {
  runtime.draining = true;
  rejectPendingAcquisitions(runtime, 'Pool is draining');

  if (runtime.evictionTimer) {
    clearInterval(runtime.evictionTimer);
    runtime.evictionTimer = undefined;
  }

  if (runtime.healthCheckTimer) {
    clearInterval(runtime.healthCheckTimer);
    runtime.healthCheckTimer = undefined;
  }

  const connections = [...runtime.connections];
  for (const pooled of connections) {
    await destroyConnection(runtime, pooled);
  }
}
