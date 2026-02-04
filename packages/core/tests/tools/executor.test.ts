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
        'Tool must implement either invoke() or execute() method'
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
});

