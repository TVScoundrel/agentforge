/**
 * Query executor for relational SELECT operations
 * @module tools/relational-select/executor
 */

import { createLogger } from '@agentforge/core';
import type { ConnectionManager } from '../../connection/connection-manager.js';
import type { RelationalSelectInput, SelectResult } from './types.js';
import { buildSelectQuery } from './query-builder.js';

const logger = createLogger('agentforge:tools:data:relational:select');

/**
 * Execute a SELECT query using Drizzle query builder
 */
export async function executeSelect(
  manager: ConnectionManager,
  input: RelationalSelectInput
): Promise<SelectResult> {
  const startTime = Date.now();

  logger.debug('Building SELECT query', {
    vendor: input.vendor,
    table: input.table,
    hasWhere: !!input.where,
    hasOrderBy: !!input.orderBy,
    hasLimit: !!input.limit
  });

  try {
    // Build SELECT query
    const query = buildSelectQuery(input);

    // Execute query
    const result = await manager.execute(query);

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
    if (error instanceof Error) {
      const message = error.message;
      if (message.includes('must not be empty') ||
          message.includes('contains invalid characters') ||
          message.includes('requires an array value') ||
          message.includes('requires a non-empty array value') ||
          message.includes('null is only allowed with isNull/isNotNull operators') ||
          message.includes('LIKE operator requires a string value') ||
          message.includes('operator requires a string or number value') ||
          message.includes('operator requires a scalar value')) {
        throw error;
      }
    }

    // Sanitize database/driver failures while preserving root cause for diagnostics.
    throw new Error('SELECT query failed. See logs for details.', { cause: error });
  }
}
