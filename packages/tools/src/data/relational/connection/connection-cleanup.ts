import type { DatabaseVendor } from '../types.js';
import { ConnectionState, shutdownClient } from './lifecycle.js';
import type { ConnectionManagerRuntime, LoggerLike } from './connection-manager-runtime-types.js';

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
