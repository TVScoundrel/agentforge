import { afterEach, describe, expect, it, vi } from 'vitest';
import { createToolExecutor, type BackoffStrategy } from '../../../src/tools/executor.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('Tool Executor resilience', () => {
  it('returns a first-attempt result without retrying', async () => {
    const invoke = vi.fn(async (input: string) => `ok:${input}`);
    const executor = createToolExecutor({
      retryPolicy: { maxAttempts: 3, backoff: 'fixed', initialDelay: 1 },
    });

    await expect(executor.execute({ name: 'stable', invoke }, 'task')).resolves.toBe('ok:task');
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('preserves the final Error identity after exhausting the exact attempt count', async () => {
    const firstError = new Error('first failure');
    const finalError = new Error('final failure');
    const invoke = vi.fn().mockRejectedValueOnce(firstError).mockRejectedValue(finalError);
    const executor = createToolExecutor({
      retryPolicy: { maxAttempts: 2, backoff: 'fixed', initialDelay: 1 },
    });

    const result = executor.execute({ name: 'failing', invoke }, 'task');

    await expect(result).rejects.toBe(finalError);
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['fixed', [0, 10, 20, 30]],
    ['linear', [0, 10, 30, 60]],
    ['exponential', [0, 10, 30, 70]],
  ] as const)(
    'uses %s backoff between attempts',
    async (backoff: BackoffStrategy, expectedTimes: readonly number[]) => {
      vi.useFakeTimers();
      vi.setSystemTime(0);
      const invocationTimes: number[] = [];
      const executor = createToolExecutor({
        retryPolicy: { maxAttempts: 4, backoff, initialDelay: 10 },
      });
      const result = executor.execute(
        {
          name: 'failing',
          invoke: async () => {
            invocationTimes.push(Date.now());
            throw new Error('failure');
          },
        },
        undefined
      );
      const rejection = expect(result).rejects.toThrow('failure');

      await vi.runAllTimersAsync();

      await rejection;
      expect(invocationTimes).toEqual(expectedTimes);
    }
  );

  it('caps retry delays at maxDelay', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const invocationTimes: number[] = [];
    const executor = createToolExecutor({
      retryPolicy: {
        maxAttempts: 4,
        backoff: 'exponential',
        initialDelay: 10,
        maxDelay: 15,
      },
    });
    const result = executor.execute(
      {
        name: 'failing',
        invoke: async () => {
          invocationTimes.push(Date.now());
          throw new Error('failure');
        },
      },
      undefined
    );
    const rejection = expect(result).rejects.toThrow('failure');

    await vi.runAllTimersAsync();

    await rejection;
    expect(invocationTimes).toEqual([0, 10, 25, 40]);
  });

  it('retries matching errors and returns an eventual success', async () => {
    const invoke = vi
      .fn()
      .mockRejectedValueOnce(new Error('temporary outage'))
      .mockResolvedValue('recovered');
    const executor = createToolExecutor({
      retryPolicy: {
        maxAttempts: 3,
        backoff: 'fixed',
        initialDelay: 1,
        retryableErrors: ['temporary'],
      },
    });

    await expect(executor.execute({ name: 'filtered', invoke }, undefined)).resolves.toBe(
      'recovered'
    );
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it('propagates a non-retryable Error immediately with its identity', async () => {
    const failure = new Error('permanent failure');
    const invoke = vi.fn().mockRejectedValue(failure);
    const executor = createToolExecutor({
      retryPolicy: {
        maxAttempts: 3,
        backoff: 'fixed',
        initialDelay: 1,
        retryableErrors: ['temporary'],
      },
    });

    await expect(executor.execute({ name: 'filtered', invoke }, undefined)).rejects.toBe(failure);
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('normalizes a non-Error thrown value before retry filtering and reporting', async () => {
    const invoke = vi.fn(async () => {
      throw 'temporary string failure';
    });
    const executor = createToolExecutor({
      retryPolicy: {
        maxAttempts: 2,
        backoff: 'fixed',
        initialDelay: 1,
        retryableErrors: ['temporary'],
      },
    });

    await expect(executor.execute({ name: 'non-error', invoke }, undefined)).rejects.toEqual(
      new Error('temporary string failure')
    );
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it('clears the timeout after success and failure', async () => {
    vi.useFakeTimers();
    const successfulExecutor = createToolExecutor({ timeout: 50 });
    await expect(
      successfulExecutor.execute({ name: 'success', invoke: async () => 'ok' }, undefined)
    ).resolves.toBe('ok');
    expect(vi.getTimerCount()).toBe(0);

    const failure = new Error('underlying failure');
    const failingExecutor = createToolExecutor({ timeout: 50 });
    await expect(
      failingExecutor.execute(
        {
          name: 'failure',
          invoke: async () => {
            throw failure;
          },
        },
        undefined
      )
    ).rejects.toBe(failure);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('completes when the Tool resolves just before or exactly at the deadline', async () => {
    vi.useFakeTimers();
    const executor = createToolExecutor({ timeout: 10 });
    const executeAfter = (delay: number) =>
      executor.execute(
        {
          name: 'deadline',
          invoke: async () => new Promise((resolve) => setTimeout(() => resolve(delay), delay)),
        },
        undefined
      );

    const beforeDeadline = executeAfter(9);
    await vi.advanceTimersByTimeAsync(9);
    await expect(beforeDeadline).resolves.toBe(9);

    const atDeadline = executeAfter(10);
    const atDeadlineAssertion = expect(atDeadline).resolves.toBe(10);
    await vi.advanceTimersByTimeAsync(10);
    await atDeadlineAssertion;
  });

  it('rejects with the Executor wording while the underlying Tool completes late', async () => {
    vi.useFakeTimers();
    let completed = false;
    const executor = createToolExecutor({ timeout: 10 });
    const result = executor.execute(
      {
        name: 'slow',
        invoke: async () =>
          new Promise((resolve) => {
            setTimeout(() => {
              completed = true;
              resolve('late success');
            }, 20);
          }),
      },
      undefined
    );
    const rejection = expect(result).rejects.toThrow('Tool execution timeout');

    await vi.advanceTimersByTimeAsync(10);
    await rejection;
    await vi.advanceTimersByTimeAsync(10);

    expect(completed).toBe(true);
    await expect(result).rejects.toThrow('Tool execution timeout');
  });

  it('applies one timeout across the complete retry sequence', async () => {
    vi.useFakeTimers();
    const invoke = vi.fn(async () => {
      throw new Error('retryable');
    });
    const executor = createToolExecutor({
      timeout: 15,
      retryPolicy: { maxAttempts: 3, backoff: 'fixed', initialDelay: 10 },
    });
    const result = executor.execute({ name: 'retrying', invoke }, undefined);
    const rejection = expect(result).rejects.toThrow('Tool execution timeout');

    await vi.advanceTimersByTimeAsync(15);
    await rejection;

    expect(invoke).toHaveBeenCalledTimes(2);
  });
});
