import { sql, type SQL } from 'drizzle-orm';
import type { DatabaseVendor } from '../types.js';
import type { ConnectionConfig } from './types.js';
import {
  ConnectionState,
  shutdownClient,
  type ReconnectionConfig,
} from './lifecycle.js';
import {
  initializeVendorConnection,
  SAFE_INITIALIZATION_PATTERNS,
} from './vendor-initialization.js';

type LoggerLike = {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
};

export type ConnectionPoolMetrics = {
  totalCount: number;
  activeCount: number;
  idleCount: number;
  waitingCount: number;
};

export type ConnectionManagerRuntime = {
  vendor: DatabaseVendor;
  config: ConnectionConfig;
  getState(): ConnectionState;
  setState(state: ConnectionState): void;
  getClient(): unknown;
  setClient(client: unknown): void;
  getDb(): unknown;
  setDb(db: unknown): void;
  emitConnected(): void;
  emitDisconnected(): void;
  emitError(error: Error): void;
  errorListenerCount(): number;
  getReconnectionConfig(): ReconnectionConfig;
  scheduleReconnection(): void;
  resetReconnectionAttempts(): void;
  getConnectionGeneration(): number;
  isHealthy(): Promise<boolean>;
};

export function isSqliteNonQueryError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const isSqliteOrTypeError =
    error.constructor?.name === 'SqliteError' ||
    error.name === 'SqliteError' ||
    error instanceof TypeError;
  const hasNonQueryMessage = error.message.includes('does not return data');
  return isSqliteOrTypeError && hasNonQueryMessage;
}

