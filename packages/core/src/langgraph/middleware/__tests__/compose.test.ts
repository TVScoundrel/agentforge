/**
 * Tests for middleware composition utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  compose,
  composeWithOptions,
  chain,
  MiddlewareChain,
  createMiddlewareContext,
} from '../compose.js';
import type { NodeFunction, SimpleMiddleware } from '../types.js';

interface TestState {
  value: number;
  logs: string[];
}

describe('Middleware Composition', () => {
  let testNode: NodeFunction<TestState>;

  beforeEach(() => {
    testNode = async (state: TestState) => ({
      ...state,
      value: state.value * 2,
    });
  });

  describe('compose', () => {
    it('should compose middleware in correct order', async () => {
      const middleware1: SimpleMiddleware<TestState> = (node) => async (state) => {
        const newState = { ...state, logs: [...state.logs, 'mw1-before'] };
        const result = await node(newState);
        return { ...result, logs: [...result.logs, 'mw1-after'] };
      };

      const middleware2: SimpleMiddleware<TestState> = (node) => async (state) => {
        const newState = { ...state, logs: [...state.logs, 'mw2-before'] };
        const result = await node(newState);
        return { ...result, logs: [...result.logs, 'mw2-after'] };
      };

      const enhanced = compose(middleware1, middleware2)(testNode);
      const result = await enhanced({ value: 5, logs: [] });

      expect(result.logs).toEqual([
        'mw1-before',
        'mw2-before',
        'mw2-after',
        'mw1-after',
      ]);
      expect(result.value).toBe(10);
    });

    it('should work with single middleware', async () => {
      const middleware: SimpleMiddleware<TestState> = (node) => async (state) => {
        const result = await node(state);
        return { ...result, logs: [...result.logs, 'middleware'] };
      };

      const enhanced = compose(middleware)(testNode);
      const result = await enhanced({ value: 3, logs: [] });

      expect(result.logs).toEqual(['middleware']);
      expect(result.value).toBe(6);
    });

    it('should work with no middleware', async () => {
      const enhanced = compose()(testNode);
      const result = await enhanced({ value: 4, logs: [] });

      expect(result.logs).toEqual([]);
      expect(result.value).toBe(8);
    });

    it('should handle async middleware', async () => {
      const asyncMiddleware: SimpleMiddleware<TestState> = (node) => async (state) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        const result = await node(state);
        return { ...result, logs: [...result.logs, 'async'] };
      };

      const enhanced = compose(asyncMiddleware)(testNode);
      const result = await enhanced({ value: 2, logs: [] });

      expect(result.logs).toEqual(['async']);
      expect(result.value).toBe(4);
    });

    it('should propagate errors through middleware chain', async () => {
      const errorNode: NodeFunction<TestState> = async () => {
        throw new Error('Node error');
      };

      const middleware: SimpleMiddleware<TestState> = (node) => async (state) => {
        try {
          return await node(state);
        } catch (error) {
          return { ...state, logs: [...state.logs, 'caught'] };
        }
      };

      const enhanced = compose(middleware)(errorNode);
      const result = await enhanced({ value: 1, logs: [] });

      expect(result.logs).toEqual(['caught']);
    });
  });

  describe('composeWithOptions', () => {
    it('should reverse middleware order when reverse=true', async () => {
      const middleware1: SimpleMiddleware<TestState> = (node) => async (state) => {
        const result = await node(state);
        return { ...result, logs: [...result.logs, 'mw1'] };
      };

      const middleware2: SimpleMiddleware<TestState> = (node) => async (state) => {
        const result = await node(state);
        return { ...result, logs: [...result.logs, 'mw2'] };
      };

      const enhanced = composeWithOptions(
        { reverse: true },
        middleware1,
        middleware2
      )(testNode);

      const result = await enhanced({ value: 1, logs: [] });

      // When reversed, mw2 wraps mw1, so mw1 executes first
      expect(result.logs).toEqual(['mw1', 'mw2']);
    });

    it('should add name to error messages when catchErrors=true', async () => {
      const errorNode: NodeFunction<TestState> = async () => {
        throw new Error('Original error');
      };

      const enhanced = composeWithOptions(
        { name: 'test-chain', catchErrors: true },
      )(errorNode);

      await expect(enhanced({ value: 1, logs: [] })).rejects.toThrow('[test-chain] Original error');
    });

    it('should not catch errors when catchErrors=false', async () => {
      const errorNode: NodeFunction<TestState> = async () => {
        throw new Error('Original error');
      };

      const enhanced = composeWithOptions(
        { catchErrors: false },
      )(errorNode);

      await expect(enhanced({ value: 1, logs: [] })).rejects.toThrow('Original error');
    });
  });

  describe('MiddlewareChain', () => {
    it('should build middleware chain fluently', async () => {
      const middleware1: SimpleMiddleware<TestState> = (node) => async (state) => {
        const result = await node(state);
        return { ...result, logs: [...result.logs, 'mw1'] };
      };

      const middleware2: SimpleMiddleware<TestState> = (node) => async (state) => {
        const result = await node(state);
        return { ...result, logs: [...result.logs, 'mw2'] };
      };

      const enhanced = chain<TestState>()
        .use(middleware1)
        .use(middleware2)
        .build(testNode);

      const result = await enhanced({ value: 1, logs: [] });

      // Middleware are applied right to left, so mw2 wraps mw1
      expect(result.logs).toEqual(['mw2', 'mw1']);
    });

    it('should track middleware count', () => {
      const middleware: SimpleMiddleware<TestState> = (node) => node;

      const chainBuilder = chain<TestState>()
        .use(middleware)
        .use(middleware);

      expect(chainBuilder.length).toBe(2);
    });

    it('should return original node when no middleware', async () => {
      const enhanced = chain<TestState>().build(testNode);
      const result = await enhanced({ value: 5, logs: [] });

      expect(result.value).toBe(10);
    });
  });

  describe('createMiddlewareContext', () => {
    it('should create context with unique execution ID', () => {
      const context1 = createMiddlewareContext();
      const context2 = createMiddlewareContext();

      expect(context1.executionId).toBeDefined();
      expect(context2.executionId).toBeDefined();
      expect(context1.executionId).not.toBe(context2.executionId);
    });

    it('should initialize with empty data and stack', () => {
      const context = createMiddlewareContext();

      expect(context.data).toEqual({});
      expect(context.middlewareStack).toEqual([]);
    });

    it('should have start time', () => {
      const before = Date.now();
      const context = createMiddlewareContext();
      const after = Date.now();

      expect(context.startTime).toBeGreaterThanOrEqual(before);
      expect(context.startTime).toBeLessThanOrEqual(after);
    });
  });
});

