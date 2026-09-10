import { describe, expect, it } from 'vitest';

import {
  mockMysqlCreatePool,
  mockMysqlExecute,
  mockMysqlPoolEnd,
  mockPgExecute,
  mockPool,
  mockPoolEnd,
} from './connection-manager.mock-harness.js';
import { createRelationalToolSet } from '../../../../src/data/relational/tool-set.js';

describe('Relational Tool Set adapter contracts', () => {
  it('coalesces and reuses the PostgreSQL pool through the configured Tool seam', async () => {
    const certificate = Buffer.from('original-certificate');
    const toolSet = createRelationalToolSet({
      vendor: 'postgresql',
      connection: {
        host: 'localhost',
        database: 'agentforge',
        ssl: { ca: certificate },
      },
    });
    certificate.fill(0);

    const results = await Promise.all([
      toolSet.query.invoke({ sql: 'SELECT 1 AS value' }),
      toolSet.query.invoke({ sql: 'SELECT 1 AS value' }),
    ]);

    expect(results.every((result) => result.success)).toBe(true);
    expect(mockPool).toHaveBeenCalledTimes(1);
    const poolConfiguration = (mockPool.mock.calls as unknown[][])[0]?.[0] as {
      ssl: { ca: Buffer };
    };
    expect(poolConfiguration.ssl.ca.toString()).toBe('original-certificate');
    // One initialization health probe plus the two Tool invocations.
    expect(mockPgExecute).toHaveBeenCalledTimes(3);
    await toolSet.dispose();
    expect(mockPoolEnd).toHaveBeenCalledTimes(1);
  });

  it('coalesces and reuses the MySQL pool through the configured Tool seam', async () => {
    const toolSet = createRelationalToolSet({
      vendor: 'mysql',
      connection: 'mysql://localhost/agentforge',
    });

    const results = await Promise.all([
      toolSet.query.invoke({ sql: 'SELECT 1 AS value' }),
      toolSet.query.invoke({ sql: 'SELECT 1 AS value' }),
    ]);

    expect(results.every((result) => result.success)).toBe(true);
    expect(mockMysqlCreatePool).toHaveBeenCalledTimes(1);
    // One initialization health probe plus the two Tool invocations.
    expect(mockMysqlExecute).toHaveBeenCalledTimes(3);
    await toolSet.dispose();
    expect(mockMysqlPoolEnd).toHaveBeenCalledTimes(1);
  });
});
