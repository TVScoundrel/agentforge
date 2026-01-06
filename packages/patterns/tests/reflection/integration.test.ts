import { describe, it, expect } from 'vitest';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { createReflectionAgent } from '../../src/reflection/agent.js';

describe('Reflection Agent Integration', () => {
  it('should create a reflection agent', () => {
    const llm = new FakeListChatModel({
      responses: ['Test'],
    });

    const agent = createReflectionAgent({
      generator: { llm },
      reflector: { llm },
      reviser: { llm },
    });

    expect(agent).toBeDefined();
    expect(typeof agent.invoke).toBe('function');
  });

  it('should complete reflection when standards are met', async () => {
    const llm = new FakeListChatModel({
      responses: [
        'Initial response',
        JSON.stringify({
          critique: 'Excellent work',
          issues: [],
          suggestions: [],
          score: 9,
          meetsStandards: true,
        }),
      ],
    });

    const agent = createReflectionAgent({
      generator: { llm },
      reflector: { llm },
      reviser: { llm },
      maxIterations: 3,
    });

    const result = await agent.invoke({
      input: 'Write a short story',
    });

    expect(result.status).toBe('completed');
    expect(result.response).toBeDefined();
    expect(result.reflections).toHaveLength(1);
    expect(result.reflections[0].meetsStandards).toBe(true);
  });

  it('should iterate through reflection and revision', async () => {
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
        'Revised draft with more detail',
        JSON.stringify({
          critique: 'Much better',
          issues: [],
          suggestions: [],
          score: 8,
          meetsStandards: true,
        }),
      ],
    });

    const agent = createReflectionAgent({
      generator: { llm },
      reflector: { llm },
      reviser: { llm },
      maxIterations: 3,
    });

    const result = await agent.invoke({
      input: 'Write an essay',
    });

    expect(result.status).toBe('completed');
    expect(result.reflections).toHaveLength(2);
    expect(result.revisions).toHaveLength(1);
    expect(result.iteration).toBeGreaterThan(0);
  });

  it('should stop at max iterations', async () => {
    const llm = new FakeListChatModel({
      responses: [
        'Draft 1',
        JSON.stringify({
          critique: 'Needs work',
          issues: ['Issue 1'],
          suggestions: ['Fix 1'],
          score: 4,
          meetsStandards: false,
        }),
        'Draft 2',
        JSON.stringify({
          critique: 'Still needs work',
          issues: ['Issue 2'],
          suggestions: ['Fix 2'],
          score: 5,
          meetsStandards: false,
        }),
        'Draft 3',
        JSON.stringify({
          critique: 'Better but not perfect',
          issues: ['Issue 3'],
          suggestions: ['Fix 3'],
          score: 6,
          meetsStandards: false,
        }),
      ],
    });

    const agent = createReflectionAgent({
      generator: { llm },
      reflector: { llm },
      reviser: { llm },
      maxIterations: 2,
    });

    const result = await agent.invoke({
      input: 'Write an essay',
    });

    expect(result.status).toBe('completed');
    expect(result.iteration).toBeLessThanOrEqual(2);
    expect(result.reflections.length).toBeLessThanOrEqual(2);
  });

  it('should work with quality criteria', async () => {
    const llm = new FakeListChatModel({
      responses: [
        'Initial response',
        JSON.stringify({
          critique: 'Meets all criteria',
          issues: [],
          suggestions: [],
          score: 9,
          meetsStandards: true,
        }),
      ],
    });

    const agent = createReflectionAgent({
      generator: { llm },
      reflector: { llm },
      reviser: { llm },
      maxIterations: 3,
      qualityCriteria: {
        minScore: 8,
        criteria: ['clarity', 'accuracy', 'completeness'],
        requireAll: true,
      },
    });

    const result = await agent.invoke({
      input: 'Write a technical document',
      qualityCriteria: {
        minScore: 8,
        criteria: ['clarity', 'accuracy', 'completeness'],
        requireAll: true,
      },
    });

    expect(result.status).toBe('completed');
    expect(result.qualityCriteria).toBeDefined();
    expect(result.qualityCriteria?.minScore).toBe(8);
  });
});

