import { describe, expect, it } from 'vitest';
import { ToolRegistry } from '@agentforge/core';

import * as tools from '../../../src/index.js';

describe('@agentforge/tools relational package surface', () => {
  it('exports the Relational Tool Set interface and deprecated compatibility Tools', () => {
    expect(tools).toMatchObject({
      createRelationalToolSet: expect.any(Function),
      RelationalToolSetConfigurationError: expect.any(Function),
      RelationalToolSetDisposedError: expect.any(Function),
      RelationalTransactionError: expect.any(Function),
      relationalQuery: expect.any(Object),
      relationalSelect: expect.any(Object),
      relationalInsert: expect.any(Object),
      relationalUpdate: expect.any(Object),
      relationalDelete: expect.any(Object),
      relationalGetSchema: expect.any(Object),
    });
  });

  it('registers the configured Tool collection through the public registry interface', () => {
    const relational = tools.createRelationalToolSet({
      vendor: 'sqlite',
      connection: ':memory:',
    });
    const registry = new ToolRegistry();

    registry.registerMany(relational);

    expect(registry.getNames()).toEqual([...relational].map((tool) => tool.metadata.name));
  });
});
