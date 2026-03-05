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

  it('returns fallback status and error even when state omits optional channels', async () => {
    type MinimalState = { input: string };
    const wrapped = withErrorHandling<MinimalState>(
      async () => {
        throw new Error('boom');
      },
      'test-node'
    );

    const result = await wrapped({ input: 'test' });
    const fallback = result as { status?: string; error?: string };

    expect(fallback.status).toBe('failed');
    expect(fallback.error).toBe('boom');
  });
});
