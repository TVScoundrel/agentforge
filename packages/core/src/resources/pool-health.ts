import type { ConnectionPoolRuntime } from './pool-types.js';
import { destroyConnection, getHealthCheckConfig } from './pool-runtime.js';

export async function performHealthChecks<T>(runtime: ConnectionPoolRuntime<T>): Promise<void> {
  if (!runtime.options.validator) {
    return;
  }

  const healthCheck = getHealthCheckConfig(runtime);
  const timeout = healthCheck.timeout || 5000;
  const retries = healthCheck.retries || 1;

  for (const pooled of [...runtime.connections]) {
    if (pooled.inUse) {
      continue;
    }

    let healthy = false;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await Promise.race([
          runtime.options.validator(pooled.connection),
          new Promise<boolean>((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), timeout)
          ),
        ]);
        if (result) {
          healthy = true;
          break;
        }
      } catch {
        // Continue to the next retry.
      }
    }

    if (healthy) {
      runtime.stats.healthChecksPassed++;
      continue;
    }

    runtime.stats.healthChecksFailed++;
    await destroyConnection(runtime, pooled);
  }
}
