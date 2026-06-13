import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  createStateAnnotation,
  mergeState,
  type StateChannelConfig,
} from '../../../src/langgraph/state.js';

type EventRecord = {
  type: string;
  data: unknown;
};

type IncrementUpdate = {
  delta: number;
};

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
        userId: {
          schema: z.string(),
          default: () => '',
        },
        events: {
          schema: z.array(z.object({ type: z.string(), data: z.any() })),
          reducer: (left: EventRecord[], right: EventRecord[]) => [...left, ...right],
          default: () => [],
        },
        metadata: {
          default: () => ({}),
        },
      });

      expect(annotation).toBeDefined();
      expect(annotation.spec).toBeDefined();
    });

    it('should preserve inferred state and update shapes', () => {
      const annotation = createStateAnnotation({
        count: {
          schema: z.number(),
          default: () => 0,
        },
        events: {
          schema: z.array(z.object({ type: z.string(), data: z.unknown() })),
          reducer: (left: EventRecord[], right: EventRecord[]) => [...left, ...right],
          default: () => [],
        },
      });

      const initialState: typeof annotation.State = {
        count: 1,
        events: [{ type: 'created', data: { source: 'test' } }],
      };

      const update: typeof annotation.Update = {
        count: 2,
        events: [{ type: 'updated', data: { source: 'test' } }],
      };

      expect(annotation.spec.events).toBeDefined();
      expect(initialState.count).toBe(1);
      expect(update.events).toHaveLength(1);
    });

    it('should preserve explicit update types for pre-typed reducer configs', () => {
      const config: {
        count: StateChannelConfig<number, IncrementUpdate>;
      } = {
        count: {
          reducer: (left: number, right: IncrementUpdate) => left + right.delta,
          default: () => 0,
        },
      };

      const annotation = createStateAnnotation(config);
      const update: typeof annotation.Update = {
        count: { delta: 2 },
      };

      const merged = mergeState({ count: 3 }, update, config);

      expect(annotation.spec.count).toBeDefined();
      expect(merged.count).toBe(5);
    });
  });
});
