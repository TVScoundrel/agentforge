import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  createRelationalToolSet,
  RelationalTransactionError,
} from '../../../src/data/relational/index.js';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function temporaryDatabase(): string {
  const directory = mkdtempSync(join(tmpdir(), 'agentforge-tool-set-transaction-'));
  temporaryDirectories.push(directory);
  const databasePath = join(directory, 'database.sqlite');
  const database = new Database(databasePath);
  database.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)');
  database.close();
  return databasePath;
}

describe('Relational Tool Set transactions', () => {
  it('provides the same six named Tools and commits successful scoped work', async () => {
    const toolSet = createRelationalToolSet(
      { vendor: 'sqlite', connection: temporaryDatabase() },
      { prefix: 'app' }
    );

    const callbackResult = await toolSet.transaction(async (tools) => {
      expect(Object.keys(tools).sort()).toEqual(
        ['delete', 'getSchema', 'insert', 'query', 'select', 'update'].sort()
      );
      expect([...tools].map((tool) => tool.metadata.name)).toEqual(
        [...toolSet].map((tool) => tool.metadata.name)
      );

      await expect(
        tools.insert.invoke({ table: 'users', data: { id: 1, name: 'Alice' } })
      ).resolves.toMatchObject({ success: true, rowCount: 1 });
      return 'committed';
    });

    expect(callbackResult).toBe('committed');
    await expect(toolSet.query.invoke({ sql: 'SELECT name FROM users' })).resolves.toMatchObject({
      success: true,
      rows: [{ name: 'Alice' }],
    });
    await toolSet.dispose();
  });

  it('rolls back callback failures', async () => {
    const toolSet = createRelationalToolSet({
      vendor: 'sqlite',
      connection: temporaryDatabase(),
    });

    await expect(
      toolSet.transaction(async (tools) => {
        await tools.insert.invoke({ table: 'users', data: { id: 1, name: 'Alice' } });
        throw new Error('callback failed');
      })
    ).rejects.toThrow('callback failed');

    await expect(toolSet.query.invoke({ sql: 'SELECT * FROM users' })).resolves.toMatchObject({
      success: true,
      rows: [],
    });
    await toolSet.dispose();
  });

  it('marks failed results rollback-only and short-circuits later scoped work', async () => {
    const toolSet = createRelationalToolSet({
      vendor: 'sqlite',
      connection: temporaryDatabase(),
    });

    await expect(
      toolSet.transaction(async (tools) => {
        const failed = await tools.insert.invoke({
          table: 'missing_table',
          data: { id: 1, name: 'Alice' },
        });
        expect(failed.success).toBe(false);

        const skipped = await tools.insert.invoke({
          table: 'users',
          data: { id: 2, name: 'Bob' },
        });
        expect(skipped).toMatchObject({
          success: false,
          error: 'Transaction is rollback-only; no database work was executed.',
        });
      })
    ).rejects.toBeInstanceOf(RelationalTransactionError);

    await expect(toolSet.query.invoke({ sql: 'SELECT * FROM users' })).resolves.toMatchObject({
      success: true,
      rows: [],
    });
    await toolSet.dispose();
  });

  it.each(['BEGIN', 'COMMIT', 'ROLLBACK', 'SAVEPOINT hidden', 'RELEASE SAVEPOINT hidden'])(
    'rejects transaction control through the scoped query Tool: %s',
    async (statement) => {
      const toolSet = createRelationalToolSet({
        vendor: 'sqlite',
        connection: temporaryDatabase(),
      });

      await expect(
        toolSet.transaction(async (tools) => {
          const controlResult = await tools.query.invoke({ sql: statement });
          expect(controlResult).toMatchObject({
            success: false,
            error: 'Transaction control statements are not allowed in scoped Tools.',
          });
          await expect(
            tools.insert.invoke({ table: 'users', data: { id: 1, name: 'Alice' } })
          ).resolves.toMatchObject({
            success: false,
            error: 'Transaction is rollback-only; no database work was executed.',
          });
        })
      ).rejects.toMatchObject({ code: 'ROLLBACK_ONLY' });

      await expect(toolSet.query.invoke({ sql: 'SELECT * FROM users' })).resolves.toMatchObject({
        success: true,
        rows: [],
      });
      await toolSet.dispose();
    }
  );

  it('marks partial batch results rollback-only', async () => {
    const toolSet = createRelationalToolSet({
      vendor: 'sqlite',
      connection: temporaryDatabase(),
    });

    await expect(
      toolSet.transaction(async (tools) => {
        const partial = await tools.insert.invoke({
          table: 'users',
          data: [
            { id: 1, name: 'Alice' },
            { id: 1, name: 'Duplicate' },
          ],
          batch: { enabled: true, batchSize: 1, continueOnError: true },
        });
        expect(partial).toMatchObject({
          success: true,
          batch: { partialSuccess: true, failedItems: 1 },
        });
      })
    ).rejects.toMatchObject({ code: 'ROLLBACK_ONLY' });

    await expect(toolSet.query.invoke({ sql: 'SELECT * FROM users' })).resolves.toMatchObject({
      success: true,
      rows: [],
    });
    await toolSet.dispose();
  });

  it('serializes concurrently invoked scoped Tools in invocation order', async () => {
    const toolSet = createRelationalToolSet({
      vendor: 'sqlite',
      connection: temporaryDatabase(),
    });

    await toolSet.transaction(async (tools) => {
      const insert = tools.insert.invoke({ table: 'users', data: { id: 1, name: 'Alice' } });
      const select = tools.select.invoke({ table: 'users' });

      await expect(Promise.all([insert, select])).resolves.toMatchObject([
        { success: true, rowCount: 1 },
        { success: true, rows: [{ id: 1, name: 'Alice' }] },
      ]);
    });

    await toolSet.dispose();
  });

  it('runs concurrent SQLite transactions safely on the owned session', async () => {
    const toolSet = createRelationalToolSet({
      vendor: 'sqlite',
      connection: temporaryDatabase(),
    });

    await expect(
      Promise.all([
        toolSet.transaction((tools) =>
          tools.insert.invoke({ table: 'users', data: { id: 1, name: 'Alice' } })
        ),
        toolSet.transaction((tools) =>
          tools.insert.invoke({ table: 'users', data: { id: 2, name: 'Bob' } })
        ),
      ])
    ).resolves.toMatchObject([
      { success: true, rowCount: 1 },
      { success: true, rowCount: 1 },
    ]);

    await toolSet.dispose();
  });

  it('rolls back on timeout and expires scoped Tools after the callback settles', async () => {
    const toolSet = createRelationalToolSet({
      vendor: 'sqlite',
      connection: temporaryDatabase(),
    });
    let retainedTools: Parameters<Parameters<typeof toolSet.transaction>[0]>[0] | undefined;

    await expect(
      toolSet.transaction(
        async (tools) => {
          retainedTools = tools;
          await tools.insert.invoke({ table: 'users', data: { id: 1, name: 'Alice' } });
          await new Promise((resolve) => setTimeout(resolve, 20));
        },
        { timeoutMs: 5 }
      )
    ).rejects.toThrow('Transaction timed out after 5ms');

    await new Promise((resolve) => setTimeout(resolve, 30));
    await expect(retainedTools!.query.invoke({ sql: 'SELECT 1' })).rejects.toMatchObject({
      code: 'SCOPE_EXPIRED',
    });
    await expect(toolSet.query.invoke({ sql: 'SELECT * FROM users' })).resolves.toMatchObject({
      success: true,
      rows: [],
    });
    await toolSet.dispose();
  });

  it('rejects nested transactions explicitly without aborting the outer transaction', async () => {
    const toolSet = createRelationalToolSet({
      vendor: 'sqlite',
      connection: temporaryDatabase(),
    });

    await toolSet.transaction(async (tools) => {
      await expect(toolSet.transaction(async () => undefined)).rejects.toMatchObject({
        code: 'NESTED_TRANSACTION',
      });
      await tools.insert.invoke({ table: 'users', data: { id: 1, name: 'Alice' } });
    });

    await expect(toolSet.query.invoke({ sql: 'SELECT * FROM users' })).resolves.toMatchObject({
      success: true,
      rows: [{ id: 1, name: 'Alice' }],
    });
    await toolSet.dispose();
  });

  it('supports isolation options and has no implicit timeout', async () => {
    const toolSet = createRelationalToolSet({
      vendor: 'sqlite',
      connection: temporaryDatabase(),
    });

    await expect(
      toolSet.transaction(
        async (tools) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return tools.query.invoke({ sql: 'PRAGMA read_uncommitted' });
        },
        { isolationLevel: 'read uncommitted' }
      )
    ).resolves.toMatchObject({
      success: true,
      rows: [{ read_uncommitted: 1 }],
    });

    await toolSet.dispose();
  });

  it('bypasses shared schema cache state inside a transaction', async () => {
    const databasePath = temporaryDatabase();
    const toolSet = createRelationalToolSet(
      { vendor: 'sqlite', connection: databasePath },
      { schemaCacheTtlMs: 60_000 }
    );
    const initial = await toolSet.getSchema.invoke({});
    const database = new Database(databasePath);
    database.exec('ALTER TABLE users ADD COLUMN email TEXT');
    database.close();

    await expect(
      toolSet.transaction(async (tools) => {
        const transactionalSchema = await tools.getSchema.invoke({});
        expect(
          transactionalSchema.success && transactionalSchema.schema.tables[0]?.columns
        ).toHaveLength(3);
      })
    ).resolves.toBeUndefined();

    const cachedAfterRollback = await toolSet.getSchema.invoke({});
    const columnCount = (result: typeof initial) =>
      result.success ? result.schema.tables[0]?.columns.length : undefined;
    expect(columnCount(initial)).toBe(2);
    expect(columnCount(cachedAfterRollback)).toBe(2);
    await toolSet.dispose();
  });
});
