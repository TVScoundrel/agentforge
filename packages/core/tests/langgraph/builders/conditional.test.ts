import { describe, it, expect } from 'vitest';
import { END } from '@langchain/langgraph';
import {
  createConditionalRouter,
  createBinaryRouter,
  createMultiRouter,
} from '../../../src/langgraph/builders/conditional';

describe('Conditional Routing Utilities', () => {
  interface TestState {
    shouldEnd: boolean;
    needsTools: boolean;
    status: 'pending' | 'complete' | 'error';
    value: number;
  }

  describe('createConditionalRouter', () => {
    it('should create a conditional router with multiple routes', () => {
      const router = createConditionalRouter<TestState>({
        routes: {
          continue: 'agent',
          end: END,
          tools: 'tools',
        },
        condition: (state) => {
          if (state.shouldEnd) return 'end';
          if (state.needsTools) return 'tools';
          return 'continue';
        },
      });

      expect(router.routes).toEqual({
        continue: 'agent',
        end: END,
        tools: 'tools',
      });

      // Test condition function
      expect(router.condition({ shouldEnd: true, needsTools: false, status: 'pending', value: 0 })).toBe('end');
      expect(router.condition({ shouldEnd: false, needsTools: true, status: 'pending', value: 0 })).toBe('tools');
      expect(router.condition({ shouldEnd: false, needsTools: false, status: 'pending', value: 0 })).toBe('continue');
    });

    it('should throw error for empty routes', () => {
      expect(() => {
        createConditionalRouter<TestState>({
          routes: {},
          condition: (state) => 'default',
        });
      }).toThrow('Conditional router must have at least one route');
    });

    it('should throw error for missing condition function', () => {
      expect(() => {
        createConditionalRouter<TestState>({
          routes: { default: 'node' },
          condition: null as any,
        });
      }).toThrow('Conditional router must have a condition function');
    });

    it('should support optional description', () => {
      const router = createConditionalRouter<TestState>({
        routes: { default: 'node' },
        condition: (state) => 'default',
        description: 'Test router',
      });

      expect(router.description).toBe('Test router');
    });
  });

  describe('createBinaryRouter', () => {
    it('should create a binary router for true/false conditions', () => {
      const router = createBinaryRouter<TestState>({
        condition: (state) => state.shouldEnd,
        ifTrue: END,
        ifFalse: 'continue',
      });

      expect(router.routes).toEqual({
        true: END,
        false: 'continue',
      });

      // Test condition function
      expect(router.condition({ shouldEnd: true, needsTools: false, status: 'pending', value: 0 })).toBe('true');
      expect(router.condition({ shouldEnd: false, needsTools: false, status: 'pending', value: 0 })).toBe('false');
    });

    it('should handle complex boolean conditions', () => {
      const router = createBinaryRouter<TestState>({
        condition: (state) => state.value > 10 && !state.shouldEnd,
        ifTrue: 'process',
        ifFalse: 'skip',
      });

      expect(router.condition({ shouldEnd: false, needsTools: false, status: 'pending', value: 15 })).toBe('true');
      expect(router.condition({ shouldEnd: false, needsTools: false, status: 'pending', value: 5 })).toBe('false');
      expect(router.condition({ shouldEnd: true, needsTools: false, status: 'pending', value: 15 })).toBe('false');
    });

    it('should support optional description', () => {
      const router = createBinaryRouter<TestState>({
        condition: (state) => state.shouldEnd,
        ifTrue: END,
        ifFalse: 'continue',
        description: 'End check',
      });

      expect(router.description).toBe('End check');
    });
  });

  describe('createMultiRouter', () => {
    it('should create a multi-way router based on discriminator', () => {
      const router = createMultiRouter<TestState>({
        discriminator: (state) => state.status,
        routes: {
          pending: 'process',
          complete: END,
          error: 'error_handler',
        },
      });

      expect(router.routes).toEqual({
        pending: 'process',
        complete: END,
        error: 'error_handler',
      });

      // Test condition function
      expect(router.condition({ shouldEnd: false, needsTools: false, status: 'pending', value: 0 })).toBe('pending');
      expect(router.condition({ shouldEnd: false, needsTools: false, status: 'complete', value: 0 })).toBe('complete');
      expect(router.condition({ shouldEnd: false, needsTools: false, status: 'error', value: 0 })).toBe('error');
    });

    it('should use default route when discriminator value not in routes', () => {
      const router = createMultiRouter<TestState>({
        discriminator: (state) => state.status,
        routes: {
          pending: 'process',
          complete: END,
        },
        default: 'pending',
      });

      // 'error' is not in routes, should use default
      expect(router.condition({ shouldEnd: false, needsTools: false, status: 'error', value: 0 })).toBe('pending');
    });

    it('should throw error when no route found and no default', () => {
      const router = createMultiRouter<TestState>({
        discriminator: (state) => state.status,
        routes: {
          pending: 'process',
          complete: END,
        },
      });

      expect(() => {
        router.condition({ shouldEnd: false, needsTools: false, status: 'error', value: 0 });
      }).toThrow('No route found for discriminator value: error');
    });

    it('should support optional description', () => {
      const router = createMultiRouter<TestState>({
        discriminator: (state) => state.status,
        routes: {
          pending: 'process',
          complete: END,
        },
        description: 'Status router',
      });

      expect(router.description).toBe('Status router');
    });
  });
});

