/**
 * Tests for tool composition utilities
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  cache,
  composeTool,
  conditional,
  parallel,
  retry,
  sequential,
  timeout,
  type ComposedTool,
} from '../../src/tools/composition.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('tool composition utilities', () => {
  it('executes tools sequentially', async () => {
    const increment: ComposedTool<number, number> = {
      name: 'increment',
      description: 'Increment a number',
      invoke: async (input) => input + 1,
    };

    const double: ComposedTool<number, number> = {
      name: 'double',
      description: 'Double a number',
      invoke: async (input) => input * 2,
    };

    const composed = sequential<number>([increment, double]);
    const result = await composed.invoke(3);

    expect(result).toBe(8);
  });

  it('executes tools in parallel', async () => {
    const stringify: ComposedTool<number, string> = {
      name: 'stringify',
      description: 'Convert to prefixed string',
      invoke: async (input) => `value:${input}`,
    };

    const square: ComposedTool<number, number> = {
      name: 'square',
      description: 'Square a number',
      invoke: async (input) => input * input,
    };

    const composed = parallel([stringify, square]);
    const result = await composed.invoke(4);

    expect(result).toEqual(['value:4', 16]);
  });

  it('routes execution conditionally', async () => {
    const onTrue: ComposedTool<number, string> = {
      name: 'on-true',
      description: 'True branch',
      invoke: async (input) => `true:${input}`,
    };

    const onFalse: ComposedTool<number, string> = {
      name: 'on-false',
      description: 'False branch',
      invoke: async (input) => `false:${input}`,
    };

    const composed = conditional({
      condition: async (input) => input > 10,
      onTrue,
      onFalse,
    });

    await expect(composed.invoke(11)).resolves.toBe('true:11');
    await expect(composed.invoke(9)).resolves.toBe('false:9');
  });

  it('composes mixed steps with final result transform', async () => {
    const increment: ComposedTool<number, number> = {
      name: 'increment',
      description: 'Increment',
      invoke: async (input) => input + 1,
    };

    const halve: ComposedTool<number, number> = {
      name: 'halve',
      description: 'Halve',
      invoke: async (input) => input / 2,
    };

    const double: ComposedTool<number, number> = {
      name: 'double',
      description: 'Double',
      invoke: async (input) => input * 2,
    };

    const triple: ComposedTool<number, number> = {
      name: 'triple',
      description: 'Triple',
      invoke: async (input) => input * 3,
    };

    const composed = composeTool<number, string>({
      name: 'mixed-workflow',
      steps: [
        increment,
        {
          condition: (input) => input > 6,
          onTrue: halve,
          onFalse: increment,
        },
        [double, triple],
      ],
      transformResult: (value) => JSON.stringify(value),
    });

    const result = await composed.invoke(10);
    expect(result).toBe('[11,16.5]');
  });

  it('retries failed tools until success', async () => {
    let attempts = 0;

    const flakyTool: ComposedTool<string, string> = {
      name: 'flaky',
      description: 'Fails twice then succeeds',
      invoke: async (input) => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error('temporary failure');
        }
        return `ok:${input}`;
      },
    };

    const composed = retry(flakyTool, {
      maxAttempts: 3,
      delay: 0,
      backoff: 'linear',
    });

    const result = await composed.invoke('task');

    expect(result).toBe('ok:task');
    expect(attempts).toBe(3);
  });

  it('throws for invalid retry configuration', () => {
    const tool: ComposedTool<string, string> = {
      name: 'tool',
      description: 'Test tool',
      invoke: async (input) => input,
    };

    expect(() => retry(tool, { maxAttempts: 0 })).toThrow(
      'Invalid retry options: maxAttempts must be an integer >= 1'
    );
  });

  it('fails with a timeout error when execution exceeds limit', async () => {
    vi.useFakeTimers();

    const slowTool: ComposedTool<string, string> = {
      name: 'slow',
      description: 'Slow tool',
      invoke: async (input) =>
        new Promise((resolve) => {
          setTimeout(() => resolve(`done:${input}`), 100);
        }),
    };

    const composed = timeout(slowTool, 10);
    const promise = composed.invoke('job');
    const assertion = expect(promise).rejects.toThrow('Tool slow timed out after 10ms');

    await vi.advanceTimersByTimeAsync(10);
    await assertion;
  });

  it('returns cached values until ttl expires', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    let calls = 0;
    const sourceTool: ComposedTool<string, string> = {
      name: 'source',
      description: 'Source tool',
      invoke: async (input) => {
        calls += 1;
        return `${input}:${calls}`;
      },
    };

    const composed = cache(sourceTool, 50);

    const first = await composed.invoke('key');
    vi.setSystemTime(new Date('2026-01-01T00:00:00.040Z'));
    const second = await composed.invoke('key');
    vi.setSystemTime(new Date('2026-01-01T00:00:00.060Z'));
    const third = await composed.invoke('key');

    expect(first).toBe('key:1');
    expect(second).toBe('key:1');
    expect(third).toBe('key:2');
    expect(calls).toBe(2);
  });
});
