import { describe, expect, it, vi } from 'vitest';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { createReflectorNode } from '../../src/reflection/nodes.js';
import type { ReflectionStateType } from '../../src/reflection/state.js';

describe('createReflectorNode', () => {
  const createState = (): ReflectionStateType => ({
    input: 'Write an essay',
    currentResponse: 'Essay content',
    reflections: [],
    revisions: [],
    iteration: 1,
    status: 'reflecting',
    maxIterations: 3,
  });

  const createContentModel = (content: unknown): BaseChatModel =>
    ({
      invoke: vi.fn().mockResolvedValue({ content }),
    }) as unknown as BaseChatModel;

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

  it('extracts a valid reflection object from surrounding text', async () => {
    const content = `Reflection follows:\n${JSON.stringify({
      critique: 'Needs examples',
      issues: ['No examples'],
      suggestions: ['Add one example'],
      score: 6,
      meetsStandards: false,
    })}\nEnd reflection.`;
    const node = createReflectorNode({ model: createContentModel(content) });

    const result = await node(createState());

    expect(result).toEqual({
      reflections: [
        {
          critique: 'Needs examples',
          issues: ['No examples'],
          suggestions: ['Add one example'],
          score: 6,
          meetsStandards: false,
        },
      ],
      status: 'revising',
    });
  });

  it('serializes and parses an ordinary reflection-shaped object', async () => {
    const content = {
      critique: 'Object critique',
      issues: [],
      suggestions: [],
      score: 9,
      meetsStandards: true,
    };
    const node = createReflectorNode({ model: createContentModel(content) });

    const result = await node(createState());

    expect(result).toEqual({
      reflections: [content],
      status: 'completed',
    });
  });

  it.each([
    ['invalid JSON', '{"critique":"Malformed"', '{"critique":"Malformed"'],
    [
      'mixed array',
      [
        { type: 'text', text: 'Critique' },
        { type: 'image_url', image_url: { url: 'https://example.com/image.png' } },
      ],
      '[{"type":"text","text":"Critique"},{"type":"image_url","image_url":{"url":"https://example.com/image.png"}}]',
    ],
    ['empty string', '', ''],
    ['empty array', [], '[]'],
    ['null', null, 'null'],
    ['undefined', undefined, undefined],
  ])(
    'falls back to a plain-text reflection for %s content',
    async (_name, content, expectedCritique) => {
      const node = createReflectorNode({ model: createContentModel(content) });

      const result = await node(createState());

      expect(result).toEqual({
        reflections: [
          {
            critique: expectedCritique,
            issues: [],
            suggestions: [],
            score: 5,
            meetsStandards: false,
          },
        ],
        status: 'revising',
      });
    }
  );

  it.each([
    ['text-part array', [{ type: 'text', text: 'Critique' }]],
    [
      'array without text',
      [{ type: 'image_url', image_url: { url: 'https://example.com/image.png' } }],
    ],
  ])(
    'returns a failed outcome when a single %s object is parsed as the reflection',
    async (_name, content) => {
      const node = createReflectorNode({ model: createContentModel(content) });

      const result = await node(createState());

      expect(result).toEqual({
        status: 'failed',
        error: expect.stringMatching(/undefined.*length|length.*undefined/i),
      });
    }
  );

  it('returns a failed outcome when circular content cannot be serialized', async () => {
    const circularContent: Record<string, unknown> = {};
    circularContent.self = circularContent;
    const node = createReflectorNode({ model: createContentModel(circularContent) });

    const result = await node(createState());

    expect(result).toEqual({
      status: 'failed',
      error: expect.stringContaining('Converting circular structure to JSON'),
    });
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
