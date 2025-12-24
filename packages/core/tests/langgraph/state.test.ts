import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  createStateAnnotation,
  validateState,
  mergeState,
  type StateChannelConfig,
} from '../../src/langgraph/state.js';

describe('LangGraph State Utilities', () => {
  describe('createStateAnnotation', () => {
    it('should create annotation with simple channels', () => {
      const annotation = createStateAnnotation({
        count: {
          default: () => 0,
          description: 'Counter value',
        },
        name: {
          default: () => '',
          description: 'User name',
        },
      });

      expect(annotation).toBeDefined();
      expect(annotation.spec).toBeDefined();
      // State is a type, not a runtime value
      expect(annotation.spec.count).toBeDefined();
      expect(annotation.spec.name).toBeDefined();
    });

    it('should create annotation with reducer channels', () => {
      const annotation = createStateAnnotation({
        messages: {
          reducer: (left: string[], right: string[]) => [...left, ...right],
          default: () => [],
          description: 'Message list',
        },
      });

      expect(annotation).toBeDefined();
      expect(annotation.spec).toBeDefined();
    });

    it('should create annotation with Zod schemas', () => {
      const annotation = createStateAnnotation({
        count: {
          schema: z.number(),
          default: () => 0,
        },
        messages: {
          schema: z.array(z.string()),
          reducer: (left: string[], right: string[]) => [...left, ...right],
          default: () => [],
        },
      });

      expect(annotation).toBeDefined();
    });

    it('should create annotation with mixed channel types', () => {
      const annotation = createStateAnnotation({
        // Simple channel
        userId: {
          schema: z.string(),
          default: () => '',
        },
        // Reducer channel
        events: {
          schema: z.array(z.object({ type: z.string(), data: z.any() })),
          reducer: (left: any[], right: any[]) => [...left, ...right],
          default: () => [],
        },
        // Simple channel with no schema
        metadata: {
          default: () => ({}),
        },
      });

      expect(annotation).toBeDefined();
      expect(annotation.spec).toBeDefined();
    });
  });

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
        count: 'not a number', // Invalid
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

  describe('mergeState', () => {
    it('should merge state with simple replacement', () => {
      const config: Record<string, StateChannelConfig> = {
        count: {},
        name: {},
      };

      const current = { count: 1, name: 'Alice' };
      const update = { count: 2 };

      const merged = mergeState(current, update, config);

      expect(merged).toEqual({ count: 2, name: 'Alice' });
    });

    it('should merge state with reducer', () => {
      const config: Record<string, StateChannelConfig> = {
        messages: {
          reducer: (left: string[], right: string[]) => [...left, ...right],
        },
      };

      const current = { messages: ['a', 'b'] };
      const update = { messages: ['c', 'd'] };

      const merged = mergeState(current, update, config);

      expect(merged).toEqual({ messages: ['a', 'b', 'c', 'd'] });
    });

    it('should handle mixed merge strategies', () => {
      const config: Record<string, StateChannelConfig> = {
        count: {}, // Simple replacement
        messages: {
          // Reducer
          reducer: (left: string[], right: string[]) => [...left, ...right],
        },
      };

      const current = { count: 1, messages: ['a'] };
      const update = { count: 2, messages: ['b'] };

      const merged = mergeState(current, update, config);

      expect(merged).toEqual({ count: 2, messages: ['a', 'b'] });
    });

    it('should add new keys from update', () => {
      const config: Record<string, StateChannelConfig> = {
        count: {},
        name: {},
      };

      const current = { count: 1 };
      const update = { name: 'Bob' };

      const merged = mergeState(current, update, config);

      expect(merged).toEqual({ count: 1, name: 'Bob' });
    });

    it('should handle custom reducers', () => {
      const config: Record<string, StateChannelConfig> = {
        sum: {
          reducer: (left: number, right: number) => left + right,
        },
        max: {
          reducer: (left: number, right: number) => Math.max(left, right),
        },
      };

      const current = { sum: 10, max: 5 };
      const update = { sum: 5, max: 3 };

      const merged = mergeState(current, update, config);

      expect(merged).toEqual({ sum: 15, max: 5 });
    });
  });
});

