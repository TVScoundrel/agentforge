/**
 * Relational INSERT Tool
 *
 * Type-safe INSERT operations using Drizzle ORM query builder.
 * Supports single-row and batch inserts with configurable return behavior.
 *
 * @module tools/relational-insert
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { ConnectionManager } from '../../connection/connection-manager.js';
import { relationalInsertSchema } from './schemas.js';
import { executeInsert } from './executor.js';
import type { InsertResponse, RelationalInsertInput } from './types.js';
import { isSafeInsertError } from './error-utils.js';

// Re-export types and schemas for external use
export * from './types.js';
export * from './schemas.js';

/**
 * Relational INSERT Tool
 *
 * Execute type-safe INSERT queries using Drizzle ORM query builder.
 */
export const relationalInsert = toolBuilder()
  .name('relational-insert')
  .displayName('Relational INSERT')
  .description('Execute type-safe INSERT queries with single-row and batch insert support')
  .category(ToolCategory.DATABASE)
  .tags(['database', 'sql', 'insert', 'postgresql', 'mysql', 'sqlite'])
  .schema(relationalInsertSchema)
  .example({
    description: 'Insert a single row and return generated ID',
    input: {
      table: 'users',
      data: { name: 'Alice', email: 'alice@example.com' },
      returning: { mode: 'id', idColumn: 'id' },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/mydb',
    },
  })
  .example({
    description: 'Batch insert rows',
    input: {
      table: 'users',
      data: [
        { name: 'Bob', email: 'bob@example.com' },
        { name: 'Carol', email: 'carol@example.com' },
      ],
      vendor: 'sqlite',
      connectionString: 'data.db',
    },
  })
  .implement(async (input: RelationalInsertInput): Promise<InsertResponse> => {
    const manager = new ConnectionManager({
      vendor: input.vendor,
      connection: input.connectionString,
    });

    try {
      await manager.connect();

      const result = await executeInsert(manager, input);

      return {
        success: true,
        rowCount: result.rowCount,
        insertedIds: result.insertedIds,
        rows: result.rows,
        executionTime: result.executionTime,
      };
    } catch (error) {
      let errorMessage = 'Failed to execute INSERT query. Please verify your input and database connection.';

      if (isSafeInsertError(error)) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        rowCount: 0,
        insertedIds: [],
        rows: [],
      };
    } finally {
      await manager.disconnect();
    }
  })
  .build();
