import { afterEach, describe, expect, it, vi } from 'vitest';
import { createManagedTool } from '../../src/tools/lifecycle.js';

describe('ManagedTool initialization lifecycle', () => {
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

  it('treats initialize as single-flight under concurrent calls', async () => {
    vi.useFakeTimers();

    let resolveInitialize: (() => void) | undefined;
    const initialize = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveInitialize = resolve;
        })
    );
    const healthCheck = vi.fn(async () => ({ healthy: true }));

    const tool = createManagedTool({
      name: 'managed-init-single-flight',
      description: 'Managed init single-flight fixture',
      initialize,
      execute: async () => 'ok',
      healthCheck,
      healthCheckInterval: 50,
      autoCleanup: false,
    });

    const firstInitialize = tool.initialize();
    const secondInitialize = tool.initialize();

    expect(initialize).toHaveBeenCalledTimes(1);

    resolveInitialize?.();
    await Promise.all([firstInitialize, secondInitialize]);

    expect(tool.initialized).toBe(true);

    await vi.advanceTimersByTimeAsync(50);
    expect(healthCheck).toHaveBeenCalledTimes(1);

    await tool.cleanup();
  });

  it('waits for in-flight initialize before cleanup completes', async () => {
    vi.useFakeTimers();

    let resolveInitialize: (() => void) | undefined;
    const initialize = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveInitialize = resolve;
        })
    );
    const cleanup = vi.fn(async () => {});
    const healthCheck = vi.fn(async () => ({ healthy: true }));

    const tool = createManagedTool({
      name: 'managed-init-cleanup-race',
      description: 'Managed init cleanup race fixture',
      initialize,
      execute: async () => 'ok',
      cleanup,
      healthCheck,
      healthCheckInterval: 50,
      autoCleanup: false,
    });

    const initializePromise = tool.initialize();
    const cleanupPromise = tool.cleanup();

    expect(initialize).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();

    resolveInitialize?.();
    await Promise.all([initializePromise, cleanupPromise]);

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(tool.initialized).toBe(false);

    await vi.advanceTimersByTimeAsync(50);
    expect(healthCheck).not.toHaveBeenCalled();
  });

  it('waits for in-flight cleanup before reinitializing', async () => {
    let resolveCleanup: (() => void) | undefined;
    const initialize = vi.fn(async () => {});
    const cleanup = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCleanup = resolve;
        })
    );

    const tool = createManagedTool({
      name: 'managed-single-flight-cleanup',
      description: 'Managed single-flight cleanup fixture',
      initialize,
      execute: async () => 'ok',
      cleanup,
      autoCleanup: false,
    });

    await tool.initialize();
    expect(initialize).toHaveBeenCalledTimes(1);

    const firstCleanup = tool.cleanup();
    const secondCleanup = tool.cleanup();
    const firstReinitialize = tool.initialize();
    const secondReinitialize = tool.initialize();

    expect(tool.initialized).toBe(false);
    expect(cleanup).toHaveBeenCalledTimes(1);

    resolveCleanup?.();
    await Promise.all([firstCleanup, secondCleanup, firstReinitialize, secondReinitialize]);

    expect(tool.initialized).toBe(true);
    expect(initialize).toHaveBeenCalledTimes(2);
  });
});
