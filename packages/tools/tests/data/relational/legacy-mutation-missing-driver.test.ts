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
  MissingPeerDependencyError,
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
    ],
  ])('%s preserves MissingPeerDependencyError', async (_name, invoke) => {
    await expect(invoke()).rejects.toBeInstanceOf(MissingPeerDependencyError);
  });
});
