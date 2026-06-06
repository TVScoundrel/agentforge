import type { Logger } from '../langgraph/observability/logger.js';
import type { ManagedToolState } from './lifecycle-internal-types.js';
import type { ToolHealthCheckResult } from './lifecycle-types.js';
import { getErrorMessage } from './lifecycle-error.js';

interface InitializeDeps<TContext> {
  ensureBeforeExitHandler: () => void;
  healthCheckFn?: () => Promise<ToolHealthCheckResult>;
  healthCheckInterval?: number;
  initializeFn?: () => Promise<void>;
  runPeriodicHealthCheck: () => Promise<void>;
  state: ManagedToolState<TContext>;
}

export async function performManagedInitialize<TContext>({
  ensureBeforeExitHandler,
  healthCheckFn,
  healthCheckInterval,
  initializeFn,
  runPeriodicHealthCheck,
  state,
}: InitializeDeps<TContext>): Promise<void> {
  ensureBeforeExitHandler();
  state.lifecycleGeneration++;

  if (initializeFn) {
    await initializeFn();
  }

  state.initialized = true;
  state.stats.initialized = true;

  if (healthCheckInterval && healthCheckFn) {
    state.healthCheckTimer = setInterval(() => {
      void runPeriodicHealthCheck();
    }, healthCheckInterval);
  }
}

interface CleanupDeps<TContext> {
  cleanupFn?: () => Promise<void>;
  state: ManagedToolState<TContext>;
}

export async function performManagedCleanup<TContext>({
  cleanupFn,
  state,
}: CleanupDeps<TContext>): Promise<void> {
  state.cleaningUp = true;

  if (state.healthCheckTimer) {
    clearInterval(state.healthCheckTimer);
    state.healthCheckTimer = undefined;
  }

  if (state.beforeExitHandler) {
    process.off('beforeExit', state.beforeExitHandler);
    state.beforeExitHandler = undefined;
  }

  if (!state.initialized) {
    state.cleaningUp = false;
    return;
  }

  state.initialized = false;
  state.stats.initialized = false;

  if (cleanupFn) {
    try {
      await cleanupFn();
    } finally {
      state.cleaningUp = false;
    }

    return;
  }

  state.cleaningUp = false;
}

interface BeforeExitDeps<TContext> {
  autoCleanup: boolean;
  cleanup: () => Promise<void>;
  logger: Logger;
  name: string;
  state: ManagedToolState<TContext>;
}

export function ensureManagedBeforeExitHandler<TContext>({
  autoCleanup,
  cleanup,
  logger,
  name,
  state,
}: BeforeExitDeps<TContext>): void {
  if (!autoCleanup || state.beforeExitHandler) {
    return;
  }

  state.beforeExitHandler = () => {
    cleanup().catch((err) =>
      logger.error('Cleanup failed', {
        toolName: name,
        error: getErrorMessage(err),
        ...(err instanceof Error && err.stack ? { stack: err.stack } : {}),
      })
    );
  };

  process.on('beforeExit', state.beforeExitHandler);
}
