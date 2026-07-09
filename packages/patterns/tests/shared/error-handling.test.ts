import { describe, it, expect } from 'vitest';
import { withErrorHandling } from '../../src/shared/error-handling.js';

describe('withErrorHandling', () => {
  it('rethrows GraphInterrupt-like errors', async () => {
    const graphInterrupt = {
      constructor: { name: 'GraphInterrupt' },
    };
    const wrapped = withErrorHandling(
      async () => {
        throw graphInterrupt;
      },
      'test-node'
    );

    await expect(wrapped({ input: 'test' })).rejects.toBe(graphInterrupt);
  });

  it('rethrows GraphInterrupt-like errors when the constructor name is unstable', async () => {
    class MinifiedInterrupt extends Error {
      override name = 'GraphInterrupt';
    }

    const graphInterrupt = new MinifiedInterrupt('pause for human input');
    const wrapped = withErrorHandling(
      async () => {
        throw graphInterrupt;
      },
      'test-node'
    );

    await expect(wrapped({ input: 'test' })).rejects.toBe(graphInterrupt);
  });

  it('does not mask the original error when interrupt-like getters throw', async () => {
    const originalError = new Error('boom');
    const thrownValue = Object.create(null) as { name?: string; constructor?: unknown };
    Object.defineProperty(thrownValue, 'name', {
      get() {
        throw originalError;
      },
    });
    Object.defineProperty(thrownValue, 'constructor', {
      get() {
        throw originalError;
      },
    });

    const wrapped = withErrorHandling(
      async () => {
        throw thrownValue;
      },
      'test-node'
    );

    const result = await wrapped({ input: 'test' });
    expect(result).toEqual({
      status: 'failed',
      error: 'Unknown error',
    });
  });

  it('returns fallback status and error even when state omits optional channels', async () => {
    type MinimalState = { input: string; status?: string; error?: string };
    const wrapped = withErrorHandling<MinimalState>(
      async () => {
        throw new Error('boom');
      },
      'test-node'
    );

    const result = await wrapped({ input: 'test' });
    expect(result.status).toBe('failed');
    expect(result.error).toBe('boom');
  });
});
