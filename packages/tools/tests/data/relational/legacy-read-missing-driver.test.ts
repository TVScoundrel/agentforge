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
  relationalGetSchema,
  relationalQuery,
  relationalSelect,
} from '../../../src/data/relational/index.js';

describe('legacy Relational read Tool missing-driver compatibility', () => {
  it.each([
    [
      'Query',
      () =>
        relationalQuery.invoke({
          sql: 'SELECT 1',
          vendor: 'postgresql',
          connectionString: 'postgresql://localhost/agentforge',
        }),
    ],
    [
      'Select',
      () =>
        relationalSelect.invoke({
          table: 'users',
          vendor: 'postgresql',
          connectionString: 'postgresql://localhost/agentforge',
        }),
    ],
    [
      'Get Schema',
      () =>
        relationalGetSchema.invoke({
          vendor: 'postgresql',
          connectionString: 'postgresql://localhost/agentforge',
        }),
    ],
  ])('%s preserves MissingPeerDependencyError', async (_name, invoke) => {
    await expect(invoke()).rejects.toBeInstanceOf(MissingPeerDependencyError);
  });
});
