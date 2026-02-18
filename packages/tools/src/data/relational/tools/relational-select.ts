/**
 * Relational SELECT Tool
 * 
 * Type-safe SELECT operations using Drizzle ORM query builder.
 * Supports WHERE conditions, ORDER BY, LIMIT, and OFFSET.
 * 
 * @module tools/relational-select
 */

import { z } from 'zod';
import { toolBuilder, ToolCategory, createLogger } from '@agentforge/core';
import { sql, type SQL } from 'drizzle-orm';
import { ConnectionManager } from '../connection/connection-manager.js';

const logger = createLogger('agentforge:tools:data:relational:select');

/**
 * WHERE condition operator types
 */
const whereOperatorSchema = z.enum([
  'eq',      // equals
  'ne',      // not equals
  'gt',      // greater than
  'lt',      // less than
  'gte',     // greater than or equal
  'lte',     // less than or equal
  'like',    // LIKE pattern matching
  'in',      // IN array
  'notIn',   // NOT IN array
  'isNull',  // IS NULL
  'isNotNull' // IS NOT NULL
]);

/**
 * WHERE condition schema
 */
const whereConditionSchema = z.object({
  column: z.string().describe('Column name to filter on'),
  operator: whereOperatorSchema.describe('Comparison operator'),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number()])),
    z.null()
  ]).optional().describe('Value to compare against (not required for isNull/isNotNull)')
});

/**
 * ORDER BY direction
 */
const orderDirectionSchema = z.enum(['asc', 'desc']);

/**
 * ORDER BY clause schema
 */
const orderBySchema = z.object({
  column: z.string().describe('Column name to order by'),
  direction: orderDirectionSchema.describe('Sort direction (ascending or descending)')
});

/**
 * Relational SELECT tool input schema
 */
const relationalSelectSchema = z.object({
  table: z.string().describe('Table name to select from'),
  columns: z.array(z.string()).optional().describe('Columns to select (omit for SELECT *)'),
  where: z.array(whereConditionSchema).optional().describe('WHERE conditions (combined with AND)'),
  orderBy: z.array(orderBySchema).optional().describe('ORDER BY clauses'),
  limit: z.number().int().positive().optional().describe('Maximum number of rows to return'),
  offset: z.number().int().nonnegative().optional().describe('Number of rows to skip'),
  vendor: z.enum(['postgresql', 'mysql', 'sqlite']).describe('Database vendor'),
  connectionString: z.string().describe('Database connection string')
});

type RelationalSelectInput = z.infer<typeof relationalSelectSchema>;

/**
 * Execute a SELECT query using Drizzle query builder
 */
async function executeSelect(
  manager: ConnectionManager,
  input: RelationalSelectInput
): Promise<{ rows: unknown[]; rowCount: number; executionTime: number }> {
  const startTime = Date.now();

  logger.debug('Building SELECT query', {
    vendor: input.vendor,
    table: input.table,
    hasWhere: !!input.where,
    hasOrderBy: !!input.orderBy,
    hasLimit: !!input.limit
  });

  try {
    // Build SELECT query using Drizzle's sql template
    // Since we don't have table schema definitions at runtime, we use sql`` for dynamic queries
    let query = sql.raw('SELECT ');

    // Add columns
    if (input.columns && input.columns.length > 0) {
      query = sql.join([query, sql.raw(input.columns.map(c => `"${c}"`).join(', '))], sql.raw(''));
    } else {
      query = sql.join([query, sql.raw('*')], sql.raw(''));
    }

    // Add FROM clause
    query = sql.join([query, sql.raw(` FROM "${input.table}"`)], sql.raw(''));

    // Add WHERE conditions
    if (input.where && input.where.length > 0) {
      const whereConditions: SQL[] = [];

      for (const condition of input.where) {
        const column = sql.raw(`"${condition.column}"`);

        switch (condition.operator) {
          case 'eq':
            whereConditions.push(sql`${column} = ${condition.value}`);
            break;
          case 'ne':
            whereConditions.push(sql`${column} != ${condition.value}`);
            break;
          case 'gt':
            whereConditions.push(sql`${column} > ${condition.value}`);
            break;
          case 'lt':
            whereConditions.push(sql`${column} < ${condition.value}`);
            break;
          case 'gte':
            whereConditions.push(sql`${column} >= ${condition.value}`);
            break;
          case 'lte':
            whereConditions.push(sql`${column} <= ${condition.value}`);
            break;
          case 'like':
            whereConditions.push(sql`${column} LIKE ${condition.value}`);
            break;
          case 'in':
            if (!Array.isArray(condition.value)) {
              throw new Error(`IN operator requires an array value for column ${condition.column}`);
            }
            whereConditions.push(sql`${column} IN ${condition.value}`);
            break;
          case 'notIn':
            if (!Array.isArray(condition.value)) {
              throw new Error(`NOT IN operator requires an array value for column ${condition.column}`);
            }
            whereConditions.push(sql`${column} NOT IN ${condition.value}`);
            break;
          case 'isNull':
            whereConditions.push(sql`${column} IS NULL`);
            break;
          case 'isNotNull':
            whereConditions.push(sql`${column} IS NOT NULL`);
            break;
        }
      }

      if (whereConditions.length > 0) {
        query = sql.join([query, sql.raw(' WHERE '), sql.join(whereConditions, sql.raw(' AND '))], sql.raw(''));
      }
    }

    // Add ORDER BY
    if (input.orderBy && input.orderBy.length > 0) {
      const orderClauses = input.orderBy.map(order => {
        const direction = order.direction.toUpperCase();
        return sql.raw(`"${order.column}" ${direction}`);
      });
      query = sql.join([query, sql.raw(' ORDER BY '), sql.join(orderClauses, sql.raw(', '))], sql.raw(''));
    }

    // Add LIMIT
    if (input.limit !== undefined) {
      query = sql.join([query, sql` LIMIT ${input.limit}`], sql.raw(''));
    }

    // Add OFFSET
    if (input.offset !== undefined) {
      query = sql.join([query, sql` OFFSET ${input.offset}`], sql.raw(''));
    }

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

    // Provide clear error messages
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`SELECT query failed: ${String(error)}`);
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
  .implement(async (input: RelationalSelectInput) => {
    const manager = new ConnectionManager({
      vendor: input.vendor,
      connection: input.connectionString
    });

    try {
      // Initialize connection
      await manager.initialize();

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
      // Return error with clear message
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        rows: [],
        rowCount: 0
      };
    } finally {
      // Always close connection
      await manager.close();
    }
  })
  .build();

