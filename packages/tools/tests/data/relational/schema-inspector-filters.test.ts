/**
 * Filter-validation SchemaInspector coverage.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseVendor } from '../../../src/data/relational/types.js';
import { SchemaInspector } from '../../../src/data/relational/schema/schema-inspector.js';
import { createMockManager } from './schema-inspector.test-utils.js';

describe('SchemaInspector table filtering', () => {
  beforeEach(() => {
    SchemaInspector.clearCache();
  });

  it('should filter tables and validate table filter syntax', async () => {
    const { manager, executeMock } = createMockManager([
      {
        rows: [
          { schema_name: 'public', table_name: 'users' },
          { schema_name: 'public', table_name: 'orders' },
        ],
      },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
    ]);
    const inspector = new SchemaInspector(manager, 'postgresql');

    await expect(
      inspector.inspect({ tables: ['invalid-table-name!'] }),
    ).rejects.toThrow(/contains invalid characters/);
    expect(executeMock).toHaveBeenCalledTimes(0);

    const filtered = await inspector.inspect({ tables: ['public.orders'] });
    expect(filtered.tables).toHaveLength(1);
    expect(filtered.tables[0].name).toBe('orders');
  });

  it('should fail fast for unsupported runtime vendors', async () => {
    const { manager, executeMock } = createMockManager([]);
    const inspector = new SchemaInspector(manager, 'oracle' as DatabaseVendor);

    await expect(inspector.inspect()).rejects.toThrow('Unsupported database vendor: oracle');
    expect(executeMock).toHaveBeenCalledTimes(0);
  });
});
