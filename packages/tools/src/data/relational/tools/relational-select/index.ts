/**
 * Relational SELECT Tool
 * 
 * Type-safe SELECT operations using Drizzle ORM query builder.
 * Supports WHERE conditions, ORDER BY, LIMIT, and OFFSET.
 * 
 * @module tools/relational-select
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { ConnectionManager } from '../../connection/connection-manager.js';
import { relationalSelectSchema } from './schemas.js';
import { executeSelect } from './executor.js';
import type { RelationalSelectInput, SelectResponse } from './types.js';

// Re-export types and schemas for external use
export * from './types.js';
export * from './schemas.js';

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
  .implement(async (input: RelationalSelectInput): Promise<SelectResponse> => {
    const manager = new ConnectionManager({
      vendor: input.vendor,
      connection: input.connectionString
    });

    try {
      // Connect to database
      await manager.connect();

      // Build and execute SELECT query
      const result = await executeSelect(manager, input);

      // Return formatted result
      return {
        success: true,
        rows: result.rows,
        rowCount: result.rowCount,
        executionTime: result.executionTime
      };
    } catch (error) {
      // Log detailed error but return a generic message to avoid leaking sensitive information
      const logger = await import('@agentforge/core').then(m => m.createLogger('agentforge:tools:data:relational:select'));
      logger.error('Relational SELECT execution failed', { error });
      return {
        success: false,
        error: 'Failed to execute SELECT query. Please verify your input and database connection.',
        rows: [],
        rowCount: 0
      };
    } finally {
      // Always disconnect
      await manager.disconnect();
    }
  })
  .build();

