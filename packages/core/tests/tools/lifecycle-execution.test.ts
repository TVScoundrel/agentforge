import { afterEach, describe, expect, it, vi } from 'vitest';
import { createManagedTool } from '../../src/tools/lifecycle.js';

describe('ManagedTool execution lifecycle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('tracks successful and failed executions', async () => {
    const tool = createManagedTool({
      name: 'managed-stats',
      description: 'Managed stats fixture',
      execute: async ({ shouldFail }: { shouldFail: boolean }) => {
        if (shouldFail) {
          throw new Error('boom');
        }

        return 'ok';
      },
      autoCleanup: false,
    });

    await tool.initialize();

    await expect(tool.execute({ shouldFail: false })).resolves.toBe('ok');
    await expect(tool.execute({ shouldFail: true })).rejects.toThrow('boom');

    expect(tool.getStats()).toMatchObject({
      totalExecutions: 2,
      successfulExecutions: 1,
      failedExecutions: 1,
    });
    expect(tool.getStats().lastExecutionTime).toBeTypeOf('number');
  });

  it('exposes a LangChain-style invoke wrapper around execute', async () => {
    const tool = createManagedTool({
      name: 'managed-langchain',
      description: 'Managed langchain fixture',
      execute: async ({ value }: { value: string }) => value.toUpperCase(),
      autoCleanup: false,
    });

    await tool.initialize();

    await expect(tool.toLangChainTool().invoke({ value: 'mixed' })).resolves.toBe('MIXED');
  });
});
