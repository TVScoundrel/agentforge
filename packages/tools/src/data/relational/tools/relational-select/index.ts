/**
 * Relational SELECT Tool
 * 
 * Type-safe SELECT operations using Drizzle ORM query builder.
 * Supports WHERE conditions, ORDER BY, LIMIT, and OFFSET.
 * 
 * @module tools/relational-select
 */

import { createLogger, toolBuilder, ToolCategory } from '@agentforge/core';
import { ConnectionManager } from '../../connection/connection-manager.js';
import { relationalSelectSchema } from './schemas.js';
import { executeSelect } from './executor.js';
import type {
  RelationalSelectInput,
  RelationalSelectOperationInput,
  SelectErrorResponse,
  SelectResponse,
} from './types.js';
import { isSafeValidationError } from './error-utils.js';
import type { RelationalReadExecution } from '../read-execution.js';

const logger = createLogger('agentforge:tools:data:relational:select');

// Re-export types and schemas for external use
export * from './types.js';
export * from './schemas.js';

function toSelectErrorResponse(error: unknown): SelectErrorResponse {
  const errorMessage = isSafeValidationError(error)
    ? error.message
    : 'Failed to execute SELECT query. Please verify your input and database connection.';

  return {
    success: false,
    error: errorMessage,
    rows: [],
    rowCount: 0,
  };
}

/** Execute SELECT through a session owned by the caller. */
export async function invokeRelationalSelect(
  execution: RelationalReadExecution,
  input: RelationalSelectOperationInput,
): Promise<SelectResponse> {
  try {
    const result = await executeSelect(
      execution.executor,
      { ...input, vendor: execution.vendor },
      execution.transaction ? { transaction: execution.transaction } : undefined,
    );

    return {
      success: true,
      rows: result.rows,
      rowCount: result.rowCount,
      executionTime: result.executionTime,
      streaming: result.streaming,
    };
  } catch (error) {
    return toSelectErrorResponse(error);
  }
}

/**
 * Relational SELECT Tool
 * 
 * Execute type-safe SELECT queries using Drizzle ORM query builder.
 * 
 * Features:
 * - Type-safe column selection
 * - WHERE conditions with multiple operators
 * - ORDER BY with ascending/descending
 * - LIMIT and OFFSET for pagination
 * - Optional chunked streaming mode for large result sets
 * - Result formatting to JSON
 * - Error handling with clear messages
 * 
 * @example
 * ```typescript
 * // SELECT with WHERE and ORDER BY
 * const result = await relationalSelect.invoke({
 *   table: 'users',
 *   columns: ['id', 'name', 'email'],
 *   where: [
 *     { column: 'status', operator: 'eq', value: 'active' },
 *     { column: 'age', operator: 'gte', value: 18 }
 *   ],
 *   orderBy: [{ column: 'name', direction: 'asc' }],
 *   limit: 10,
 *   vendor: 'postgresql',
 *   connectionString: 'postgresql://user:pass@localhost:5432/mydb'
 * });
 * ```
 */
export const relationalSelect = toolBuilder()
  .name('relational-select')
  .displayName('Relational SELECT')
  .description('Execute type-safe SELECT queries with WHERE conditions, ORDER BY, LIMIT, and OFFSET using Drizzle ORM query builder')
  .category(ToolCategory.DATABASE)
  .tags(['database', 'sql', 'select', 'query', 'postgresql', 'mysql', 'sqlite'])
  .schema(relationalSelectSchema)
  .example({
    description: 'SELECT with WHERE condition',
    input: {
      table: 'users',
      columns: ['id', 'name', 'email'],
      where: [{ column: 'status', operator: 'eq', value: 'active' }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/mydb'
    }
  })
  .example({
    description: 'SELECT with pagination',
    input: {
      table: 'products',
      orderBy: [{ column: 'created_at', direction: 'desc' }],
      limit: 20,
      offset: 0,
      vendor: 'mysql',
      connectionString: 'mysql://localhost/shop'
    }
  })
  .example({
    description: 'SELECT with streaming mode',
    input: {
      table: 'events',
      orderBy: [{ column: 'id', direction: 'asc' }],
      streaming: {
        enabled: true,
        chunkSize: 250,
        sampleSize: 25
      },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/analytics'
    }
  })
  .implement(async (input: RelationalSelectInput): Promise<SelectResponse> => {
    const { connectionString, vendor, ...operation } = input;
    const manager = new ConnectionManager({
      vendor,
      connection: connectionString,
    });

    try {
      // Connect to database
      await manager.connect();

      return await invokeRelationalSelect({ executor: manager, vendor }, operation);
    } catch (error) {
      logger.error('Relational SELECT connection initialization failed', {
        vendor,
        error: error instanceof Error ? error.message : String(error),
      });
      return toSelectErrorResponse(error);
    } finally {
      // Always disconnect
      await manager.disconnect();
    }
  })
  .build();
