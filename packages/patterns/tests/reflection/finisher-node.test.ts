import { describe, expect, it } from 'vitest';
import { createFinisherNode } from '../../src/reflection/nodes.js';
import type { ReflectionStateType } from '../../src/reflection/state.js';

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
