import type { TransactionIsolationLevel, TransactionOptions, ResolvedTransactionOptions } from './transaction-types.js';

export function toSqlIsolationLevel(level: TransactionIsolationLevel): string {
  switch (level) {
    case 'read uncommitted':
      return 'READ UNCOMMITTED';
    case 'read committed':
      return 'READ COMMITTED';
    case 'repeatable read':
      return 'REPEATABLE READ';
    case 'serializable':
      return 'SERIALIZABLE';
  }
}

export function resolveTransactionOptions(options?: TransactionOptions): ResolvedTransactionOptions {
  if (!options) {
    return {};
  }

  if (options.timeoutMs !== undefined && (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0)) {
    throw new Error('Transaction timeout must be a positive number');
  }

  return {
    isolationLevel: options.isolationLevel,
    timeoutMs: options.timeoutMs,
  };
}

export function withTransactionTimeout<T>(
  operation: Promise<T>,
  timeoutMs?: number,
  onTimeout?: () => void
): Promise<T> {
  if (!timeoutMs) {
    return operation;
  }

  return new Promise<T>((resolve, reject) => {
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      onTimeout?.();
      reject(new Error(`Transaction timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    operation
      .then((result) => {
        if (timedOut) {
          return;
        }
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        if (timedOut) {
          return;
        }
        clearTimeout(timer);
        reject(error);
      });
  });
}
