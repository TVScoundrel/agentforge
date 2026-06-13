import { describe, it, expect } from 'vitest';
import { mergeState, type StateChannelConfig } from '../../../src/langgraph/state.js';

describe('LangGraph State Utilities', () => {
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
        count: {},
        messages: {
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
