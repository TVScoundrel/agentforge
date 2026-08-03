import { describe, expect, expectTypeOf, it } from 'vitest';
import { Profiler } from '../../src/monitoring/profiler.js';

describe('Profiler', () => {
  it('preserves wrapped function argument and return inference', async () => {
    const profiler = new Profiler({ enabled: false });
    const wrapped = profiler.profile('format', async (count: number, label: string) => `${label}:${count}`);

    expectTypeOf(wrapped).toEqualTypeOf<(count: number, label: string) => Promise<string>>();
    await expect(wrapped(3, 'items')).resolves.toBe('items:3');
  });

  it('records successful and failed wrapped calls', async () => {
    const profiler = new Profiler();
    const succeeds = profiler.profile('success', async (value: number) => value * 2);
    const fails = profiler.profile('failure', async () => {
      throw new Error('failed');
    });

    await expect(succeeds(4)).resolves.toBe(8);
    await expect(fails()).rejects.toThrow('failed');

    const report = profiler.getReport();
    expect(report.success.calls).toBe(1);
    expect(report.failure.calls).toBe(1);
  });
});
