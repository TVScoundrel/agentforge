import { ConnectionState } from './lifecycle.js';
import type { ConnectionManagerRuntime, LoggerLike } from './connection-manager-runtime-types.js';
import { cleanupConnectionResources } from './connection-cleanup.js';
import {
  initializeVendorConnection,
  SAFE_INITIALIZATION_PATTERNS,
} from './vendor-initialization.js';

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
