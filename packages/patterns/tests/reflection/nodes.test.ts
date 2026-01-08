import { describe, it, expect, vi } from 'vitest';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import {
  createGeneratorNode,
  createReflectorNode,
  createReviserNode,
  createFinisherNode,
} from '../../src/reflection/nodes.js';
import type { ReflectionStateType } from '../../src/reflection/state.js';

describe('Reflection Nodes', () => {
  describe('createGeneratorNode', () => {
    it('should generate initial response', async () => {
      const llm = new FakeListChatModel({
        responses: ['This is a generated response.'],
      });

      const node = createGeneratorNode({ model: llm });

      const state: ReflectionStateType = {
        input: 'Write a short story',
        currentResponse: undefined,
        reflections: [],
        revisions: [],
        iteration: 0,
        status: 'generating',
        maxIterations: 3,
      };

      const result = await node(state);

      expect(result.currentResponse).toBeDefined();
      expect(result.currentResponse).toContain('generated response');
      expect(result.status).toBe('reflecting');
      expect(result.iteration).toBe(1);
    });

    it('should include context from previous reflections', async () => {
      const llm = new FakeListChatModel({
        responses: ['Improved response with more detail.'],
      });

      const node = createGeneratorNode({ model: llm });

      const state: ReflectionStateType = {
        input: 'Write a short story',
        currentResponse: 'First draft',
        reflections: [
          {
            critique: 'Needs more detail',
            issues: ['Too brief'],
            suggestions: ['Add more description'],
            meetsStandards: false,
          },
        ],
        revisions: [],
        iteration: 1,
        status: 'generating',
        maxIterations: 3,
      };

      const result = await node(state);

      expect(result.currentResponse).toBeDefined();
      expect(result.status).toBe('reflecting');
    });

    it('should handle errors gracefully', async () => {
      const llm = new FakeListChatModel({
        responses: [],
      });

      // Mock the invoke to throw an error
      vi.spyOn(llm, 'invoke').mockRejectedValue(new Error('LLM error'));

      const node = createGeneratorNode({ model: llm });

      const state: ReflectionStateType = {
        input: 'Test',
        currentResponse: undefined,
        reflections: [],
        revisions: [],
        iteration: 0,
        status: 'generating',
        maxIterations: 3,
      };

      const result = await node(state);

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });
  });

  describe('createReflectorNode', () => {
    it('should create reflection from JSON response', async () => {
      const reflectionJSON = JSON.stringify({
        critique: 'Good start but needs improvement',
        issues: ['Too brief', 'Lacks examples'],
        suggestions: ['Add more detail', 'Include examples'],
        score: 6,
        meetsStandards: false,
      });

      const llm = new FakeListChatModel({
        responses: [reflectionJSON],
      });

      const node = createReflectorNode({ model: llm });

      const state: ReflectionStateType = {
        input: 'Write an essay',
        currentResponse: 'This is a short essay.',
        reflections: [],
        revisions: [],
        iteration: 1,
        status: 'reflecting',
        maxIterations: 3,
      };

      const result = await node(state);

      expect(result.reflections).toBeDefined();
      expect(result.reflections).toHaveLength(1);
      expect(result.reflections![0].score).toBe(6);
      expect(result.reflections![0].meetsStandards).toBe(false);
      expect(result.status).toBe('revising');
    });

    it('should mark as completed when standards are met', async () => {
      const reflectionJSON = JSON.stringify({
        critique: 'Excellent work',
        issues: [],
        suggestions: [],
        score: 9,
        meetsStandards: true,
      });

      const llm = new FakeListChatModel({
        responses: [reflectionJSON],
      });

      const node = createReflectorNode({ model: llm });

      const state: ReflectionStateType = {
        input: 'Write an essay',
        currentResponse: 'This is an excellent essay with great detail.',
        reflections: [],
        revisions: [],
        iteration: 1,
        status: 'reflecting',
        maxIterations: 3,
      };

      const result = await node(state);

      expect(result.reflections).toBeDefined();
      expect(result.reflections![0].meetsStandards).toBe(true);
      expect(result.status).toBe('completed');
    });

    it('should handle non-JSON responses', async () => {
      const llm = new FakeListChatModel({
        responses: ['This is a plain text critique without JSON.'],
      });

      const node = createReflectorNode({ model: llm });

      const state: ReflectionStateType = {
        input: 'Write an essay',
        currentResponse: 'Essay content',
        reflections: [],
        revisions: [],
        iteration: 1,
        status: 'reflecting',
        maxIterations: 3,
      };

      const result = await node(state);

      expect(result.reflections).toBeDefined();
      expect(result.reflections).toHaveLength(1);
      expect(result.reflections![0].critique).toContain('plain text critique');
    });

    it('should throw error if no current response', async () => {
      const llm = new FakeListChatModel({
        responses: ['{}'],
      });

      const node = createReflectorNode({ model: llm });

      const state: ReflectionStateType = {
        input: 'Write an essay',
        currentResponse: undefined,
        reflections: [],
        revisions: [],
        iteration: 1,
        status: 'reflecting',
        maxIterations: 3,
      };

      const result = await node(state);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('No current response');
    });
  });

  describe('createReviserNode', () => {
    it('should create revision based on critique', async () => {
      const llm = new FakeListChatModel({
        responses: ['This is a revised and improved response with more detail.'],
      });

      const node = createReviserNode({ model: llm });

      const state: ReflectionStateType = {
        input: 'Write an essay',
        currentResponse: 'Short essay',
        reflections: [
          {
            critique: 'Too brief',
            issues: ['Lacks detail'],
            suggestions: ['Add more content'],
            meetsStandards: false,
          },
        ],
        revisions: [],
        iteration: 1,
        status: 'revising',
        maxIterations: 3,
      };

      const result = await node(state);

      expect(result.currentResponse).toBeDefined();
      expect(result.currentResponse).toContain('revised and improved');
      expect(result.revisions).toBeDefined();
      expect(result.revisions).toHaveLength(1);
      expect(result.revisions![0].iteration).toBe(1);
      expect(result.status).toBe('reflecting');
      expect(result.iteration).toBe(1);
    });

    it('should include previous revisions in context', async () => {
      const llm = new FakeListChatModel({
        responses: ['Third revision with even more improvements.'],
      });

      const node = createReviserNode({ model: llm });

      const state: ReflectionStateType = {
        input: 'Write an essay',
        currentResponse: 'Second draft',
        reflections: [
          {
            critique: 'Still needs work',
            issues: ['Missing examples'],
            suggestions: ['Add examples'],
            meetsStandards: false,
          },
        ],
        revisions: [
          { content: 'First revision', iteration: 1 },
        ],
        iteration: 2,
        status: 'revising',
        maxIterations: 3,
      };

      const result = await node(state);

      expect(result.currentResponse).toBeDefined();
      expect(result.revisions).toHaveLength(1);
    });

    it('should throw error if no current response', async () => {
      const llm = new FakeListChatModel({
        responses: ['Revised'],
      });

      const node = createReviserNode({ model: llm });

      const state: ReflectionStateType = {
        input: 'Write an essay',
        currentResponse: undefined,
        reflections: [
          {
            critique: 'Test',
            issues: [],
            suggestions: [],
            meetsStandards: false,
          },
        ],
        revisions: [],
        iteration: 1,
        status: 'revising',
        maxIterations: 3,
      };

      const result = await node(state);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('No current response');
    });

    it('should throw error if no reflections', async () => {
      const llm = new FakeListChatModel({
        responses: ['Revised'],
      });

      const node = createReviserNode({ model: llm });

      const state: ReflectionStateType = {
        input: 'Write an essay',
        currentResponse: 'Essay',
        reflections: [],
        revisions: [],
        iteration: 1,
        status: 'revising',
        maxIterations: 3,
      };

      const result = await node(state);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('No reflections');
    });
  });

  describe('createFinisherNode', () => {
    it('should mark reflection as completed', async () => {
      const node = createFinisherNode();

      const state: ReflectionStateType = {
        input: 'Write an essay',
        currentResponse: 'Final essay content',
        reflections: [],
        revisions: [],
        iteration: 2,
        status: 'completed',
        maxIterations: 3,
      };

      const result = await node(state);

      expect(result.status).toBe('completed');
      expect(result.response).toBe('Final essay content');
    });
  });
});

