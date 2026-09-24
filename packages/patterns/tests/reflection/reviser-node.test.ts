import { describe, expect, it, vi } from 'vitest';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { createReviserNode } from '../../src/reflection/nodes.js';
import type { ReflectionStateType } from '../../src/reflection/state.js';

describe('createReviserNode', () => {
  const reflection = {
    critique: 'Too brief',
    issues: ['Lacks detail'],
    suggestions: ['Add more content'],
    meetsStandards: false,
  };

  const createState = (): ReflectionStateType => ({
    input: 'Write an essay',
    currentResponse: 'Short essay',
    reflections: [reflection],
    revisions: [],
    iteration: 1,
    status: 'revising',
    maxIterations: 3,
  });

  const createContentModel = (content: unknown): BaseChatModel =>
    ({
      invoke: vi.fn().mockResolvedValue({ content }),
    }) as unknown as BaseChatModel;

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
      revisions: [{ content: 'First revision', iteration: 1 }],
      iteration: 2,
      status: 'revising',
      maxIterations: 3,
    };

    const result = await node(state);

    expect(result.currentResponse).toBeDefined();
    expect(result.revisions).toHaveLength(1);
  });

  it.each([
    ['string', 'Revised response', 'Revised response'],
    ['ordinary object', { answer: 42 }, '{"answer":42}'],
    [
      'text-part array',
      [{ type: 'text', text: 'Revised response' }],
      '[{"type":"text","text":"Revised response"}]',
    ],
    [
      'mixed array',
      [
        { type: 'text', text: 'Revised response' },
        { type: 'image_url', image_url: { url: 'https://example.com/image.png' } },
      ],
      '[{"type":"text","text":"Revised response"},{"type":"image_url","image_url":{"url":"https://example.com/image.png"}}]',
    ],
    [
      'array without text',
      [{ type: 'image_url', image_url: { url: 'https://example.com/image.png' } }],
      '[{"type":"image_url","image_url":{"url":"https://example.com/image.png"}}]',
    ],
    ['empty string', '', ''],
    ['empty array', [], '[]'],
    ['null', null, 'null'],
  ])('serializes %s content into the revision outcome', async (_name, content, expected) => {
    const node = createReviserNode({ model: createContentModel(content) });

    const result = await node(createState());

    expect(result).toEqual({
      currentResponse: expected,
      revisions: [
        {
          content: expected,
          iteration: 1,
          basedOn: reflection,
        },
      ],
      status: 'reflecting',
      iteration: 1,
    });
  });

  it('returns a failed outcome for undefined content', async () => {
    const node = createReviserNode({ model: createContentModel(undefined) });

    const result = await node(createState());

    expect(result).toEqual({
      status: 'failed',
      error: expect.stringMatching(/undefined.*length|length.*undefined/i),
    });
  });

  it('returns a failed outcome when circular content cannot be serialized', async () => {
    const circularContent: Record<string, unknown> = {};
    circularContent.self = circularContent;
    const node = createReviserNode({ model: createContentModel(circularContent) });

    const result = await node(createState());

    expect(result).toEqual({
      status: 'failed',
      error: expect.stringContaining('Converting circular structure to JSON'),
    });
  });

  it('should fail if no current response is available', async () => {
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
