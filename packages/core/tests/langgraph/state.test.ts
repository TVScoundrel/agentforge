import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { StateGraph, END } from '@langchain/langgraph';
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

  describe('Defaults for non-reducer channels (P2 Bug Fix)', () => {
    it('should apply defaults for non-reducer channels in LangGraph workflows', async () => {
      // This test verifies the P2 bug fix: defaults declared in state configs
      // are now correctly applied for non-reducer channels

      const StateConfig = {
        // Non-reducer channel with default
        status: {
          schema: z.string(),
          default: () => 'initialized',
          description: 'Current status',
        } satisfies StateChannelConfig<string>,

        // Non-reducer channel with default
        shouldContinue: {
          schema: z.boolean(),
          default: () => true,
          description: 'Whether to continue',
        } satisfies StateChannelConfig<boolean>,

        // Reducer channel with default (this works correctly)
        messages: {
          schema: z.array(z.string()),
          reducer: (left: string[], right: string[]) => [...left, ...right],
          default: () => [],
          description: 'Messages',
        } satisfies StateChannelConfig<string[], string[]>,
      };

      const State = createStateAnnotation(StateConfig);

      // Create a simple workflow
      const workflow = new StateGraph(State)
        .addNode('start', (state) => {
          // Node doesn't set status or shouldContinue
          return { messages: ['Started'] };
        })
        .addEdge('__start__', 'start')
        .addEdge('start', END);

      const graph = workflow.compile();

      // Invoke with empty initial state
      const result = await graph.invoke({});

      // ✅ FIXED: Defaults are now applied for non-reducer channels
      expect(result.status).toBe('initialized');
      expect(result.shouldContinue).toBe(true);

      // Reducer channel defaults still work correctly
      expect(result.messages).toEqual(['Started']);
    });

    it('should show that validateState() does apply defaults correctly', () => {
      // This test shows that validateState() DOES apply defaults,
      // but users must call it explicitly

      const StateConfig = {
        status: {
          schema: z.string(),
          default: () => 'initialized',
        } satisfies StateChannelConfig<string>,
        shouldContinue: {
          schema: z.boolean(),
          default: () => true,
        } satisfies StateChannelConfig<boolean>,
      };

      // Empty state
      const state = {};

      // validateState() applies defaults
      const validated = validateState(state, StateConfig);

      expect(validated.status).toBe('initialized'); // ✅ Works
      expect(validated.shouldContinue).toBe(true); // ✅ Works
    });

    it('should use "last value wins" semantics for non-reducer channels with defaults', async () => {
      // Verify that non-reducer channels with defaults still use "last value wins"
      // semantics, not accumulation

      const StateConfig = {
        counter: {
          schema: z.number(),
          default: () => 0,
          description: 'Counter value',
        } satisfies StateChannelConfig<number>,
      };

      const State = createStateAnnotation(StateConfig);

      const workflow = new StateGraph(State)
        .addNode('node1', () => ({ counter: 5 }))
        .addNode('node2', () => ({ counter: 10 }))
        .addEdge('__start__', 'node1')
        .addEdge('node1', 'node2')
        .addEdge('node2', END);

      const graph = workflow.compile();
      const result = await graph.invoke({});

      // Should be 10 (last value), not 15 (sum)
      expect(result.counter).toBe(10);
    });

    it('should handle non-reducer channels without defaults', async () => {
      // Verify that non-reducer channels without defaults still work

      const StateConfig = {
        value: {
          schema: z.string().optional(),
          description: 'Optional value',
        } satisfies StateChannelConfig<string | undefined>,
      };

      const State = createStateAnnotation(StateConfig);

      const workflow = new StateGraph(State)
        .addNode('node1', () => ({ value: 'hello' }))
        .addEdge('__start__', 'node1')
        .addEdge('node1', END);

      const graph = workflow.compile();
      const result = await graph.invoke({});

      expect(result.value).toBe('hello');
    });

    it('should allow nodes to explicitly set undefined and override defaults', async () => {
      // Residual risk: If a node explicitly returns { key: undefined },
      // the reducer will set the channel to undefined and override the default.
      // This is expected behavior - nodes should omit keys instead of writing undefined.

      const StateConfig = {
        status: {
          schema: z.string().optional(),
          default: () => 'initialized',
          description: 'Current status',
        } satisfies StateChannelConfig<string | undefined>,
      };

      const State = createStateAnnotation(StateConfig);

      const workflow = new StateGraph(State)
        .addNode('node1', () => ({ status: undefined })) // Explicitly set to undefined
        .addEdge('__start__', 'node1')
        .addEdge('node1', END);

      const graph = workflow.compile();
      const result = await graph.invoke({});

      // The explicit undefined overrides the default
      expect(result.status).toBeUndefined();

      // Best practice: Nodes should omit keys instead of setting them to undefined
      // ✅ Good: return {}
      // ❌ Bad:  return { status: undefined }
    });

    it('should preserve defaults when nodes omit keys (best practice)', async () => {
      // This demonstrates the correct pattern: nodes should omit keys
      // they don't want to update, rather than setting them to undefined

      const StateConfig = {
        status: {
          schema: z.string(),
          default: () => 'initialized',
          description: 'Current status',
        } satisfies StateChannelConfig<string>,
        counter: {
          schema: z.number(),
          reducer: (left: number, right: number) => left + right,
          default: () => 0,
          description: 'Counter',
        } satisfies StateChannelConfig<number, number>,
      };

      const State = createStateAnnotation(StateConfig);

      const workflow = new StateGraph(State)
        .addNode('node1', () => ({ counter: 1 })) // Omit status - don't set it to undefined
        .addNode('node2', () => ({ counter: 2 })) // Omit status again
        .addEdge('__start__', 'node1')
        .addEdge('node1', 'node2')
        .addEdge('node2', END);

      const graph = workflow.compile();
      const result = await graph.invoke({});

      // Status keeps its default because nodes omitted it
      expect(result.status).toBe('initialized');
      // Counter accumulates because it has a reducer
      expect(result.counter).toBe(3);
    });
  });
});

