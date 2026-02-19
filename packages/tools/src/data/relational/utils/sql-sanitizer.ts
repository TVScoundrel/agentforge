/**
 * SQL sanitization and validation utilities for relational tools
 * @module utils/sql-sanitizer
 */

import type { QueryParams } from '../query/types.js';
import type { DatabaseVendor } from '../types.js';

const DANGEROUS_SQL_STATEMENT_PATTERN = /^(create|drop|truncate|alter)\b/i;
const NUMBERED_PLACEHOLDER_PATTERN = /\$(\d+)/;
const QUESTION_PLACEHOLDER_PATTERN = /\?/;
const NAMED_PLACEHOLDER_PATTERN = /(?<!:):[a-zA-Z_][a-zA-Z0-9_]*/;
const PARAMETER_REQUIRED_PATTERN = /^(insert|update|delete)\b/i;
const MUTATION_PATTERN = /\b(insert|update|delete)\b/i;

interface SqlStripOptions {
  backslashEscapes: boolean;
}

function stripSqlCommentsAndStrings(sqlString: string, options: SqlStripOptions): string {
  const { backslashEscapes } = options;
  let result = '';
  let i = 0;
  const len = sqlString.length;

  while (i < len) {
    const ch = sqlString[i];
    const next = i + 1 < len ? sqlString[i + 1] : '';

    // Line comment: -- ...
    if (ch === '-' && next === '-') {
      result += ' ';
      i += 2;
      while (i < len && sqlString[i] !== '\n') {
        i += 1;
      }
      continue;
    }

    // Block comment: /* ... */
    if (ch === '/' && next === '*') {
      result += ' ';
      i += 2;
      while (i < len) {
        if (sqlString[i] === '*' && i + 1 < len && sqlString[i + 1] === '/') {
          i += 2;
          break;
        }
        i += 1;
      }
      continue;
    }

    // Single-quoted string: '...'
    if (ch === '\'') {
      result += "''";
      i += 1;
      while (i < len) {
        if (backslashEscapes && sqlString[i] === '\\' && i + 1 < len) {
          i += 2;
          continue;
        }

        if (sqlString[i] === '\'') {
          if (i + 1 < len && sqlString[i + 1] === '\'') {
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    // Double-quoted identifier: "..."
    if (ch === '"') {
      result += '""';
      i += 1;
      while (i < len) {
        if (backslashEscapes && sqlString[i] === '\\' && i + 1 < len) {
          i += 2;
          continue;
        }

        if (sqlString[i] === '"') {
          if (i + 1 < len && sqlString[i + 1] === '"') {
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    // PostgreSQL dollar-quoted string: $$...$$ or $tag$...$tag$
    if (ch === '$') {
      let j = i + 1;
      while (j < len && /[A-Za-z0-9_]/.test(sqlString[j])) {
        j += 1;
      }

      if (j < len && sqlString[j] === '$') {
        const tag = sqlString.slice(i, j + 1);
        result += '$$';
        i = j + 1;

        const endIndex = sqlString.indexOf(tag, i);
        if (endIndex === -1) {
          break;
        }

        i = endIndex + tag.length;
        continue;
      }
    }

    result += ch;
    i += 1;
  }

  return result;
}

function nextNonWhitespaceChar(sqlString: string, index: number): string | null {
  for (let i = index; i < sqlString.length; i += 1) {
    if (!/\s/.test(sqlString[i])) {
      return sqlString[i];
    }
  }

  return null;
}

function hasPostgresQuestionMarkPlaceholder(sqlString: string): boolean {
  for (let i = 0; i < sqlString.length; i += 1) {
    if (sqlString[i] !== '?') {
      continue;
    }

    const immediateNext = i + 1 < sqlString.length ? sqlString[i + 1] : null;
    if (immediateNext === '|' || immediateNext === '&') {
      continue;
    }

    const nextToken = nextNonWhitespaceChar(sqlString, i + 1);
    if (nextToken === null || nextToken === ',' || nextToken === ')' || nextToken === ';' || nextToken === ':') {
      return true;
    }

    if (/[A-Za-z0-9_'"$]/.test(nextToken) || nextToken === '[') {
      continue;
    }

    return true;
  }

  return false;
}

function hasSqlPlaceholders(sqlString: string, vendor?: DatabaseVendor): boolean {
  if (NUMBERED_PLACEHOLDER_PATTERN.test(sqlString)) {
    return true;
  }

  if (NAMED_PLACEHOLDER_PATTERN.test(sqlString)) {
    return true;
  }

  // PostgreSQL frequently uses ? / ?| / ?& as JSONB operators.
  // Disambiguate these operators from bind placeholders.
  if (vendor === 'postgresql') {
    return hasPostgresQuestionMarkPlaceholder(sqlString);
  }

  return QUESTION_PLACEHOLDER_PATTERN.test(sqlString);
}

function hasParameters(params?: QueryParams): boolean {
  if (params === undefined) {
    return false;
  }

  if (Array.isArray(params)) {
    return params.length > 0;
  }

  return Object.keys(params).length > 0;
}

/**
 * Validate raw SQL string safety constraints.
 * Rejects empty input, null bytes, and dangerous DDL operations.
 */
export function validateSqlString(sqlString: string, vendor?: DatabaseVendor): void {
  if (typeof sqlString !== 'string' || sqlString.trim().length === 0) {
    throw new Error('SQL query must not be empty');
  }

  if (sqlString.includes('\0')) {
    throw new Error('SQL query contains null bytes');
  }

  const normalizedForSafetyCheck = stripSqlCommentsAndStrings(sqlString, {
    backslashEscapes: vendor === 'mysql',
  });
  const statements = normalizedForSafetyCheck
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  if (statements.some((statement) => DANGEROUS_SQL_STATEMENT_PATTERN.test(statement))) {
    throw new Error('Detected dangerous SQL operation. CREATE, DROP, TRUNCATE, and ALTER are not allowed.');
  }
}

/**
 * Enforce parameterized-query usage for mutation statements and placeholders.
 */
export function enforceParameterizedQueryUsage(
  sqlString: string,
  params?: QueryParams,
  vendor?: DatabaseVendor,
): void {
  const normalizedForAnalysis = stripSqlCommentsAndStrings(sqlString, {
    backslashEscapes: vendor === 'mysql',
  });
  const normalized = normalizedForAnalysis.trim().toLowerCase();
  const hasPlaceholders = hasSqlPlaceholders(normalizedForAnalysis, vendor);
  const hasParams = hasParameters(params);

  if (hasPlaceholders && !hasParams) {
    throw new Error('Missing parameters: SQL query contains placeholders but no params were provided');
  }

  const startsWithWith = /^with\b/.test(normalized);
  const parameterRequired = startsWithWith
    ? MUTATION_PATTERN.test(normalized)
    : PARAMETER_REQUIRED_PATTERN.test(normalized);

  if (parameterRequired && !hasParams) {
    throw new Error(
      'Parameters are required for INSERT/UPDATE/DELETE queries. ' +
      'Use parameterized placeholders instead of embedding values directly.'
    );
  }
}
