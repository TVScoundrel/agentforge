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
  });

  describe('enforceParameterizedQueryUsage', () => {
    it('should allow SELECT without params', () => {
      expect(() => enforceParameterizedQueryUsage('SELECT 1')).not.toThrow();
    });

    it('should reject placeholders without params', () => {
      expect(() => enforceParameterizedQueryUsage('SELECT * FROM users WHERE id = ?', undefined))
        .toThrow(/Missing parameters/);
    });

    it('should not treat PostgreSQL casts as placeholders', () => {
      expect(() => enforceParameterizedQueryUsage('SELECT 1::int')).not.toThrow();
    });

    it('should require params for INSERT', () => {
      expect(() => enforceParameterizedQueryUsage('INSERT INTO users (name) VALUES (\'Alice\')'))
        .toThrow(/Parameters are required for INSERT\/UPDATE\/DELETE queries/);
    });

    it('should require params for UPDATE', () => {
      expect(() => enforceParameterizedQueryUsage('UPDATE users SET name = \'Bob\' WHERE id = 1'))
        .toThrow(/Parameters are required for INSERT\/UPDATE\/DELETE queries/);
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
