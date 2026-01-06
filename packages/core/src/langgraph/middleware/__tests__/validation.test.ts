import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import type { NodeFunction } from '../types.js';
import { withValidation, type ValidationOptions } from '../validation.js';

interface TestState {
  input: string;
  output?: string;
  count?: number;
}

const TestStateSchema = z.object({
  input: z.string(),
  output: z.string().optional(),
  count: z.number().optional(),
});

describe('Validation Middleware', () => {
  describe('Input Validation', () => {
    it('should validate input with Zod schema', async () => {
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));

      const validatedNode = withValidation(node, {
        inputSchema: TestStateSchema,
        mode: 'input',
      });

      const validState: TestState = { input: 'test', count: 5 };
      await validatedNode(validState);

      expect(node).toHaveBeenCalledWith(validState);
    });

    it('should reject invalid input', async () => {
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));

      const validatedNode = withValidation(node, {
        inputSchema: TestStateSchema,
        mode: 'input',
      });

      const invalidState = { input: 123 } as any; // Invalid: input should be string

      await expect(validatedNode(invalidState)).rejects.toThrow();
      expect(node).not.toHaveBeenCalled();
    });

    it('should use custom input validator', async () => {
      const nodeMock = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));
      const node: NodeFunction<TestState> = nodeMock;
      const customValidator = vi.fn((state: TestState) => state.input.length > 3);

      const validatedNode = withValidation(node, {
        inputValidator: customValidator,
        mode: 'input',
      });

      // Valid input
      await validatedNode({ input: 'test' });
      expect(customValidator).toHaveBeenCalled();
      expect(nodeMock).toHaveBeenCalled();

      // Invalid input
      customValidator.mockClear();
      nodeMock.mockClear();
      await expect(validatedNode({ input: 'ab' })).rejects.toThrow('custom validator returned false');
      expect(customValidator).toHaveBeenCalled();
      expect(nodeMock).not.toHaveBeenCalled();
    });

    it('should call onValidationSuccess for valid input', async () => {
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));
      const onValidationSuccess = vi.fn();

      const validatedNode = withValidation(node, {
        inputSchema: TestStateSchema,
        mode: 'input',
        onValidationSuccess,
      });

      const state: TestState = { input: 'test' };
      await validatedNode(state);

      expect(onValidationSuccess).toHaveBeenCalledWith(state, 'input');
    });
  });

  describe('Output Validation', () => {
    it('should validate output with Zod schema', async () => {
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));

      const validatedNode = withValidation(node, {
        outputSchema: TestStateSchema,
        mode: 'output',
      });

      const result = await validatedNode({ input: 'test' });
      expect(result).toEqual({ input: 'test', output: 'result' });
    });

    it('should reject invalid output', async () => {
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 123 } as any));

      const validatedNode = withValidation(node, {
        outputSchema: TestStateSchema,
        mode: 'output',
      });

      await expect(validatedNode({ input: 'test' })).rejects.toThrow();
    });

    it('should use custom output validator', async () => {
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));
      const customValidator = vi.fn((state: TestState | Partial<TestState>) => 
        state.output !== undefined && state.output.length > 3
      );

      const validatedNode = withValidation(node, {
        outputValidator: customValidator,
        mode: 'output',
      });

      await validatedNode({ input: 'test' });
      expect(customValidator).toHaveBeenCalled();
    });

    it('should call onValidationSuccess for valid output', async () => {
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));
      const onValidationSuccess = vi.fn();

      const validatedNode = withValidation(node, {
        outputSchema: TestStateSchema,
        mode: 'output',
        onValidationSuccess,
      });

      const result = await validatedNode({ input: 'test' });

      expect(onValidationSuccess).toHaveBeenCalledWith(result, 'output');
    });
  });

  describe('Both Input and Output Validation', () => {
    it('should validate both input and output', async () => {
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));

      const validatedNode = withValidation(node, {
        inputSchema: TestStateSchema,
        outputSchema: TestStateSchema,
        mode: 'both',
      });

      const result = await validatedNode({ input: 'test' });
      expect(result).toEqual({ input: 'test', output: 'result' });
    });
  });

  describe('Error Handling', () => {
    it('should use custom error handler', async () => {
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));
      const onValidationError = vi.fn((error, state) => ({ ...state, error: 'validation failed' }));

      const validatedNode = withValidation(node, {
        inputSchema: TestStateSchema,
        mode: 'input',
        onValidationError,
      });

      const invalidState = { input: 123 } as any;
      const result = await validatedNode(invalidState);

      expect(onValidationError).toHaveBeenCalled();
      expect(result).toEqual({ input: 123, error: 'validation failed' });
    });

    it('should not throw when throwOnError is false', async () => {
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => ({ ...state, output: 'result' }));

      const validatedNode = withValidation(node, {
        inputSchema: TestStateSchema,
        mode: 'input',
        throwOnError: false,
      });

      const invalidState = { input: 123 } as any;
      const result = await validatedNode(invalidState);

      // Should return state unchanged
      expect(result).toEqual(invalidState);
      expect(node).not.toHaveBeenCalled();
    });
  });

  describe('Strip Unknown Properties', () => {
    it('should strip unknown properties when enabled', async () => {
      const node: NodeFunction<TestState> = vi.fn(async (state: TestState) => state);

      const validatedNode = withValidation(node, {
        inputSchema: TestStateSchema,
        mode: 'input',
        stripUnknown: true,
      });

      const stateWithExtra = { input: 'test', extra: 'should be removed' } as any;
      await validatedNode(stateWithExtra);

      // Node should receive state without extra property
      expect(node).toHaveBeenCalledWith({ input: 'test' });
    });
  });
});

