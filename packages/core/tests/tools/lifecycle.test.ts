import { afterEach, describe, expect, it, vi } from 'vitest';
import { createManagedTool, type ToolHealthCheckResult } from '../../src/tools/lifecycle.js';

describe('ManagedTool lifecycle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('initializes once and executes through the managed wrapper', async () => {
    const initialize = vi.fn(async function () {
      this.context = { token: 'ready' };
    });

    const tool = createManagedTool({
      name: 'managed-init',
      description: 'Managed init fixture',
      context: { token: 'pending' },
      initialize,
      execute: async function (input: { count: number }) {
        return `${this.context!.token}:${input.count}`;
      },
      autoCleanup: false,
    });

    await tool.initialize();
    await tool.initialize();

    await expect(tool.execute({ count: 3 })).resolves.toBe('ready:3');
    expect(initialize).toHaveBeenCalledTimes(1);
    expect(tool.getStats().initialized).toBe(true);
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

  it('returns default health metadata when no health check is configured', async () => {
    const tool = createManagedTool({
      name: 'managed-default-health',
      description: 'Managed default health fixture',
      execute: async () => 'ok',
      autoCleanup: false,
    });

    await tool.initialize();

    await expect(tool.healthCheck()).resolves.toEqual({
      healthy: true,
      metadata: { message: 'No health check configured' },
    });
  });

  it('records configured health checks and periodic updates', async () => {
    vi.useFakeTimers();

    const healthCheck = vi
      .fn<() => Promise<{ healthy: boolean; metadata: { run: number } }>>()
      .mockResolvedValueOnce({ healthy: true, metadata: { run: 1 } })
      .mockResolvedValueOnce({ healthy: true, metadata: { run: 2 } });

    const tool = createManagedTool({
      name: 'managed-health',
      description: 'Managed health fixture',
      execute: async () => 'ok',
      healthCheck,
      healthCheckInterval: 50,
      autoCleanup: false,
    });

    try {
      await tool.initialize();
      await expect(tool.healthCheck()).resolves.toEqual({
        healthy: true,
        metadata: { run: 1 },
      });

      await vi.advanceTimersByTimeAsync(50);

      expect(tool.getStats().lastHealthCheck).toEqual({
        healthy: true,
        metadata: { run: 2 },
      });
      expect(tool.getStats().lastHealthCheckTime).toBeTypeOf('number');
    } finally {
      await tool.cleanup();
    }
  });

  it('does not overlap periodic health checks when a prior run is still in flight', async () => {
    vi.useFakeTimers();

    let resolveHealthCheck: (() => void) | undefined;
    const healthCheck = vi.fn(
      () =>
        new Promise<{ healthy: boolean; metadata: { run: number } }>((resolve) => {
          resolveHealthCheck = () => resolve({ healthy: true, metadata: { run: 1 } });
        })
    );

    const tool = createManagedTool({
      name: 'managed-health-single-flight',
      description: 'Managed health single-flight fixture',
      execute: async () => 'ok',
      healthCheck,
      healthCheckInterval: 50,
      autoCleanup: false,
    });

    try {
      await tool.initialize();
      await vi.advanceTimersByTimeAsync(50);
      expect(healthCheck).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(50);
      expect(healthCheck).toHaveBeenCalledTimes(1);

      resolveHealthCheck?.();
      await vi.runAllTicks();
      await vi.advanceTimersByTimeAsync(50);
      expect(healthCheck).toHaveBeenCalledTimes(2);
    } finally {
      await tool.cleanup();
    }
  });

  it('stops periodic health checks during cleanup and runs cleanup hooks', async () => {
    vi.useFakeTimers();

    const cleanup = vi.fn(async () => {});
    const healthCheck = vi.fn(async () => ({ healthy: true }));

    const tool = createManagedTool({
      name: 'managed-cleanup',
      description: 'Managed cleanup fixture',
      execute: async () => 'ok',
      cleanup,
      healthCheck,
      healthCheckInterval: 25,
      autoCleanup: false,
    });

    await tool.initialize();
    await vi.advanceTimersByTimeAsync(25);
    expect(healthCheck).toHaveBeenCalledTimes(1);

    await tool.cleanup();
    await vi.advanceTimersByTimeAsync(100);

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(healthCheck).toHaveBeenCalledTimes(1);
    expect(tool.initialized).toBe(false);
  });

  it('registers beforeExit cleanup when autoCleanup is enabled', async () => {
    const processOn = vi.spyOn(process, 'on').mockImplementation(() => process);
    const processOff = vi.spyOn(process, 'off').mockImplementation(() => process);
    const cleanup = vi.fn(async () => {});

    const tool = createManagedTool({
      name: 'managed-auto-cleanup',
      description: 'Managed auto cleanup fixture',
      execute: async () => 'ok',
      cleanup,
    });

    const beforeExitHandler = processOn.mock.calls.find(([event]) => event === 'beforeExit')?.[1];

    expect(beforeExitHandler).toBeTypeOf('function');

    await tool.initialize();
    beforeExitHandler?.();
    await vi.waitFor(() => expect(cleanup).toHaveBeenCalledTimes(1));
    expect(processOn).toHaveBeenCalledWith('beforeExit', expect.any(Function));
    expect(processOff).toHaveBeenCalledWith('beforeExit', expect.any(Function));
  });

  it('removes the beforeExit listener even if cleanup happens before initialize', async () => {
    const processOn = vi.spyOn(process, 'on').mockImplementation(() => process);
    const processOff = vi.spyOn(process, 'off').mockImplementation(() => process);

    const tool = createManagedTool({
      name: 'managed-preinit-cleanup',
      description: 'Managed preinit cleanup fixture',
      execute: async () => 'ok',
    });

    await tool.cleanup();

    expect(processOn).toHaveBeenCalledWith('beforeExit', expect.any(Function));
    expect(processOff).toHaveBeenCalledWith('beforeExit', expect.any(Function));
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

  it('does not update health stats after cleanup if a periodic health check resolves late', async () => {
    vi.useFakeTimers();

    let resolveHealthCheck: (() => void) | undefined;
    const healthCheck = vi.fn(
      () =>
        new Promise<ToolHealthCheckResult>((resolve) => {
          resolveHealthCheck = () => resolve({ healthy: true, metadata: { run: 1 } });
        })
    );

    const tool = createManagedTool({
      name: 'managed-health-cleanup-race',
      description: 'Managed health cleanup race fixture',
      execute: async () => 'ok',
      healthCheck,
      healthCheckInterval: 50,
      autoCleanup: false,
    });

    await tool.initialize();
    await vi.advanceTimersByTimeAsync(50);
    expect(healthCheck).toHaveBeenCalledTimes(1);

    await tool.cleanup();
    resolveHealthCheck?.();
    await vi.runAllTicks();

    expect(tool.initialized).toBe(false);
    expect(tool.getStats().lastHealthCheck).toBeUndefined();
    expect(tool.getStats().lastHealthCheckTime).toBeUndefined();
  });
});
