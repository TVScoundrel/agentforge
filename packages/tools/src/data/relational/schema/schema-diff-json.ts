import { createLogger } from '@agentforge/core';

import type { DatabaseSchema } from './types.js';

const logger = createLogger('agentforge:tools:data:relational:schema-diff');

/**
 * Export a database schema to deterministic JSON for snapshots and fixtures.
 */
export function exportSchemaToJson(schema: DatabaseSchema): string {
  return JSON.stringify(schema, sortedReplacer, 2);
}

/**
 * Import a database schema from JSON with basic structural validation.
 */
export function importSchemaFromJson(json: string): DatabaseSchema {
  const parsed: unknown = JSON.parse(json);
  validateSchemaJson(parsed);

  const schema = parsed as DatabaseSchema;

  logger.debug('Schema imported from JSON', {
    vendor: schema.vendor,
    tableCount: schema.tables.length,
  });

  return schema;
}

function validateSchemaJson(parsed: unknown): asserts parsed is DatabaseSchema {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid schema JSON: expected an object');
  }

  const schema = parsed as Record<string, unknown>;

  if (!schema.vendor || typeof schema.vendor !== 'string') {
    throw new Error('Invalid schema JSON: missing or invalid "vendor" field');
  }

  if (!Array.isArray(schema.tables)) {
    throw new Error('Invalid schema JSON: missing or invalid "tables" array');
  }

  if (!schema.generatedAt || typeof schema.generatedAt !== 'string') {
    throw new Error('Invalid schema JSON: missing or invalid "generatedAt" field');
  }

  for (const table of schema.tables) {
    validateTableJson(table);
  }
}

function validateTableJson(table: unknown): void {
  if (!table || typeof table !== 'object') {
    throw new Error('Invalid schema JSON: each table must be an object');
  }

  const record = table as Record<string, unknown>;

  if (!record.name || typeof record.name !== 'string') {
    throw new Error('Invalid schema JSON: each table must have a "name" string');
  }

  if (!Array.isArray(record.columns)) {
    throw new Error(`Invalid schema JSON: table "${record.name}" missing "columns" array`);
  }

  if (!Array.isArray(record.primaryKey)) {
    throw new Error(`Invalid schema JSON: table "${record.name}" missing "primaryKey" array`);
  }
}

function sortedReplacer(_key: string, value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      sorted[key] = record[key];
    }
    return sorted;
  }

  return value;
}
