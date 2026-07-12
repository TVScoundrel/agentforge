import { describe, expect, it } from 'vitest';

import {
  exportSchemaToJson,
  importSchemaFromJson,
} from '../../../../src/data/relational/schema/schema-diff.js';
import { makeSchema } from './shared.js';

describe('schema-diff > JSON export/import', () => {
  it('should round-trip a schema through JSON', () => {
    const schema = makeSchema();
    const json = exportSchemaToJson(schema);
    const imported = importSchemaFromJson(json);
    expect(imported).toEqual(schema);
  });

  it('should produce deterministic JSON output', () => {
    const schema = makeSchema();
    expect(exportSchemaToJson(schema)).toBe(exportSchemaToJson(schema));
  });

  it('should produce sorted top-level object keys', () => {
    const json = exportSchemaToJson(makeSchema());
    const topKeys = json
      .split('\n')
      .filter((line) => line.match(/^ {2}"/))
      .map((line) => line.match(/"([^"]+)"/)![1]);

    expect(topKeys).toEqual([...topKeys].sort());
  });

  it('should reject invalid JSON input', () => {
    expect(() => importSchemaFromJson('not-json')).toThrow();
  });

  it('should reject missing top-level required fields', () => {
    expect(() => importSchemaFromJson('{"tables":[],"generatedAt":"x"}')).toThrow('vendor');
    expect(() => importSchemaFromJson('{"vendor":"postgresql","tables":"bad","generatedAt":"x"}')).toThrow(
      'tables',
    );
    expect(() => importSchemaFromJson('{"vendor":"postgresql","tables":[]}')).toThrow('generatedAt');
  });

  it('should reject malformed table structures', () => {
    const missingName = JSON.stringify({
      vendor: 'postgresql',
      generatedAt: 'x',
      tables: [{ columns: [], primaryKey: [] }],
    });
    const missingColumns = JSON.stringify({
      vendor: 'postgresql',
      generatedAt: 'x',
      tables: [{ name: 'users', primaryKey: [] }],
    });
    const missingPrimaryKey = JSON.stringify({
      vendor: 'postgresql',
      generatedAt: 'x',
      tables: [{ name: 'users', columns: [] }],
    });

    expect(() => importSchemaFromJson(missingName)).toThrow('name');
    expect(() => importSchemaFromJson(missingColumns)).toThrow('columns');
    expect(() => importSchemaFromJson(missingPrimaryKey)).toThrow('primaryKey');
  });
});
