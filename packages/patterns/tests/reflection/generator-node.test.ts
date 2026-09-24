import { describe, expect, it, vi } from 'vitest';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { createGeneratorNode } from '../../src/reflection/nodes.js';
import type { ReflectionStateType } from '../../src/reflection/state.js';

describe('createGeneratorNode', () => {
  const createState = (): ReflectionStateType => ({
    input: 'Write a short story',
    currentResponse: undefined,
    reflections: [],
    revisions: [],
    iteration: 0,
    status: 'generating',
    maxIterations: 3,
  });

  const createContentModel = (content: unknown): BaseChatModel =>
    ({
      invoke: vi.fn().mockResolvedValue({ content }),
    }) as unknown as BaseChatModel;

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

  it.each([
    ['string', 'Generated response', 'Generated response'],
    ['ordinary object', { answer: 42 }, '{"answer":42}'],
    [
      'text-part array',
      [{ type: 'text', text: 'Generated response' }],
      '[{"type":"text","text":"Generated response"}]',
    ],
    [
      'mixed array',
      [
        { type: 'text', text: 'Generated response' },
        { type: 'image_url', image_url: { url: 'https://example.com/image.png' } },
      ],
      '[{"type":"text","text":"Generated response"},{"type":"image_url","image_url":{"url":"https://example.com/image.png"}}]',
    ],
    [
      'array without text',
      [{ type: 'image_url', image_url: { url: 'https://example.com/image.png' } }],
      '[{"type":"image_url","image_url":{"url":"https://example.com/image.png"}}]',
    ],
    ['empty string', '', ''],
    ['empty array', [], '[]'],
    ['null', null, 'null'],
  ])('serializes %s content into the generated response', async (_name, content, expected) => {
    const node = createGeneratorNode({ model: createContentModel(content) });

    const result = await node(createState());

    expect(result).toEqual({
      currentResponse: expected,
      status: 'reflecting',
      iteration: 1,
    });
  });

  it('returns a failed outcome for undefined content', async () => {
    const node = createGeneratorNode({ model: createContentModel(undefined) });

    const result = await node(createState());

    expect(result).toEqual({
      status: 'failed',
      error: expect.stringMatching(/undefined.*length|length.*undefined/i),
    });
  });

  it('returns a failed outcome when circular content cannot be serialized', async () => {
    const circularContent: Record<string, unknown> = {};
    circularContent.self = circularContent;
    const node = createGeneratorNode({ model: createContentModel(circularContent) });

    const result = await node(createState());

    expect(result).toEqual({
      status: 'failed',
      error: expect.stringContaining('Converting circular structure to JSON'),
    });
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
