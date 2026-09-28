import { afterEach, describe, expect, it, vi } from 'vitest';
import { retry, timeout, type ComposedTool } from '../../src/tools/composition.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('composed Tool resilience', () => {
  it('returns a first-attempt result without retrying', async () => {
    const invoke = vi.fn(async (input: string) => `ok:${input}`);
    const tool: ComposedTool<string, string> = {
      name: 'stable',
      description: 'Stable tool',
      invoke,
    };

    await expect(retry(tool, { maxAttempts: 3, delay: 0 }).invoke('task')).resolves.toBe('ok:task');
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('preserves the final Error identity after exhausting the exact attempt count', async () => {
    const firstError = new Error('first failure');
    const finalError = new Error('final failure');
    const invoke = vi.fn().mockRejectedValueOnce(firstError).mockRejectedValue(finalError);
    const tool: ComposedTool<string, string> = {
      name: 'failing',
      description: 'Failing tool',
      invoke,
    };

    const result = retry(tool, { maxAttempts: 2, delay: 0 }).invoke('task');

    await expect(result).rejects.toBe(finalError);
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['linear', [0, 10, 30, 60]],
    ['exponential', [0, 10, 30, 70]],
  ] as const)('uses %s backoff between attempts', async (backoff, expectedTimes) => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const invocationTimes: number[] = [];
    const tool: ComposedTool<void, never> = {
      name: 'failing',
      description: 'Failing tool',
      invoke: async () => {
        invocationTimes.push(Date.now());
        throw new Error('failure');
      },
    };

    const result = retry(tool, { maxAttempts: 4, delay: 10, backoff }).invoke();
    const rejection = expect(result).rejects.toThrow('failure');
    await vi.runAllTimersAsync();

    await rejection;
    expect(invocationTimes).toEqual(expectedTimes);
  });

  it('normalizes a non-Error thrown value into the exact final error', async () => {
    const thrown = { reason: 'unavailable' };
    const tool: ComposedTool<void, never> = {
      name: 'non-error',
      description: 'Throws a value',
      invoke: async () => {
        throw thrown;
      },
    };

    await expect(retry(tool, { maxAttempts: 1 }).invoke()).rejects.toEqual(
      new Error('[object Object]')
    );
  });

  it('clears the timeout after an underlying failure', async () => {
    vi.useFakeTimers();
    const failure = new Error('underlying failure');
    const tool: ComposedTool<void, never> = {
      name: 'failing',
      description: 'Failing tool',
      invoke: async () => {
        throw failure;
      },
    };

    await expect(timeout(tool, 50).invoke()).rejects.toBe(failure);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects when the underlying Tool completes exactly at the deadline', async () => {
    vi.useFakeTimers();
    const tool: ComposedTool<void, string> = {
      name: 'deadline',
      description: 'Completes at the deadline',
      invoke: async () => new Promise((resolve) => setTimeout(() => resolve('too late'), 10)),
    };
    const result = timeout(tool, 10).invoke();
    const rejection = expect(result).rejects.toThrow('Tool deadline timed out after 10ms');

    await vi.advanceTimersByTimeAsync(10);

    await rejection;
  });

  it('keeps the timeout result after the underlying Tool completes late', async () => {
    vi.useFakeTimers();
    let completed = false;
    const tool: ComposedTool<void, string> = {
      name: 'slow',
      description: 'Slow tool',
      invoke: async () =>
        new Promise((resolve) => {
          setTimeout(() => {
            completed = true;
            resolve('late success');
          }, 20);
        }),
    };
    const result = timeout(tool, 10).invoke();
    const rejection = expect(result).rejects.toThrow('Tool slow timed out after 10ms');

    await vi.advanceTimersByTimeAsync(10);
    await rejection;
    await vi.advanceTimersByTimeAsync(10);

    expect(completed).toBe(true);
    await expect(result).rejects.toThrow('Tool slow timed out after 10ms');
  });

  it('applies a timeout outside retry to the complete retry sequence', async () => {
    vi.useFakeTimers();
    const invoke = vi.fn(async () => {
      throw new Error('retryable');
    });
    const tool: ComposedTool<void, never> = {
      name: 'nested',
      description: 'Nested tool',
      invoke,
    };
    const composed = timeout(retry(tool, { maxAttempts: 3, delay: 10, backoff: 'linear' }), 15);
    const result = composed.invoke();
    const rejection = expect(result).rejects.toThrow('Tool retry(nested) timed out after 15ms');

    await vi.advanceTimersByTimeAsync(15);
    await rejection;

    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it('applies retry outside timeout to each timed attempt', async () => {
    vi.useFakeTimers();
    const invoke = vi.fn(
      async () => new Promise<string>((resolve) => setTimeout(() => resolve('late'), 20))
    );
    const tool: ComposedTool<void, string> = {
      name: 'nested',
      description: 'Nested tool',
      invoke,
    };
    const composed = retry(timeout(tool, 5), {
      maxAttempts: 2,
      delay: 0,
      backoff: 'linear',
    });
    const result = composed.invoke();
    const rejection = expect(result).rejects.toThrow('Tool nested timed out after 5ms');

    await vi.runAllTimersAsync();
    await rejection;

    expect(invoke).toHaveBeenCalledTimes(2);
  });
});
