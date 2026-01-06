import { describe, it, expect, vi } from 'vitest';
import { withLogging, type LoggingOptions } from '../logging.js';
import { createLogger, LogLevel } from '../../observability/logger.js';
import type { NodeFunction } from '../types.js';

interface TestState {
  value: number;
  message?: string;
}

describe('Logging Middleware', () => {
  describe('withLogging()', () => {
    it('should log node execution with default options', async () => {
      const node: NodeFunction<TestState> = async (state) => ({
        ...state,
        value: state.value + 1,
      });

      const logSpy = vi.fn();
      const logger = {
        debug: vi.fn(),
        info: logSpy,
        warn: vi.fn(),
        error: vi.fn(),
        withContext: vi.fn(),
      };

      const loggedNode = withLogging({
        logger,
        name: 'test-node',
      })(node);

      const result = await loggedNode({ value: 1 });

      expect(result).toEqual({ value: 2 });
      expect(logSpy).toHaveBeenCalledTimes(2); // Start and complete
      expect(logSpy).toHaveBeenCalledWith('Node execution started', expect.any(Object));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Node execution completed'), expect.any(Object));
    });

    it('should log execution duration', async () => {
      const node: NodeFunction<TestState> = async (state) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { ...state, value: state.value + 1 };
      };

      const logSpy = vi.fn();
      const logger = {
        debug: vi.fn(),
        info: logSpy,
        warn: vi.fn(),
        error: vi.fn(),
        withContext: vi.fn(),
      };

      const loggedNode = withLogging({
        logger,
        logDuration: true,
      })(node);

      await loggedNode({ value: 1 });

      const completionCall = logSpy.mock.calls.find((call) =>
        call[0].includes('completed')
      );
      expect(completionCall).toBeDefined();
      expect(completionCall![0]).toMatch(/\d+ms/);
    });

    it('should log errors', async () => {
      const error = new Error('Test error');
      const node: NodeFunction<TestState> = async () => {
        throw error;
      };

      const errorSpy = vi.fn();
      const logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: errorSpy,
        withContext: vi.fn(),
      };

      const loggedNode = withLogging({
        logger,
        logErrors: true,
      })(node);

      await expect(loggedNode({ value: 1 })).rejects.toThrow('Test error');
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Node execution failed'),
        expect.objectContaining({
          error: 'Test error',
        })
      );
    });

    it('should respect logInput option', async () => {
      const node: NodeFunction<TestState> = async (state) => state;

      const logSpy = vi.fn();
      const logger = {
        debug: vi.fn(),
        info: logSpy,
        warn: vi.fn(),
        error: vi.fn(),
        withContext: vi.fn(),
      };

      const loggedNode = withLogging({
        logger,
        logInput: false,
        logOutput: true,
      })(node);

      await loggedNode({ value: 1 });

      expect(logSpy).toHaveBeenCalledTimes(1); // Only output
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('completed'), expect.any(Object));
    });

    it('should respect logOutput option', async () => {
      const node: NodeFunction<TestState> = async (state) => state;

      const logSpy = vi.fn();
      const logger = {
        debug: vi.fn(),
        info: logSpy,
        warn: vi.fn(),
        error: vi.fn(),
        withContext: vi.fn(),
      };

      const loggedNode = withLogging({
        logger,
        logInput: true,
        logOutput: false,
      })(node);

      await loggedNode({ value: 1 });

      expect(logSpy).toHaveBeenCalledTimes(1); // Only input
      expect(logSpy).toHaveBeenCalledWith('Node execution started', expect.any(Object));
    });

    it('should use custom extractData function', async () => {
      const node: NodeFunction<TestState> = async (state) => ({
        ...state,
        message: 'secret',
      });

      const logSpy = vi.fn();
      const logger = {
        debug: vi.fn(),
        info: logSpy,
        warn: vi.fn(),
        error: vi.fn(),
        withContext: vi.fn(),
      };

      const extractData = <State,>(state: State) => ({ value: (state as TestState).value });

      const loggedNode = withLogging({
        logger,
        extractData,
      })(node);

      await loggedNode({ value: 1 });

      // Check that only extracted data is logged
      const calls = logSpy.mock.calls;
      calls.forEach((call) => {
        const data = call[1];
        expect(data).not.toHaveProperty('message');
        expect(data).toHaveProperty('value');
      });
    });

    it('should call onStart callback', async () => {
      const node: NodeFunction<TestState> = async (state) => state;
      const onStart = vi.fn();

      const logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        withContext: vi.fn(),
      };

      const loggedNode = withLogging({
        logger,
        onStart,
      })(node);

      await loggedNode({ value: 1 });

      expect(onStart).toHaveBeenCalledWith({ value: 1 });
    });

    it('should call onComplete callback', async () => {
      const node: NodeFunction<TestState> = async (state) => ({
        ...state,
        value: state.value + 1,
      });
      const onComplete = vi.fn();

      const logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        withContext: vi.fn(),
      };

      const loggedNode = withLogging({
        logger,
        onComplete,
      })(node);

      await loggedNode({ value: 1 });

      expect(onComplete).toHaveBeenCalledWith(
        { value: 1 },
        { value: 2 },
        expect.any(Number)
      );
    });

    it('should call onError callback', async () => {
      const error = new Error('Test error');
      const node: NodeFunction<TestState> = async () => {
        throw error;
      };
      const onError = vi.fn();

      const logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        withContext: vi.fn(),
      };

      const loggedNode = withLogging({
        logger,
        onError,
      })(node);

      await expect(loggedNode({ value: 1 })).rejects.toThrow('Test error');
      expect(onError).toHaveBeenCalledWith(error, expect.any(Number));
    });
  });
});

