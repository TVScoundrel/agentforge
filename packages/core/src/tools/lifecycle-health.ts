import type { ManagedToolState } from './lifecycle-internal-types.js';
import type { ToolHealthCheckResult } from './lifecycle-types.js';
import { getErrorMessage } from './lifecycle-error.js';

function setHealthStats<TContext>(
  state: ManagedToolState<TContext>,
  result: ToolHealthCheckResult
): void {
  state.stats.lastHealthCheck = result;
  state.stats.lastHealthCheckTime = Date.now();
}

function isLifecycleStale<TContext>(
  state: ManagedToolState<TContext>,
  lifecycleGeneration: number
): boolean {
  return !state.initialized || state.cleaningUp || state.lifecycleGeneration !== lifecycleGeneration;
}

export async function runManagedHealthCheck<TContext>(
  state: ManagedToolState<TContext>,
  healthCheckFn?: () => Promise<ToolHealthCheckResult>
): Promise<ToolHealthCheckResult> {
  if (!state.initialized || state.cleaningUp) {
    return {
      healthy: false,
      error: 'Tool is not initialized',
    };
  }

  if (!healthCheckFn) {
    return {
      healthy: true,
      metadata: { message: 'No health check configured' },
    };
  }

  const lifecycleGeneration = state.lifecycleGeneration;

  try {
    const result = await healthCheckFn();
    if (isLifecycleStale(state, lifecycleGeneration)) {
      return {
        healthy: false,
        error: 'Tool is not initialized',
      };
    }

    setHealthStats(state, result);
    return result;
  } catch (error) {
    if (isLifecycleStale(state, lifecycleGeneration)) {
      return {
        healthy: false,
        error: 'Tool is not initialized',
      };
    }

    const result: ToolHealthCheckResult = {
      healthy: false,
      error: getErrorMessage(error),
    };
    setHealthStats(state, result);
    return result;
  }
}

export async function runPeriodicManagedHealthCheck<TContext>(
  state: ManagedToolState<TContext>,
  healthCheckFn?: () => Promise<ToolHealthCheckResult>
): Promise<void> {
  if (!healthCheckFn || state.healthCheckInFlight || !state.initialized || state.cleaningUp) {
    return;
  }

  state.healthCheckInFlight = true;
  const lifecycleGeneration = state.lifecycleGeneration;

  try {
    const result = await healthCheckFn();
    if (!isLifecycleStale(state, lifecycleGeneration)) {
      setHealthStats(state, result);
    }
  } catch (error) {
    if (!isLifecycleStale(state, lifecycleGeneration)) {
      setHealthStats(state, {
        healthy: false,
        error: getErrorMessage(error),
      });
    }
  } finally {
    state.healthCheckInFlight = false;
  }
}
