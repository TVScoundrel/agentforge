import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/data/relational/utils/peer-dependency-checker.js', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('../../../src/data/relational/utils/peer-dependency-checker.js')
    >();
  return {
    ...actual,
    checkPeerDependency: vi.fn((vendor: 'postgresql' | 'mysql' | 'sqlite') => {
      throw new actual.MissingPeerDependencyError(vendor, 'missing-driver');
    }),
  };
});

import {
  relationalDelete,
  relationalInsert,
  relationalUpdate,
} from '../../../src/data/relational/index.js';

describe('legacy Relational mutation Tool missing-driver compatibility', () => {
  it.each([
    [
      'Insert',
      () =>
        relationalInsert.invoke({
          table: 'users',
          data: { name: 'Alice' },
          vendor: 'postgresql',
          connectionString: 'postgresql://localhost/agentforge',
        }),
      'Failed to execute INSERT query. Please verify your input and database connection.',
    ],
    [
      'Update',
      () =>
        relationalUpdate.invoke({
          table: 'users',
          data: { status: 'inactive' },
          where: [{ column: 'id', operator: 'eq', value: 42 }],
          vendor: 'postgresql',
          connectionString: 'postgresql://localhost/agentforge',
        }),
      'Failed to execute UPDATE query. Please verify your input and database connection.',
    ],
    [
      'Delete',
      () =>
        relationalDelete.invoke({
          table: 'users',
          where: [{ column: 'id', operator: 'eq', value: 42 }],
          vendor: 'postgresql',
          connectionString: 'postgresql://localhost/agentforge',
        }),
      'Failed to execute DELETE query. Please verify your input and database connection.',
    ],
  ])('%s preserves its sanitized missing-driver result', async (_name, invoke, error) => {
    await expect(invoke()).resolves.toMatchObject({ success: false, error });
  });
});
