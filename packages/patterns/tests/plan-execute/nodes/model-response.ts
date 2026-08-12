import { describe, expect, it } from 'vitest';
import { AIMessage } from '@langchain/core/messages';
import { parseModelResponse } from '../../../src/plan-execute/model-response.js';

describe('parseModelResponse', () => {
  it('parses string and structured model content', () => {
    expect(parseModelResponse<{ value: number }>(new AIMessage({ content: '{"value": 1}' }).content, 'plan'))
      .toEqual({ value: 1 });
    expect(parseModelResponse<{ value: number }>(new AIMessage({
      content: [{ type: 'text', text: '{"value": 2}' }],
    }).content, 'plan')).toEqual({ value: 2 });
  });

  it('wraps invalid JSON with the supplied context', () => {
    expect(() => parseModelResponse('not-json', 'replan decision'))
      .toThrow('Failed to parse replan decision from LLM response');
  });
});
