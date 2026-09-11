import { z } from 'zod';
import { expect } from 'vitest';

import type { ConnectionConfig } from '../../../../../src/data/relational/connection/types.js';
import { createRelationalToolSet } from '../../../../../src/data/relational/tool-set.js';

function schemaFields(schema: z.ZodTypeAny): string[] {
  const objectSchema = schema instanceof z.ZodEffects ? schema.innerType() : schema;
  return Object.keys((objectSchema as z.AnyZodObject).shape);
}

/**
 * Exercise the configured Relational Tool Set through its public interface.
 * Vendor suites provide the database lifecycle; this contract owns and disposes
 * the configured Tool Set it creates.
 */
export async function expectRelationalToolSetContract(config: ConnectionConfig): Promise<void> {
  const toolSet = createRelationalToolSet(config, {
    prefix: 'integration',
    schemaCacheTtlMs: 60_000,
  });

  try {
    expect([...toolSet].map((tool) => tool.metadata.name)).toEqual([
      'integration-relational-query',
      'integration-relational-select',
      'integration-relational-insert',
      'integration-relational-update',
      'integration-relational-delete',
      'integration-relational-get-schema',
    ]);
    for (const tool of toolSet) {
      expect(schemaFields(tool.schema)).not.toContain('vendor');
      expect(schemaFields(tool.schema)).not.toContain('connectionString');
    }

    await expect(toolSet.query.invoke({ sql: 'SELECT 1 AS value' })).resolves.toMatchObject({
      success: true,
      rowCount: 1,
    });
    await expect(toolSet.getSchema.invoke({ tables: ['users'] })).resolves.toMatchObject({
      success: true,
      summary: { tableCount: 1 },
    });
    await expect(
      toolSet.select.invoke({
        table: 'users',
        where: [{ column: 'email', operator: 'eq', value: 'alice@example.com' }],
      })
    ).resolves.toMatchObject({ success: true, rowCount: 1 });

    await expect(
      toolSet.insert.invoke({
        table: 'users',
        data: { name: 'Tool Set User', email: 'tool-set@example.com', age: 41 },
      })
    ).resolves.toMatchObject({ success: true, rowCount: 1 });
    await expect(
      toolSet.update.invoke({
        table: 'users',
        data: { age: 42 },
        where: [{ column: 'email', operator: 'eq', value: 'tool-set@example.com' }],
      })
    ).resolves.toMatchObject({ success: true, rowCount: 1 });
    await expect(
      toolSet.delete.invoke({
        table: 'users',
        where: [{ column: 'email', operator: 'eq', value: 'tool-set@example.com' }],
      })
    ).resolves.toMatchObject({ success: true, rowCount: 1 });

    await expect(
      toolSet.transaction(async (tools) => {
        return tools.insert.invoke({
          table: 'users',
          data: { name: 'Committed User', email: 'committed@example.com', age: 35 },
        });
      })
    ).resolves.toMatchObject({ success: true, rowCount: 1 });
    await expect(
      toolSet.select.invoke({
        table: 'users',
        where: [{ column: 'email', operator: 'eq', value: 'committed@example.com' }],
      })
    ).resolves.toMatchObject({ success: true, rowCount: 1 });

    await expect(
      toolSet.transaction(async (tools) => {
        await tools.insert.invoke({
          table: 'users',
          data: { name: 'Rolled Back User', email: 'rolled-back@example.com', age: 36 },
        });
        throw new Error('roll back adapter contract');
      })
    ).rejects.toThrow('roll back adapter contract');
    await expect(
      toolSet.select.invoke({
        table: 'users',
        where: [{ column: 'email', operator: 'eq', value: 'rolled-back@example.com' }],
      })
    ).resolves.toMatchObject({ success: true, rowCount: 0 });

    toolSet.refreshSchema();
    await expect(toolSet.getSchema.invoke({ tables: ['users'] })).resolves.toMatchObject({
      success: true,
      summary: { tableCount: 1 },
    });

    const failure = await toolSet.query.invoke({ sql: 'SELECT * FROM agentforge_missing_table' });
    expect(failure).toEqual({
      success: false,
      error: 'Query execution failed. See server logs for details.',
      rows: [],
      rowCount: 0,
    });
  } finally {
    await toolSet.dispose();
  }
}
