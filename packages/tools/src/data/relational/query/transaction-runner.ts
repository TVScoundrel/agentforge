import { createLogger } from '@agentforge/core';
import type { ConnectionManager } from '../connection/connection-manager.js';
import { ManagedTransaction } from './transaction-managed.js';
import { resolveTransactionOptions, withTransactionTimeout } from './transaction-options.js';
import type { TransactionContext, TransactionOptions } from './transaction-types.js';

const logger = createLogger('agentforge:tools:data:relational:transaction');

let transactionSequence = 0;

export async function withTransaction<T>(
  manager: ConnectionManager,
  operation: (transaction: TransactionContext) => Promise<T>,
  options?: TransactionOptions
): Promise<T> {
  const startTime = Date.now();
  const resolvedOptions = resolveTransactionOptions(options);
  const transactionId = `tx-${++transactionSequence}`;
  const vendor = manager.getVendor();

  logger.debug('Starting transaction', {
    transactionId,
    vendor,
    ...(resolvedOptions.isolationLevel ? { isolationLevel: resolvedOptions.isolationLevel } : {}),
    ...(resolvedOptions.timeoutMs !== undefined ? { timeoutMs: resolvedOptions.timeoutMs } : {}),
  });

  return manager.executeInConnection(async (executeQuery) => {
    const transaction = new ManagedTransaction({
      id: transactionId,
      vendor,
      executeQuery,
      options: resolvedOptions,
    });

    let operationPromise: Promise<T> | undefined;
    let timedOut = false;
    try {
      await transaction.begin();
      operationPromise = operation(transaction);
      const result = await withTransactionTimeout(
        operationPromise,
        resolvedOptions.timeoutMs,
        () => {
          if (resolvedOptions.timeoutMs) {
            timedOut = true;
            transaction.cancel(`Transaction timed out after ${resolvedOptions.timeoutMs}ms`);
          }
        }
      );

      if (transaction.isActive()) {
        await transaction.commit();
      }

      logger.debug('Transaction committed', {
        transactionId,
        vendor,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      if (timedOut && operationPromise) {
        try {
          await operationPromise;
        } catch {
          // Preserve the timeout as the transaction failure after active work drains.
        }
      }

      if (transaction.isActive()) {
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          logger.error('Transaction rollback failed', {
            transactionId,
            vendor,
            error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
          });
        }
      }

      logger.error('Transaction failed', {
        transactionId,
        vendor,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  });
}
