/**
 * Query executor for relational SELECT operations
 * @module tools/relational-select/executor
 */

import { createLogger } from '@agentforge/core';
import type { ConnectionManager } from '../../connection/connection-manager.js';
import type { TransactionContext } from '../../query/transaction.js';
import {
  DEFAULT_CHUNK_SIZE,
  executeStreamingSelect,
  benchmarkStreamingSelectMemory,
  type SelectQueryInput,
} from '../../query/index.js';
import type { RelationalSelectInput, SelectResult } from './types.js';
import { buildSelectQuery } from './query-builder.js';
import { isSafeValidationError } from './error-utils.js';

const logger = createLogger('agentforge:tools:data:relational:select');

export interface SelectExecutionContext {
  transaction?: TransactionContext;
}

function toSelectQueryInput(input: RelationalSelectInput): SelectQueryInput {
  return {
    table: input.table,
    columns: input.columns,
    where: input.where,
    orderBy: input.orderBy,
    limit: input.limit,
    offset: input.offset,
    vendor: input.vendor,
  };
}

/**
 * Execute a SELECT query using Drizzle query builder
 */
export async function executeSelect(
  manager: ConnectionManager,
  input: RelationalSelectInput,
  context?: SelectExecutionContext
): Promise<SelectResult> {
  const startTime = Date.now();

  logger.debug('Building SELECT query', {
    vendor: input.vendor,
    table: input.table,
    hasWhere: !!input.where,
    hasOrderBy: !!input.orderBy,
    hasLimit: !!input.limit,
    streamingEnabled: !!input.streaming?.enabled,
  });

  try {
    if (input.streaming?.enabled) {
      const streamOptions = {
        chunkSize: input.streaming.chunkSize,
        maxRows: input.streaming.maxRows,
        sampleSize: input.streaming.sampleSize,
      };

      const streamInput = toSelectQueryInput(input);

      if (input.streaming.benchmark) {
        logger.warn('Streaming benchmark enabled; SELECT will execute up to three times (result + benchmark regular + benchmark streaming).', {
          vendor: input.vendor,
          table: input.table,
          chunkSize: streamOptions.chunkSize ?? DEFAULT_CHUNK_SIZE,
          maxRows: streamOptions.maxRows,
          sampleSize: streamOptions.sampleSize,
        });
      }

      const streamResult = await executeStreamingSelect(manager, streamInput, streamOptions);

      const benchmark = input.streaming.benchmark
        ? await benchmarkStreamingSelectMemory(manager, streamInput, streamOptions)
        : undefined;

      const executionTime = Date.now() - startTime;

      logger.debug('Streaming SELECT query executed successfully', {
        vendor: input.vendor,
        table: input.table,
        rowCount: streamResult.rowCount,
        chunkCount: streamResult.chunkCount,
        executionTime,
        cancelled: streamResult.cancelled,
      });

      return {
        rows: streamResult.rows,
        rowCount: streamResult.rowCount,
        executionTime,
        streaming: {
          enabled: true,
          chunkSize: input.streaming.chunkSize ?? DEFAULT_CHUNK_SIZE,
          chunkCount: streamResult.chunkCount,
          sampledRowCount: streamResult.rows.length,
          streamedRowCount: streamResult.rowCount,
          cancelled: streamResult.cancelled,
          memoryUsage: streamResult.memoryUsage,
          benchmark,
        },
      };
    }

    // Build SELECT query
    const query = buildSelectQuery(input);

    // Execute query
    const executor = context?.transaction ?? manager;
    const result = await executor.execute(query);

    const executionTime = Date.now() - startTime;

    // Format result
    const rows = Array.isArray(result) ? result : (result as unknown as { rows?: unknown[] }).rows || [];
    const rowCount = rows.length;

    logger.debug('SELECT query executed successfully', {
      vendor: input.vendor,
      table: input.table,
      rowCount,
      executionTime
    });

    return {
      rows,
      rowCount,
      executionTime
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    logger.error('SELECT query execution failed', {
      vendor: input.vendor,
      table: input.table,
      error: error instanceof Error ? error.message : String(error),
      executionTime
    });

    // Let known-safe validation errors propagate so callers can fix bad inputs.
    if (isSafeValidationError(error)) {
      throw error;
    }

    // Sanitize database/driver failures while preserving root cause for diagnostics.
    throw new Error('SELECT query failed. See logs for details.', { cause: error });
  }
}
