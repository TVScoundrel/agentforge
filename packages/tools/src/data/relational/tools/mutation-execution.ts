import type { TransactionContext } from '../query/transaction.js';
import type { SqlExecutor } from '../query/types.js';
import type { DatabaseVendor } from '../types.js';

/** Runtime dependencies supplied by a session-owning Relational Tool Set. */
export interface RelationalMutationExecution extends RelationalMutationExecutionContext {
  executor: SqlExecutor;
  vendor: DatabaseVendor;
}

/** Optional active transaction shared by the three Relational Mutation adapters. */
export interface RelationalMutationExecutionContext {
  transaction?: TransactionContext;
}

/** Structural input contract; operation-specific schemas remain the public owners. */
export interface MutationBatchOptions {
  enabled?: boolean;
  batchSize?: number;
  continueOnError?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
  benchmark?: boolean;
}

export type ResolvedMutationBatchOptions = Required<MutationBatchOptions>;

export function resolveBatchOptions(
  batch: MutationBatchOptions | undefined
): ResolvedMutationBatchOptions | undefined {
  if (!batch || batch.enabled === false) {
    return undefined;
  }

  return {
    enabled: batch.enabled ?? true,
    batchSize: batch.batchSize ?? 100,
    continueOnError: batch.continueOnError ?? true,
    maxRetries: batch.maxRetries ?? 0,
    retryDelayMs: batch.retryDelayMs ?? 0,
    benchmark: batch.benchmark ?? false,
  };
}

export interface NormalizedExecutionResult {
  rows: unknown[];
  rowCount: number;
  insertId?: number;
  lastInsertRowid?: number;
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeExecutionResult(result: unknown): NormalizedExecutionResult {
  if (Array.isArray(result)) {
    if (result.length > 0 && isPlainObject(result[0])) {
      const first = result[0];
      const affectedRows = toNumber(first.affectedRows) ?? toNumber(first.rowCount) ?? toNumber(first.changes);
      const insertId = toNumber(first.insertId);
      const lastInsertRowid = toNumber(first.lastInsertRowid);

      if (affectedRows !== undefined || insertId !== undefined || lastInsertRowid !== undefined) {
        // Identifier metadata is not a returned row or evidence of an affected count.
        // Without a reported count, use zero rather than the metadata array's length.
        return {
          rows: [],
          rowCount: affectedRows ?? 0,
          insertId,
          lastInsertRowid,
        };
      }
    }

    return {
      rows: result,
      rowCount: result.length,
    };
  }

  if (isPlainObject(result)) {
    const rows = Array.isArray(result.rows) ? result.rows : [];
    const rowCount = toNumber(result.rowCount)
      ?? toNumber(result.affectedRows)
      ?? toNumber(result.changes)
      ?? rows.length;

    return {
      rows,
      rowCount,
      insertId: toNumber(result.insertId),
      lastInsertRowid: toNumber(result.lastInsertRowid),
    };
  }

  return {
    rows: [],
    rowCount: 0,
  };
}
