import { describe, expect, it, vi } from 'vitest';
import { createToolExecutor } from '../../../src/tools/executor.js';

describe('Tool Executor retry logic', () => {
  it('should retry tool with execute method', async () => {
    let attempts = 0;
    const tool = {
      name: 'retry-execute-tool',
      execute: async (_input: string) => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return `Success after ${attempts} attempts`;
      },
    };

    const executor = createToolExecutor({
      retryPolicy: {
        maxAttempts: 3,
        backoff: 'fixed',
        initialDelay: 10,
      },
    });

    const result = await executor.execute(tool, 'test');

    expect(result).toBe('Success after 3 attempts');
    expect(attempts).toBe(3);
  });

  it('should retry tool with invoke method', async () => {
    let attempts = 0;
    const tool = {
      name: 'retry-invoke-tool',
      invoke: async (_input: string) => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary failure');
        }
        return `Success after ${attempts} attempts`;
      },
    };

    const executor = createToolExecutor({
      retryPolicy: {
        maxAttempts: 3,
        backoff: 'fixed',
        initialDelay: 10,
      },
    });

    const result = await executor.execute(tool, 'test');

    expect(result).toBe('Success after 2 attempts');
    expect(attempts).toBe(2);
  });

  it('should throw a clear error when maxAttempts is less than 1', async () => {
    const invoke = vi.fn(async (input: string) => `Result: ${input}`);
    const tool = {
      name: 'invalid-retry-policy-tool',
      invoke,
    };

    const executor = createToolExecutor({
      retryPolicy: {
        maxAttempts: 0,
        backoff: 'fixed',
        initialDelay: 10,
      },
    });

    await expect(executor.execute(tool, 'test')).rejects.toThrow(
      'Invalid retry policy: maxAttempts must be an integer >= 1'
    );
    expect(invoke).not.toHaveBeenCalled();
  });
});
