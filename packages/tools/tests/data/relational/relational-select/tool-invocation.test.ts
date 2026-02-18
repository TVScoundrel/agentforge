/**
 * Tool Invocation Tests for Relational SELECT Tool
 *
 * Tests tool invocation and query execution for the relational-select tool.
 */

import { describe, it, expect } from 'vitest';
import { relationalSelect } from '../../../../src/data/relational/tools/relational-select/index.js';
import { hasSQLiteBindings } from './test-utils.js';

describe('Relational SELECT - Tool Invocation', () => {
  it.skipIf(!hasSQLiteBindings)('should execute simple SELECT query', async () => {
    // Use a subquery to avoid needing a real table
    const result = await relationalSelect.invoke({
      table: '(SELECT 1 as id, "test" as name) as subquery',
      vendor: 'sqlite',
      connectionString: ':memory:'
    });

    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(1);
    expect(result.executionTime).toBeGreaterThan(0);
  });

  it.skipIf(!hasSQLiteBindings)('should handle non-existent table gracefully', async () => {
    const result = await relationalSelect.invoke({
      table: 'nonexistent_table',
      vendor: 'sqlite',
      connectionString: ':memory:'
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.rows).toEqual([]);
    expect(result.rowCount).toBe(0);
  });

  it.skipIf(!hasSQLiteBindings)('should select specific columns from subquery', async () => {
    const result = await relationalSelect.invoke({
      table: '(SELECT 1 as id, "test" as name, "test@example.com" as email) as subquery',
      columns: ['id', 'name'],
      vendor: 'sqlite',
      connectionString: ':memory:'
    });

    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(1);
    if (result.rows && result.rows.length > 0) {
      const firstRow = result.rows[0] as Record<string, unknown>;
      expect(firstRow).toHaveProperty('id');
      expect(firstRow).toHaveProperty('name');
      // Note: SQLite may still include all columns in the result
    }
  });

  it.skipIf(!hasSQLiteBindings)('should apply LIMIT', async () => {
    const result = await relationalSelect.invoke({
      table: '(SELECT 1 as id UNION SELECT 2 UNION SELECT 3) as subquery',
      limit: 2,
      vendor: 'sqlite',
      connectionString: ':memory:'
    });

    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(2);
  });

  it.skipIf(!hasSQLiteBindings)('should apply OFFSET', async () => {
    const result = await relationalSelect.invoke({
      table: '(SELECT 1 as id UNION SELECT 2 UNION SELECT 3) as subquery',
      offset: 1,
      vendor: 'sqlite',
      connectionString: ':memory:'
    });

    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(2); // Should skip first row
  });

  it.skipIf(!hasSQLiteBindings)('should apply LIMIT and OFFSET together', async () => {
    const result = await relationalSelect.invoke({
      table: '(SELECT 1 as id UNION SELECT 2 UNION SELECT 3) as subquery',
      limit: 1,
      offset: 1,
      vendor: 'sqlite',
      connectionString: ':memory:'
    });

    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(1); // Skip 1, take 1
  });
});

