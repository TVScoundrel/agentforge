import { describe, expect, it } from 'vitest';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { createReviserNode } from '../../src/reflection/nodes.js';
import type { ReflectionStateType } from '../../src/reflection/state.js';

describe('createReviserNode', () => {
  it('should create revision based on critique', async () => {
    const llm = new FakeListChatModel({
      responses: ['This is a revised and improved response with more detail.'],
    });

    const node = createReviserNode({ model: llm });

    const state: ReflectionStateType = {
      input: 'Write an essay',
      currentResponse: 'Short essay',
      reflections: [{
        critique: 'Too brief',
        issues: ['Lacks detail'],
        suggestions: ['Add more content'],
        meetsStandards: false,
      }],
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
      reflections: [{
        critique: 'Still needs work',
        issues: ['Missing examples'],
        suggestions: ['Add examples'],
        meetsStandards: false,
      }],
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

  it('should fail if no current response is available', async () => {
    const llm = new FakeListChatModel({
      responses: ['Revised'],
    });

    const node = createReviserNode({ model: llm });

    const state: ReflectionStateType = {
      input: 'Write an essay',
      currentResponse: undefined,
      reflections: [{
        critique: 'Test',
        issues: [],
        suggestions: [],
        meetsStandards: false,
      }],
      revisions: [],
      iteration: 1,
      status: 'revising',
      maxIterations: 3,
    };

    const result = await node(state);

    expect(result.status).toBe('failed');
    expect(result.error).toContain('No current response');
  });

  it('should fail if no reflections are available', async () => {
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
