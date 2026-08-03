import { describe, expect, expectTypeOf, it } from 'vitest';
import { CircuitBreaker } from '../../src/resources/circuit-breaker.js';

describe('CircuitBreaker', () => {
  it('preserves wrapped function argument and return inference', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 1000 });
    const wrapped = breaker.wrap(async (id: number, prefix: string) => `${prefix}:${id}`);

    expectTypeOf(wrapped).toEqualTypeOf<(id: number, prefix: string) => Promise<string>>();
    await expect(wrapped(7, 'job')).resolves.toBe('job:7');
  });

  it('records success and rethrows failures through the circuit', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 1000 });
    const succeeds = breaker.wrap(async () => 'ok');
    const fails = breaker.wrap(async () => {
      throw new Error('failed');
    });

    await expect(succeeds()).resolves.toBe('ok');
    await expect(fails()).rejects.toThrow('failed');

    expect(breaker.getStats()).toMatchObject({
      successes: 1,
      failures: 1,
      totalCalls: 2,
    });
  });
});
