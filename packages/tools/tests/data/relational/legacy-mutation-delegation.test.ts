import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createLegacyRelationalMutationToolSet: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  dispose: vi.fn(),
}));

vi.mock('../../../src/data/relational/tool-set.js', () => ({
  createLegacyRelationalMutationToolSet: mocks.createLegacyRelationalMutationToolSet,
}));

import {
  relationalDelete,
  relationalInsert,
  relationalUpdate,
} from '../../../src/data/relational/tools/index.js';

describe('legacy Relational mutation Tool delegation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createLegacyRelationalMutationToolSet.mockReturnValue({
      insert: { invoke: mocks.insert },
      update: { invoke: mocks.update },
      delete: { invoke: mocks.delete },
      dispose: mocks.dispose,
    });
    mocks.insert.mockResolvedValue({
      success: true,
      rowCount: 1,
      insertedIds: [42],
      rows: [],
      executionTime: 1,
    });
    mocks.update.mockResolvedValue({ success: true, rowCount: 1, executionTime: 1 });
    mocks.delete.mockResolvedValue({
      success: true,
      rowCount: 1,
      executionTime: 1,
      softDeleted: false,
    });
    mocks.dispose.mockResolvedValue(undefined);
  });

  it('delegates Insert without credentials and disposes the Tool Set', async () => {
    await relationalInsert.invoke({
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/agentforge',
      table: 'users',
      data: { name: 'Alice' },
    });

    expect(mocks.createLegacyRelationalMutationToolSet).toHaveBeenCalledWith({
      vendor: 'postgresql',
      connection: 'postgresql://localhost/agentforge',
    });
    expect(mocks.insert).toHaveBeenCalledWith({ table: 'users', data: { name: 'Alice' } });
    expect(mocks.dispose).toHaveBeenCalledOnce();
  });

  it('delegates Update without credentials and disposes the Tool Set', async () => {
    await relationalUpdate.invoke({
      vendor: 'mysql',
      connectionString: 'mysql://localhost/agentforge',
      table: 'users',
      data: { status: 'inactive' },
      where: [{ column: 'id', operator: 'eq', value: 42 }],
    });

    const operation = mocks.update.mock.calls[0]?.[0];
    expect(mocks.createLegacyRelationalMutationToolSet).toHaveBeenCalledWith({
      vendor: 'mysql',
      connection: 'mysql://localhost/agentforge',
    });
    expect(operation).toMatchObject({
      table: 'users',
      data: { status: 'inactive' },
      where: [{ column: 'id', operator: 'eq', value: 42 }],
    });
    expect(operation).not.toHaveProperty('vendor');
    expect(operation).not.toHaveProperty('connectionString');
    expect(mocks.dispose).toHaveBeenCalledOnce();
  });

  it('delegates Delete without credentials and disposes the Tool Set', async () => {
    await relationalDelete.invoke({
      vendor: 'sqlite',
      connectionString: 'database.sqlite',
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 42 }],
    });

    const operation = mocks.delete.mock.calls[0]?.[0];
    expect(mocks.createLegacyRelationalMutationToolSet).toHaveBeenCalledWith({
      vendor: 'sqlite',
      connection: 'database.sqlite',
    });
    expect(operation).toMatchObject({
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 42 }],
    });
    expect(operation).not.toHaveProperty('vendor');
    expect(operation).not.toHaveProperty('connectionString');
    expect(mocks.dispose).toHaveBeenCalledOnce();
  });

  it('disposes the Tool Set when delegated invocation throws', async () => {
    mocks.insert.mockRejectedValueOnce(new Error('missing driver'));

    await expect(
      relationalInsert.invoke({
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/agentforge',
        table: 'users',
        data: { name: 'Alice' },
      })
    ).resolves.toMatchObject({ success: false });
    expect(mocks.dispose).toHaveBeenCalledOnce();
  });

  it('creates and disposes a fresh Tool Set for every invocation', async () => {
    const input = {
      vendor: 'postgresql' as const,
      connectionString: 'postgresql://localhost/agentforge',
      table: 'users',
      data: { name: 'Alice' },
    };

    await relationalInsert.invoke(input);
    await relationalInsert.invoke(input);

    expect(mocks.createLegacyRelationalMutationToolSet).toHaveBeenCalledTimes(2);
    expect(mocks.dispose).toHaveBeenCalledTimes(2);
  });
});
