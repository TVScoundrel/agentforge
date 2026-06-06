import { afterEach, describe, expect, it, vi } from 'vitest';
import { createManagedTool } from '../../src/tools/lifecycle.js';

describe('ManagedTool cleanup lifecycle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
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

  it('re-registers beforeExit cleanup after cleanup and reinitialize', async () => {
    const processOn = vi.spyOn(process, 'on').mockImplementation(() => process);
    const processOff = vi.spyOn(process, 'off').mockImplementation(() => process);
    const cleanup = vi.fn(async () => {});

    const tool = createManagedTool({
      name: 'managed-auto-cleanup-reinit',
      description: 'Managed auto cleanup reinit fixture',
      execute: async () => 'ok',
      cleanup,
    });

    await tool.initialize();
    await tool.cleanup();
    await tool.initialize();

    expect(processOn).toHaveBeenCalledTimes(2);
    expect(processOff).toHaveBeenCalledTimes(1);

    const latestBeforeExitHandler = processOn.mock.calls.at(-1)?.[1];
    expect(latestBeforeExitHandler).toBeTypeOf('function');

    latestBeforeExitHandler?.();
    await vi.waitFor(() => expect(cleanup).toHaveBeenCalledTimes(2));
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
});