export async function cleanupConnectionResources(
  vendor: DatabaseVendor,
  client: unknown,
  clearConnection: () => void,
  logger: LoggerLike
): Promise<void> {
  if (!client) {
    return;
  }

  logger.debug('Cleaning up cancelled connection', {
    vendor,
  });

  try {
    await shutdownClient(vendor, client);
  } catch (error) {
    logger.debug('Error during cancelled connection cleanup', {
      vendor,
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    clearConnection();
  }
}

export async function initializeManagedConnection(
  runtime: ConnectionManagerRuntime,
  logger: LoggerLike
): Promise<void> {
  const startTime = Date.now();
  const currentGeneration = runtime.getConnectionGeneration();

  if (runtime.getState() === ConnectionState.CONNECTED && runtime.getClient()) {
    logger.warn('Re-initializing an already connected manager; emitting disconnected before cleanup', {
      vendor: runtime.vendor,
    });
    runtime.setState(ConnectionState.DISCONNECTED);
    runtime.emitDisconnected();
    await cleanupConnectionResources(
      runtime.vendor,
      runtime.getClient(),
      () => {
        runtime.setClient(null);
        runtime.setDb(null);
      },
      logger
    );
  }

  runtime.setState(ConnectionState.CONNECTING);

  logger.info('Initializing database connection', {
    vendor: runtime.vendor,
    connectionType: typeof runtime.config.connection,
    state: runtime.getState(),
  });

  try {
    const initialized = await initializeVendorConnection(runtime.config);
    runtime.setClient(initialized.client);
    runtime.setDb(initialized.db);

    if (currentGeneration !== runtime.getConnectionGeneration()) {
      logger.debug('Connection cancelled during initialization', {
        vendor: runtime.vendor,
        currentGeneration,
        newGeneration: runtime.getConnectionGeneration(),
      });
      await cleanupConnectionResources(
        runtime.vendor,
        runtime.getClient(),
        () => {
          runtime.setClient(null);
          runtime.setDb(null);
        },
        logger
      );
      runtime.setState(ConnectionState.DISCONNECTED);
      throw new Error('Connection cancelled during initialization');
    }

    logger.debug('Validating connection health', { vendor: runtime.vendor });
    const healthy = await runtime.isHealthy();
    if (!healthy) {
      throw new Error(`Failed to establish healthy connection to ${runtime.vendor} database`);
    }

    if (currentGeneration !== runtime.getConnectionGeneration()) {
      logger.debug('Connection cancelled during health check', {
        vendor: runtime.vendor,
        currentGeneration,
        newGeneration: runtime.getConnectionGeneration(),
      });
      await cleanupConnectionResources(
        runtime.vendor,
        runtime.getClient(),
        () => {
          runtime.setClient(null);
          runtime.setDb(null);
        },
        logger
      );
      runtime.setState(ConnectionState.DISCONNECTED);
      throw new Error('Connection cancelled during health check');
    }

    runtime.setState(ConnectionState.CONNECTED);
    runtime.emitConnected();
    runtime.resetReconnectionAttempts();

    logger.info('Database connection initialized successfully', {
      vendor: runtime.vendor,
      duration: Date.now() - startTime,
      state: runtime.getState(),
    });
  } catch (error) {
    const errorMessage = `Failed to initialize ${runtime.vendor} connection`;
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    const isValidationError = SAFE_INITIALIZATION_PATTERNS.some((pattern) =>
      normalizedError.message.includes(pattern)
    );

    if (isValidationError) {
      runtime.setState(ConnectionState.ERROR);
      throw normalizedError;
    }

    const isCancellation = normalizedError.message.includes('Connection cancelled');

    if (!isCancellation) {
      runtime.setState(ConnectionState.ERROR);
      if (runtime.errorListenerCount() > 0) {
        runtime.emitError(normalizedError);
      }

      logger.error(errorMessage, {
        vendor: runtime.vendor,
        error: normalizedError.message,
        duration: Date.now() - startTime,
        state: runtime.getState(),
      });

      await cleanupConnectionResources(
        runtime.vendor,
        runtime.getClient(),
        () => {
          runtime.setClient(null);
          runtime.setDb(null);
        },
        logger
      );

      if (
        runtime.getReconnectionConfig().enabled &&
        currentGeneration === runtime.getConnectionGeneration()
      ) {
        runtime.scheduleReconnection();
      }
    } else {
      logger.debug('Connection initialization cancelled', {
        vendor: runtime.vendor,
        duration: Date.now() - startTime,
        state: runtime.getState(),
      });
    }

    if (error instanceof Error) {
      throw new Error(errorMessage, { cause: error });
    }
    throw new Error(`${errorMessage}: ${String(error)}`);
  }
}

export async function closeManagedConnection(
  runtime: Pick<
    ConnectionManagerRuntime,
    | 'vendor'
    | 'getState'
    | 'setState'
    | 'getClient'
    | 'setClient'
    | 'setDb'
    | 'emitDisconnected'
    | 'emitError'
  >,
  logger: LoggerLike
): Promise<void> {
  const client = runtime.getClient();

  if (client) {
    logger.info('Closing database connection', {
      vendor: runtime.vendor,
      state: runtime.getState(),
    });

    try {
      await shutdownClient(runtime.vendor, client);
      runtime.setState(ConnectionState.DISCONNECTED);
      runtime.emitDisconnected();

      logger.debug('Database connection closed successfully', {
        vendor: runtime.vendor,
        state: runtime.getState(),
      });
    } catch (error) {
      logger.error('Error closing database connection', {
        vendor: runtime.vendor,
        error: error instanceof Error ? error.message : String(error),
        state: runtime.getState(),
      });

      const normalizedError = error instanceof Error ? error : new Error(String(error));
      runtime.setState(ConnectionState.ERROR);
      runtime.emitError(normalizedError);
    } finally {
      runtime.setClient(null);
      runtime.setDb(null);
    }
  } else if (runtime.getState() !== ConnectionState.DISCONNECTED) {
    runtime.setState(ConnectionState.DISCONNECTED);
    runtime.emitDisconnected();
  }
}

export async function checkConnectionHealth(
  args: {
    vendor: DatabaseVendor;
    db: unknown;
    client: unknown;
    execute(query: SQL): Promise<unknown>;
  },
  logger: LoggerLike
): Promise<boolean> {
  if (!args.db || !args.client) {
    logger.debug('Health check failed: connection not initialized', { vendor: args.vendor });
    return false;
  }

  try {
    await args.execute(sql`SELECT 1`);
    logger.debug('Health check passed', { vendor: args.vendor });
    return true;
  } catch (error) {
    logger.debug('Health check failed', {
      vendor: args.vendor,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export function getConnectionPoolMetrics(
  vendor: DatabaseVendor,
  client: unknown
): ConnectionPoolMetrics {
  if (!client) {
    return { totalCount: 0, activeCount: 0, idleCount: 0, waitingCount: 0 };
  }

  if (vendor === 'postgresql') {
    const pgClient = client as {
      totalCount?: number;
      idleCount?: number;
      waitingCount?: number;
    };
    const totalCount = pgClient.totalCount || 0;
    const idleCount = pgClient.idleCount || 0;
    const waitingCount = pgClient.waitingCount || 0;
    const activeCount = Math.max(totalCount - idleCount, 0);

    return {
      totalCount,
      activeCount,
      idleCount,
      waitingCount,
    };
  }

  if (vendor === 'mysql') {
    return {
      totalCount: 0,
      activeCount: 0,
      idleCount: 0,
      waitingCount: 0,
    };
  }

  const sqliteClient = client as { open?: boolean };
  const totalCount = sqliteClient.open ? 1 : 0;

  return {
    totalCount,
    activeCount: totalCount,
    idleCount: 0,
    waitingCount: 0,
  };
}
