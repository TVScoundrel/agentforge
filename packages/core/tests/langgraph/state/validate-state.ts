import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateState, type StateChannelConfig } from '../../../src/langgraph/state.js';

describe('LangGraph State Utilities', () => {
  describe('validateState', () => {
    const config: Record<string, StateChannelConfig> = {
      count: {
        schema: z.number(),
        default: () => 0,
      },
      name: {
        schema: z.string(),
        default: () => '',
      },
      tags: {
        schema: z.array(z.string()),
        default: () => [],
      },
    };

    it('should validate valid state', () => {
      const state = {
        count: 42,
        name: 'Alice',
        tags: ['user', 'active'],
      };

      const validated = validateState(state, config);

      expect(validated).toEqual(state);
    });

    it('should throw on invalid state', () => {
      const state = {
        count: 'not a number',
        name: 'Alice',
        tags: ['user'],
      };

      expect(() => validateState(state, config)).toThrow(z.ZodError);
    });

    it('should use defaults for missing keys', () => {
      const state = {
        name: 'Bob',
      };

      const validated = validateState(state, config);

      expect(validated).toEqual({
        name: 'Bob',
        count: 0,
        tags: [],
      });
    });

    it('should pass through values without schemas', () => {
      const configNoSchema: Record<string, StateChannelConfig> = {
        data: {
          default: () => null,
        },
      };

      const state = {
        data: { anything: 'goes' },
      };

      const validated = validateState(state, configNoSchema);

      expect(validated).toEqual(state);
    });

    it('should validate nested objects', () => {
      const configNested: Record<string, StateChannelConfig> = {
        user: {
          schema: z.object({
            id: z.string(),
            age: z.number(),
          }),
        },
      };

      const state = {
        user: { id: 'user-123', age: 30 },
      };

      const validated = validateState(state, configNested);

      expect(validated).toEqual(state);
    });
  });
});
