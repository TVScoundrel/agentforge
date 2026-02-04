/**
 * Tests for Tool Executor
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import { createToolExecutor } from '../../src/tools/executor.js';
import { toolBuilder, ToolCategory } from '../../src/tools/index.js';

describe('Tool Executor', () => {
  describe('execute/invoke method handling', () => {
    it('should execute tool with only execute method', async () => {
      // Tool created with toolBuilder only has execute method
      const tool = toolBuilder()
        .name('execute-only-tool')
        .description('Tool with only execute method')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          input: z.string().describe('Test input'),
        }))
        .implement(async ({ input }) => `Result: ${input}`)
        .build();

      const executor = createToolExecutor();
      const result = await executor.execute(tool, { input: 'hello' });

      expect(result).toBe('Result: hello');
    });

    it('should execute tool with only invoke method (LangChain compatibility)', async () => {
      // Mock LangChain-style tool with only invoke
      const tool = {
        name: 'invoke-only-tool',
        invoke: async (input: string) => `LangChain result: ${input}`,
      };

      const executor = createToolExecutor();
      const result = await executor.execute(tool, 'test');

      expect(result).toBe('LangChain result: test');
    });

    it('should prefer invoke over execute when both are present', async () => {
      // Tool with both methods - invoke should be called
      const tool = {
        name: 'both-methods-tool',
        execute: async (input: string) => `Execute: ${input}`,
        invoke: async (input: string) => `Invoke: ${input}`,
      };

      const executor = createToolExecutor();
      const result = await executor.execute(tool, 'test');

      // Should prefer invoke (LangChain compatibility)
      expect(result).toBe('Invoke: test');
    });

    it('should throw error for tool with neither execute nor invoke', async () => {
      // Invalid tool with no execution method
      const tool = {
        name: 'invalid-tool',
        // No execute or invoke method
      };

      const executor = createToolExecutor();

      await expect(executor.execute(tool, 'test')).rejects.toThrow(
        'Tool must implement invoke() method'
      );
    });

    it('should preserve this context when calling execute', async () => {
      // Tool that relies on this context
      const tool = {
        name: 'context-tool',
        value: 'test-value',
        execute: async function(this: any, input: string) {
          return `${this.value}: ${input}`;
        },
      };

      const executor = createToolExecutor();
      const result = await executor.execute(tool, 'hello');

      expect(result).toBe('test-value: hello');
    });

    it('should preserve this context when calling invoke', async () => {
      // Tool that relies on this context
      const tool = {
        name: 'context-tool',
        value: 'test-value',
        invoke: async function(this: any, input: string) {
          return `${this.value}: ${input}`;
        },
      };

      const executor = createToolExecutor();
      const result = await executor.execute(tool, 'hello');

      expect(result).toBe('test-value: hello');
    });
  });

  describe('retry logic with execute/invoke', () => {
    it('should retry tool with execute method', async () => {
      let attempts = 0;
      const tool = {
        name: 'retry-execute-tool',
        execute: async (input: string) => {
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
        invoke: async (input: string) => {
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
  });

  describe('metrics tracking', () => {
    it('should track successful executions by priority', async () => {
      const tool = {
        name: 'test-tool',
        invoke: async (input: string) => `Result: ${input}`,
      };

      const executor = createToolExecutor();

      await executor.execute(tool, 'test1', { priority: 'high' });
      await executor.execute(tool, 'test2', { priority: 'high' });
      await executor.execute(tool, 'test3', { priority: 'normal' });

      const metrics = executor.getMetrics();

      expect(metrics.totalExecutions).toBe(3);
      expect(metrics.successfulExecutions).toBe(3);
      expect(metrics.failedExecutions).toBe(0);
      expect(metrics.byPriority.high).toBe(2);
      expect(metrics.byPriority.normal).toBe(1);
      expect(metrics.byPriority.low).toBe(0);
      expect(metrics.byPriority.critical).toBe(0);
    });

    it('should track failed executions by priority', async () => {
      const tool = {
        name: 'failing-tool',
        invoke: async (input: string) => {
          throw new Error('Tool failed');
        },
      };

      const executor = createToolExecutor();

      // Execute with different priorities and expect failures
      await expect(executor.execute(tool, 'test1', { priority: 'critical' })).rejects.toThrow();
      await expect(executor.execute(tool, 'test2', { priority: 'high' })).rejects.toThrow();
      await expect(executor.execute(tool, 'test3', { priority: 'high' })).rejects.toThrow();

      const metrics = executor.getMetrics();

      expect(metrics.totalExecutions).toBe(3);
      expect(metrics.successfulExecutions).toBe(0);
      expect(metrics.failedExecutions).toBe(3);
      expect(metrics.byPriority.critical).toBe(1);
      expect(metrics.byPriority.high).toBe(2);
      expect(metrics.byPriority.normal).toBe(0);
      expect(metrics.byPriority.low).toBe(0);
    });

    it('should track both successful and failed executions by priority', async () => {
      let shouldFail = false;
      const tool = {
        name: 'mixed-tool',
        invoke: async (input: string) => {
          if (shouldFail) {
            throw new Error('Tool failed');
          }
          return `Result: ${input}`;
        },
      };

      const executor = createToolExecutor();

      // Successful executions
      await executor.execute(tool, 'test1', { priority: 'high' });
      await executor.execute(tool, 'test2', { priority: 'normal' });

      // Failed executions
      shouldFail = true;
      await expect(executor.execute(tool, 'test3', { priority: 'high' })).rejects.toThrow();
      await expect(executor.execute(tool, 'test4', { priority: 'low' })).rejects.toThrow();

      const metrics = executor.getMetrics();

      expect(metrics.totalExecutions).toBe(4);
      expect(metrics.successfulExecutions).toBe(2);
      expect(metrics.failedExecutions).toBe(2);
      // Both successful and failed executions should be counted in byPriority
      expect(metrics.byPriority.high).toBe(2); // 1 success + 1 failure
      expect(metrics.byPriority.normal).toBe(1); // 1 success
      expect(metrics.byPriority.low).toBe(1); // 1 failure
      expect(metrics.byPriority.critical).toBe(0);
    });

    it('should reset metrics correctly', async () => {
      const tool = {
        name: 'test-tool',
        invoke: async (input: string) => `Result: ${input}`,
      };

      const executor = createToolExecutor();

      await executor.execute(tool, 'test', { priority: 'high' });

      let metrics = executor.getMetrics();
      expect(metrics.totalExecutions).toBe(1);
      expect(metrics.byPriority.high).toBe(1);

      executor.resetMetrics();

      metrics = executor.getMetrics();
      expect(metrics.totalExecutions).toBe(0);
      expect(metrics.successfulExecutions).toBe(0);
      expect(metrics.failedExecutions).toBe(0);
      expect(metrics.byPriority.high).toBe(0);
      expect(metrics.byPriority.normal).toBe(0);
      expect(metrics.byPriority.low).toBe(0);
      expect(metrics.byPriority.critical).toBe(0);
    });
  });
});

