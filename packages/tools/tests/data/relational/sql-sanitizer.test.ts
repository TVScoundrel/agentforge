/**
 * SQL Sanitizer Tests
 *
 * Unit tests for SQL sanitization and validation utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  validateSqlString,
  enforceParameterizedQueryUsage,
} from '../../../src/data/relational/utils/sql-sanitizer.js';

describe('SQL Sanitizer', () => {
  describe('validateSqlString', () => {
    it('should accept safe SQL query', () => {
      expect(() => validateSqlString('SELECT * FROM users WHERE id = ?')).not.toThrow();
    });

    it('should reject empty query', () => {
      expect(() => validateSqlString('   ')).toThrow(/must not be empty/);
    });

    it('should reject null bytes', () => {
      expect(() => validateSqlString('SELECT * FROM users\0')).toThrow(/null bytes/);
    });

    it('should reject DROP statements', () => {
      expect(() => validateSqlString('DROP TABLE users')).toThrow(/dangerous SQL operation/);
    });

    it('should reject TRUNCATE statements', () => {
      expect(() => validateSqlString('TRUNCATE TABLE users')).toThrow(/dangerous SQL operation/);
    });

    it('should reject ALTER statements', () => {
      expect(() => validateSqlString('ALTER TABLE users ADD COLUMN role TEXT')).toThrow(/dangerous SQL operation/);
    });

    it('should reject CREATE statements', () => {
      expect(() => validateSqlString('CREATE TABLE users (id INTEGER)')).toThrow(/dangerous SQL operation/);
    });

    it('should allow dangerous keywords inside comments', () => {
      expect(() =>
        validateSqlString('/* drop table users */ SELECT * FROM users WHERE id = ?'),
      ).not.toThrow();
    });

    it('should allow dangerous keywords inside string literals', () => {
      expect(() =>
        validateSqlString("SELECT 'how to drop table' AS tutorial FROM docs WHERE id = ?"),
      ).not.toThrow();
    });

    it('should allow dangerous keywords inside identifiers', () => {
      expect(() =>
        validateSqlString('SELECT drop_count FROM alter_log WHERE user_id = ?'),
      ).not.toThrow();
    });

    it('should allow dangerous keywords inside double-quoted identifiers', () => {
      expect(() =>
        validateSqlString('SELECT "drop" FROM "create"'),
      ).not.toThrow();
    });

    it('should allow dangerous keywords inside PostgreSQL dollar-quoted strings', () => {
      expect(() =>
        validateSqlString('SELECT $$drop table users; create table x$$ AS note'),
      ).not.toThrow();
    });

    it('should handle MySQL-style backslash-escaped quotes inside strings', () => {
      expect(() =>
        validateSqlString("SELECT 'It\\'s working' AS value", 'mysql'),
      ).not.toThrow();
    });

    it('should ignore dangerous keywords inside MySQL-style escaped strings', () => {
      expect(() =>
        validateSqlString("SELECT 'escape \\\\' DROP TABLE users' AS value", 'mysql'),
      ).not.toThrow();
    });
  });

  describe('enforceParameterizedQueryUsage', () => {
    it('should allow SELECT without params', () => {
      expect(() => enforceParameterizedQueryUsage('SELECT 1')).not.toThrow();
    });

    it('should reject placeholders without params', () => {
      expect(() => enforceParameterizedQueryUsage('SELECT * FROM users WHERE id = ?', undefined))
        .toThrow(/Missing parameters/);
    });

    it('should ignore placeholders inside string literals', () => {
      expect(() => enforceParameterizedQueryUsage("SELECT '?' as literal", undefined))
        .not.toThrow();
    });

    it('should ignore placeholders inside comments', () => {
      expect(() => enforceParameterizedQueryUsage('/* ? */ SELECT 1', undefined))
        .not.toThrow();
    });

    it('should ignore placeholders inside PostgreSQL dollar-quoted strings', () => {
      expect(() => enforceParameterizedQueryUsage('SELECT $$?$$ as literal', undefined))
        .not.toThrow();
    });

    it('should ignore placeholders inside MySQL-style escaped strings', () => {
      expect(() =>
        enforceParameterizedQueryUsage("SELECT 'test\\'?' as literal", undefined, 'mysql'),
      ).not.toThrow();
    });

    it('should not treat PostgreSQL casts as placeholders', () => {
      expect(() => enforceParameterizedQueryUsage('SELECT 1::int')).not.toThrow();
    });

    it('should allow PostgreSQL JSON operators without params', () => {
      expect(() =>
        enforceParameterizedQueryUsage("SELECT payload ? 'owner' FROM events", undefined, 'postgresql'),
      ).not.toThrow();
      expect(() =>
        enforceParameterizedQueryUsage("SELECT payload ?| array['owner', 'id'] FROM events", undefined, 'postgresql'),
      ).not.toThrow();
      expect(() =>
        enforceParameterizedQueryUsage("SELECT payload ?& array['owner', 'id'] FROM events", undefined, 'postgresql'),
      ).not.toThrow();
    });

    it('should require parameters for PostgreSQL question-mark placeholders', () => {
      expect(() =>
        enforceParameterizedQueryUsage('SELECT * FROM users WHERE id = ?', undefined, 'postgresql'),
      ).toThrow(/Missing parameters/);
    });

    it('should still require parameters for PostgreSQL numbered placeholders', () => {
      expect(() =>
        enforceParameterizedQueryUsage('SELECT * FROM users WHERE id = $1', undefined, 'postgresql'),
      ).toThrow(/Missing parameters/);
    });

    it('should require params for INSERT', () => {
      expect(() => enforceParameterizedQueryUsage('INSERT INTO users (name) VALUES (\'Alice\')'))
        .toThrow(/Parameters are required for INSERT\/UPDATE\/DELETE queries/);
    });

    it('should require params for UPDATE', () => {
      expect(() => enforceParameterizedQueryUsage('UPDATE users SET name = \'Bob\' WHERE id = 1'))
        .toThrow(/Parameters are required for INSERT\/UPDATE\/DELETE queries/);
    });

    it('should require params for INSERT with leading comments', () => {
      expect(() =>
        enforceParameterizedQueryUsage('/* guard */ INSERT INTO users (name) VALUES (\'Alice\')'),
      ).toThrow(/Parameters are required for INSERT\/UPDATE\/DELETE queries/);
    });

    it('should require params for INSERT in CTE statement', () => {
      expect(() =>
        enforceParameterizedQueryUsage(
          'WITH inserted AS (INSERT INTO users (name) VALUES (\'Alice\') RETURNING id) SELECT * FROM inserted',
        ),
      ).toThrow(/Parameters are required for INSERT\/UPDATE\/DELETE queries/);
    });

    it('should allow parameterized DELETE with params', () => {
      expect(() => enforceParameterizedQueryUsage('DELETE FROM users WHERE id = ?', [1])).not.toThrow();
    });
  });

  describe('OWASP-style injection patterns', () => {
    it('should reject classic stacked query injection payload', () => {
      const payload = "SELECT * FROM users WHERE name = 'admin'; DROP TABLE users; --";
      expect(() => validateSqlString(payload)).toThrow(/dangerous SQL operation/);
    });

    it('should reject destructive ddl injected in query text', () => {
      const payload = 'SELECT * FROM accounts; TRUNCATE TABLE accounts';
      expect(() => validateSqlString(payload)).toThrow(/dangerous SQL operation/);
    });
  });
});
