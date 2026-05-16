import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createCalculatorTool,
  createDelayedTool,
  createEchoTool,
  createErrorTool,
  createMockTool,
} from '../src/index.js';

describe('mock tool factory', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses the default schema and stringifies input when no implementation is provided', async () => {
    const tool = createMockTool();

    await expect(tool.invoke({ input: 'hello' })).resolves.toBe(
      'Mock result: {"input":"hello"}',
    );
  });

  it('supports schema-driven implementations', async () => {
    const tool = createMockTool({
      schema: createEchoTool().schema,
      implementation: async ({ message }) => `Handled: ${message.toUpperCase()}`,
    });

    await expect(tool.invoke({ message: 'hello' })).resolves.toBe('Handled: HELLO');
  });

  it('preserves delayed tool behavior', async () => {
    vi.useFakeTimers();
    const tool = createDelayedTool('delayed_tool', 5);
    const resultPromise = tool.invoke({ input: 'hello' });

    await vi.advanceTimersByTimeAsync(4);
    expect(await Promise.race([resultPromise.then(() => 'resolved'), Promise.resolve('pending')])).toBe(
      'pending',
    );

    await vi.advanceTimersByTimeAsync(1);
    await expect(resultPromise).resolves.toBe('Delayed result: hello');
  });

  it('preserves forced error behavior', async () => {
    const tool = createErrorTool('error_tool', 'Boom');

    await expect(tool.invoke({ input: 'ignored' })).rejects.toThrow('Boom');
  });

  it('preserves echo and calculator helper behavior', async () => {
    const echoTool = createEchoTool();
    const calculatorTool = createCalculatorTool();

    await expect(echoTool.invoke({ message: 'hello' })).resolves.toBe('Echo: hello');
    await expect(
      calculatorTool.invoke({ operation: 'multiply', a: 6, b: 7 }),
    ).resolves.toBe('42');
  });

  it('applies shouldError even when a custom implementation is provided', async () => {
    const tool = createMockTool({
      schema: createEchoTool().schema,
      shouldError: true,
      errorMessage: 'forced failure',
      implementation: async ({ message }) => `Handled: ${message}`,
    });

    await expect(tool.invoke({ message: 'hello' })).rejects.toThrow('forced failure');
  });
});
