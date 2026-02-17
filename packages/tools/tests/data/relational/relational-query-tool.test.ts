/**
 * Relational Query Tool Tests
 *
 * Unit tests for the relational-query LangGraph tool.
 * Tests tool invocation, schema validation, and error handling.
 */

import { describe, it, expect } from 'vitest';
import { relationalQuery } from '../../../src/data/relational/tools/relational-query.js';

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

describe('Relational Query Tool', () => {
  describe('Tool Metadata', () => {
    it('should have correct metadata', () => {
      expect(relationalQuery.metadata.name).toBe('relational-query');
      expect(relationalQuery.metadata.displayName).toBe('Relational Query');
      expect(relationalQuery.metadata.category).toBe('database');
      expect(relationalQuery.metadata.tags).toContain('sql');
      expect(relationalQuery.metadata.tags).toContain('postgresql');
      expect(relationalQuery.metadata.tags).toContain('mysql');
      expect(relationalQuery.metadata.tags).toContain('sqlite');
    });

    it('should have examples', () => {
      expect(relationalQuery.metadata.examples).toBeDefined();
      expect(relationalQuery.metadata.examples).toHaveLength(3);
    });

    it('should have usage notes', () => {
      expect(relationalQuery.metadata.usageNotes).toBeDefined();
      expect(relationalQuery.metadata.usageNotes).toContain('parameter binding');
    });

    it('should have limitations', () => {
      expect(relationalQuery.metadata.limitations).toBeDefined();
      expect(relationalQuery.metadata.limitations?.length).toBeGreaterThan(0);
    });
  });

  describe('Schema Validation', () => {
    it('should validate required fields', () => {
      const result = relationalQuery.schema.safeParse({
        sql: 'SELECT 1',
        vendor: 'sqlite'
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid vendor', () => {
      const result = relationalQuery.schema.safeParse({
        sql: 'SELECT 1',
        vendor: 'invalid'
      });

      expect(result.success).toBe(false);
    });

    it('should accept positional parameters', () => {
      const result = relationalQuery.schema.safeParse({
        sql: 'SELECT * FROM users WHERE id = ?',
        params: [42],
        vendor: 'sqlite'
      });

      expect(result.success).toBe(true);
    });

    it('should accept named parameters', () => {
      const result = relationalQuery.schema.safeParse({
        sql: 'SELECT * FROM users WHERE name = :name',
        params: { name: 'John' },
        vendor: 'postgresql'
      });

      expect(result.success).toBe(true);
    });

    it('should accept optional timeout', () => {
      const result = relationalQuery.schema.safeParse({
        sql: 'SELECT 1',
        vendor: 'sqlite',
        timeout: 5000
      });

      expect(result.success).toBe(true);
    });

    it('should accept optional maxRows', () => {
      const result = relationalQuery.schema.safeParse({
        sql: 'SELECT * FROM users',
        vendor: 'sqlite',
        maxRows: 100
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Tool Invocation', () => {
    it.skipIf(!hasSQLiteBindings)('should execute simple SELECT query', async () => {
      const result = await relationalQuery.invoke({
        sql: 'SELECT 1 as value',
        vendor: 'sqlite',
        connectionString: ':memory:'
      });

      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ value: 1 });
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it.skipIf(!hasSQLiteBindings)('should handle query errors gracefully', async () => {
      const result = await relationalQuery.invoke({
        sql: 'SELECT * FROM nonexistent_table',
        vendor: 'sqlite',
        connectionString: ':memory:'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.rows).toEqual([]);
      expect(result.rowCount).toBe(0);
    });

    it.skipIf(!hasSQLiteBindings)('should handle invalid SQL gracefully', async () => {
      const result = await relationalQuery.invoke({
        sql: 'INVALID SQL SYNTAX',
        vendor: 'sqlite',
        connectionString: ':memory:'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

