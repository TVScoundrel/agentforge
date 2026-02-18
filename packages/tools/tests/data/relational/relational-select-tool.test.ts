/**
 * Relational SELECT Tool Tests
 *
 * Unit tests for the relational-select LangGraph tool.
 * Tests tool invocation, schema validation, WHERE conditions, ORDER BY, and pagination.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { relationalSelect } from '../../../src/data/relational/tools/relational-select.js';

/**
 * Check if better-sqlite3 native bindings are available
 * This is used to conditionally skip tests that require SQLite
 */
const hasSQLiteBindings = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3');
    // Try to actually instantiate it with an in-memory database
    const db = new Database(':memory:');
    db.close();
    return true;
  } catch {
    return false;
  }
})();

describe('Relational SELECT Tool', () => {
  describe('Schema Validation', () => {
    it('should accept valid SELECT query', () => {
      const result = relationalSelect.schema.safeParse({
        table: 'users',
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test'
      });

      expect(result.success).toBe(true);
    });

    it('should accept columns array', () => {
      const result = relationalSelect.schema.safeParse({
        table: 'users',
        columns: ['id', 'name', 'email'],
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test'
      });

      expect(result.success).toBe(true);
    });

    it('should accept WHERE conditions', () => {
      const result = relationalSelect.schema.safeParse({
        table: 'users',
        where: [
          { column: 'status', operator: 'eq', value: 'active' },
          { column: 'age', operator: 'gte', value: 18 }
        ],
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test'
      });

      expect(result.success).toBe(true);
    });

    it('should accept ORDER BY clauses', () => {
      const result = relationalSelect.schema.safeParse({
        table: 'users',
        orderBy: [
          { column: 'name', direction: 'asc' },
          { column: 'created_at', direction: 'desc' }
        ],
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test'
      });

      expect(result.success).toBe(true);
    });

    it('should accept LIMIT and OFFSET', () => {
      const result = relationalSelect.schema.safeParse({
        table: 'users',
        limit: 10,
        offset: 20,
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test'
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid vendor', () => {
      const result = relationalSelect.schema.safeParse({
        table: 'users',
        vendor: 'invalid',
        connectionString: 'postgresql://localhost/test'
      });

      expect(result.success).toBe(false);
    });

    it('should reject negative limit', () => {
      const result = relationalSelect.schema.safeParse({
        table: 'users',
        limit: -1,
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test'
      });

      expect(result.success).toBe(false);
    });

    it('should reject negative offset', () => {
      const result = relationalSelect.schema.safeParse({
        table: 'users',
        offset: -1,
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test'
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Tool Invocation', () => {
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
});

