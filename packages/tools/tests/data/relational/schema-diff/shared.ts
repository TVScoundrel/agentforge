import type { DatabaseSchema } from '../../../../src/data/relational/schema/types.js';

export function makeSchema(overrides?: Partial<DatabaseSchema>): DatabaseSchema {
  return {
    vendor: 'postgresql',
    generatedAt: '2026-02-19T00:00:00Z',
    tables: [
      {
        name: 'users',
        schema: 'public',
        columns: [
          { name: 'id', type: 'integer', isNullable: false, defaultValue: null, isPrimaryKey: true },
          { name: 'name', type: 'text', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'email', type: 'text', isNullable: true, defaultValue: null, isPrimaryKey: false },
        ],
        primaryKey: ['id'],
        foreignKeys: [],
        indexes: [],
      },
    ],
    ...overrides,
  };
}
