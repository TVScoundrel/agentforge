import { describe, expect, it } from 'vitest';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { createReflectionAgent } from '../../src/reflection/agent.js';

describe('Reflection Agent Factory', () => {
  it('routes directly to finish when the reflector marks the response complete', async () => {
    const llm = new FakeListChatModel({
      responses: [
        'Initial response',
        JSON.stringify({
          critique: 'Looks good',
          issues: [],
          suggestions: [],
          score: 9,
          meetsStandards: true,
        }),
      ],
    });

    const agent = createReflectionAgent({
      generator: { model: llm },
      reflector: { model: llm },
      reviser: { model: llm },
      maxIterations: 3,
    });

    const result = await agent.invoke({
      input: 'Write a short summary',
    });

    expect(result.status).toBe('completed');
    expect(result.reflections).toHaveLength(1);
    expect(result.revisions).toHaveLength(0);
    expect(result.response).toBe('Initial response');
  });

  it('finishes after revision when max iterations are reached', async () => {
    const llm = new FakeListChatModel({
      responses: [
        'Initial draft',
        JSON.stringify({
          critique: 'Needs improvement',
          issues: ['Too brief'],
          suggestions: ['Add more detail'],
          score: 5,
          meetsStandards: false,
        }),
        'Revised draft',
      ],
    });

    const agent = createReflectionAgent({
      generator: { model: llm },
      reflector: { model: llm },
      reviser: { model: llm },
      maxIterations: 2,
    });

    const result = await agent.invoke({
      input: 'Write a short summary',
    });

    expect(result.status).toBe('completed');
    expect(result.reflections).toHaveLength(1);
    expect(result.revisions).toHaveLength(1);
    expect(result.response).toBe('Revised draft');
    expect(result.iteration).toBe(2);
  });
});
