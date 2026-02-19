/**
 * Relational UPDATE Tool
 *
 * Type-safe UPDATE operations using Drizzle ORM query builder.
 * Supports WHERE conditions, full-table update protection, and optimistic locking.
 *
 * @module tools/relational-update
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { ConnectionManager } from '../../connection/connection-manager.js';
import { relationalUpdateSchema } from './schemas.js';
import { executeUpdate } from './executor.js';
import type { RelationalUpdateInput, UpdateResponse } from './types.js';
import { isSafeUpdateError } from './error-utils.js';

// Re-export types and schemas for external use
export * from './types.js';
export * from './schemas.js';

/**
 * Relational UPDATE Tool
 *
 * Execute type-safe UPDATE queries using Drizzle ORM query builder.
 */
export const relationalUpdate = toolBuilder()
  .name('relational-update')
  .displayName('Relational UPDATE')
  .description('Execute type-safe UPDATE queries with WHERE conditions and full-table update protection')
  .category(ToolCategory.DATABASE)
  .tags(['database', 'sql', 'update', 'postgresql', 'mysql', 'sqlite'])
  .schema(relationalUpdateSchema)
  .example({
    description: 'Update one row by condition',
    input: {
      table: 'users',
      data: { status: 'inactive' },
      where: [{ column: 'id', operator: 'eq', value: 123 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/mydb',
    },
  })
  .example({
    description: 'Optimistic lock update',
    input: {
      table: 'users',
      data: { status: 'active' },
      where: [{ column: 'id', operator: 'eq', value: 123 }],
      optimisticLock: { column: 'version', expectedValue: 5 },
      vendor: 'sqlite',
      connectionString: 'data.db',
    },
  })
  .implement(async (input: RelationalUpdateInput): Promise<UpdateResponse> => {
    const manager = new ConnectionManager({
      vendor: input.vendor,
      connection: input.connectionString,
    });

    try {
      await manager.connect();

      const result = await executeUpdate(manager, input);

      return {
        success: true,
        rowCount: result.rowCount,
        executionTime: result.executionTime,
      };
    } catch (error) {
      let errorMessage = 'Failed to execute UPDATE query. Please verify your input and database connection.';

      if (isSafeUpdateError(error)) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        rowCount: 0,
      };
    } finally {
      await manager.disconnect();
    }
  })
  .build();
