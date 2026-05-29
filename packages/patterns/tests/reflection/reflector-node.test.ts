import { describe, expect, it } from 'vitest';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { createReflectorNode } from '../../src/reflection/nodes.js';
import type { ReflectionStateType } from '../../src/reflection/state.js';

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

  it('should fail if no current response is available', async () => {
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
