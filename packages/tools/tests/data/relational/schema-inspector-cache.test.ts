/**
 * Cache-focused SchemaInspector coverage.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { SchemaInspector } from '../../../src/data/relational/schema/schema-inspector.js';
import { createMockManager } from './schema-inspector.test-utils.js';

describe('SchemaInspector cache behavior', () => {
  beforeEach(() => {
    SchemaInspector.clearCache();
  });

  it('should use cache and support explicit cache invalidation', async () => {
    const queue = [
      { rows: [{ schema_name: 'public', table_name: 'users' }] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [{ schema_name: 'public', table_name: 'users' }] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
    ];
    const { manager, executeMock } = createMockManager(queue);
    const inspector = new SchemaInspector(manager, 'postgresql', {
      cacheKey: 'pg:cache-test',
      cacheTtlMs: 60_000,
    });

    await inspector.inspect();
    await inspector.inspect();
    expect(executeMock).toHaveBeenCalledTimes(5);

    inspector.invalidateCache();
    await inspector.inspect();
    expect(executeMock).toHaveBeenCalledTimes(10);
  });

  it('should bypass existing cache entries when caching is disabled', async () => {
    const queue = [
      { rows: [{ schema_name: 'public', table_name: 'users' }] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [{ schema_name: 'public', table_name: 'posts' }] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
    ];
    const { manager, executeMock } = createMockManager(queue);
    const cachedInspector = new SchemaInspector(manager, 'postgresql', {
      cacheKey: 'pg:disabled-cache-test',
      cacheTtlMs: 60_000,
    });
    const uncachedInspector = new SchemaInspector(manager, 'postgresql', {
      cacheKey: 'pg:disabled-cache-test',
      cacheTtlMs: 0,
    });

    await cachedInspector.inspect();
    const freshSchema = await uncachedInspector.inspect();

    expect(executeMock).toHaveBeenCalledTimes(10);
    expect(freshSchema.tables.map((table) => table.name)).toEqual(['posts']);
  });
});
