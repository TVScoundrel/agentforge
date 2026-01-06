import { z } from 'zod';
import type { NodeFunction } from './types.js';

/**
 * Validation mode
 */
export type ValidationMode = 'input' | 'output' | 'both';

/**
 * Custom validator function
 */
export type ValidatorFunction<T> = (value: T) => boolean | Promise<boolean>;

/**
 * Validation error handler
 */
export type ValidationErrorHandler<State> = (
  error: z.ZodError | Error,
  state: State,
  mode: 'input' | 'output'
) => State | Partial<State> | never;

/**
 * Validation options
 */
export interface ValidationOptions<State> {
  /**
   * Zod schema for input validation
   */
  inputSchema?: z.ZodSchema<State>;

  /**
   * Zod schema for output validation
   */
  outputSchema?: z.ZodSchema<State | Partial<State>>;

  /**
   * Custom input validator function
   */
  inputValidator?: ValidatorFunction<State>;

  /**
   * Custom output validator function
   */
  outputValidator?: ValidatorFunction<State | Partial<State>>;

  /**
   * Validation mode
   * @default 'both'
   */
  mode?: ValidationMode;

  /**
   * Whether to throw on validation error
   * @default true
   */
  throwOnError?: boolean;

  /**
   * Custom error handler
   */
  onValidationError?: ValidationErrorHandler<State>;

  /**
   * Callback when validation succeeds
   */
  onValidationSuccess?: (state: State | Partial<State>, mode: 'input' | 'output') => void;

  /**
   * Whether to strip unknown properties
   * @default false
   */
  stripUnknown?: boolean;
}

/**
 * Validation middleware
 */
export function withValidation<State>(
  node: NodeFunction<State>,
  options: ValidationOptions<State>
): NodeFunction<State> {
  const {
    inputSchema,
    outputSchema,
    inputValidator,
    outputValidator,
    mode = 'both',
    throwOnError = true,
    onValidationError,
    onValidationSuccess,
    stripUnknown = false,
  } = options;

  return async (state: State): Promise<State | Partial<State>> => {
    // Input validation
    if (mode === 'input' || mode === 'both') {
      try {
        // Zod schema validation
        if (inputSchema) {
          const validated = inputSchema.parse(state);
          state = validated as State;
        }

        // Custom validator
        if (inputValidator) {
          const isValid = await Promise.resolve(inputValidator(state));
          if (!isValid) {
            throw new Error('Input validation failed: custom validator returned false');
          }
        }

        if (onValidationSuccess) {
          onValidationSuccess(state, 'input');
        }
      } catch (error) {
        if (onValidationError) {
          return onValidationError(error as z.ZodError | Error, state, 'input');
        }
        if (throwOnError) {
          throw error;
        }
        // Return state unchanged if not throwing
        return state;
      }
    }

    // Execute node
    const result = await Promise.resolve(node(state));

    // Output validation
    if (mode === 'output' || mode === 'both') {
      try {
        // Zod schema validation
        if (outputSchema) {
          const validated = outputSchema.parse(result);

          if (onValidationSuccess) {
            onValidationSuccess(validated, 'output');
          }

          return validated;
        }

        // Custom validator
        if (outputValidator) {
          const isValid = await Promise.resolve(outputValidator(result));
          if (!isValid) {
            throw new Error('Output validation failed: custom validator returned false');
          }
        }

        if (onValidationSuccess) {
          onValidationSuccess(result, 'output');
        }
      } catch (error) {
        if (onValidationError) {
          return onValidationError(error as z.ZodError | Error, state, 'output');
        }
        if (throwOnError) {
          throw error;
        }
      }
    }

    return result;
  };
}

