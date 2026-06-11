import { describe, expect, it } from 'vitest';
import { createToolExecutor } from '../../../src/tools/executor.js';

describe('Tool Executor metrics', () => {
  it('should track successful executions by priority', async () => {
    const tool = {
      name: 'test-tool',
      invoke: async (input: string) => `Result: ${input}`,
    };

    const executor = createToolExecutor();

    await executor.execute(tool, 'test1', { priority: 'high' });
    await executor.execute(tool, 'test2', { priority: 'high' });
    await executor.execute(tool, 'test3', { priority: 'normal' });

    const metrics = executor.getMetrics();

    expect(metrics.totalExecutions).toBe(3);
    expect(metrics.successfulExecutions).toBe(3);
    expect(metrics.failedExecutions).toBe(0);
    expect(metrics.byPriority.high).toBe(2);
    expect(metrics.byPriority.normal).toBe(1);
    expect(metrics.byPriority.low).toBe(0);
    expect(metrics.byPriority.critical).toBe(0);
  });

  it('should track failed executions by priority', async () => {
    const tool = {
      name: 'failing-tool',
      invoke: async (_input: string) => {
        throw new Error('Tool failed');
      },
    };

    const executor = createToolExecutor();

    await expect(executor.execute(tool, 'test1', { priority: 'critical' })).rejects.toThrow();
    await expect(executor.execute(tool, 'test2', { priority: 'high' })).rejects.toThrow();
    await expect(executor.execute(tool, 'test3', { priority: 'high' })).rejects.toThrow();

    const metrics = executor.getMetrics();

    expect(metrics.totalExecutions).toBe(3);
    expect(metrics.successfulExecutions).toBe(0);
    expect(metrics.failedExecutions).toBe(3);
    expect(metrics.byPriority.critical).toBe(1);
    expect(metrics.byPriority.high).toBe(2);
    expect(metrics.byPriority.normal).toBe(0);
    expect(metrics.byPriority.low).toBe(0);
  });

  it('should track both successful and failed executions by priority', async () => {
    let shouldFail = false;
    const tool = {
      name: 'mixed-tool',
      invoke: async (input: string) => {
        if (shouldFail) {
          throw new Error('Tool failed');
        }
        return `Result: ${input}`;
      },
    };

    const executor = createToolExecutor();

    await executor.execute(tool, 'test1', { priority: 'high' });
    await executor.execute(tool, 'test2', { priority: 'normal' });

    shouldFail = true;
    await expect(executor.execute(tool, 'test3', { priority: 'high' })).rejects.toThrow();
    await expect(executor.execute(tool, 'test4', { priority: 'low' })).rejects.toThrow();

    const metrics = executor.getMetrics();

    expect(metrics.totalExecutions).toBe(4);
    expect(metrics.successfulExecutions).toBe(2);
    expect(metrics.failedExecutions).toBe(2);
    expect(metrics.byPriority.high).toBe(2);
    expect(metrics.byPriority.normal).toBe(1);
    expect(metrics.byPriority.low).toBe(1);
    expect(metrics.byPriority.critical).toBe(0);
  });

  it('should reset metrics correctly', async () => {
    const tool = {
      name: 'test-tool',
      invoke: async (input: string) => `Result: ${input}`,
    };

    const executor = createToolExecutor();

    await executor.execute(tool, 'test', { priority: 'high' });

    let metrics = executor.getMetrics();
    expect(metrics.totalExecutions).toBe(1);
    expect(metrics.byPriority.high).toBe(1);

    executor.resetMetrics();

    metrics = executor.getMetrics();
    expect(metrics.totalExecutions).toBe(0);
    expect(metrics.successfulExecutions).toBe(0);
    expect(metrics.failedExecutions).toBe(0);
    expect(metrics.byPriority.high).toBe(0);
    expect(metrics.byPriority.normal).toBe(0);
    expect(metrics.byPriority.low).toBe(0);
    expect(metrics.byPriority.critical).toBe(0);
  });
});
