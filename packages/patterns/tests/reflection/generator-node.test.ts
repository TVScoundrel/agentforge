import { describe, expect, it, vi } from 'vitest';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { createGeneratorNode } from '../../src/reflection/nodes.js';
import type { ReflectionStateType } from '../../src/reflection/state.js';

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
      reflections: [{
        critique: 'Needs more detail',
        issues: ['Too brief'],
        suggestions: ['Add more description'],
        meetsStandards: false,
      }],
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
