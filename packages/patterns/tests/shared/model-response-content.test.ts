import { describe, expect, it } from 'vitest';
import {
  getModelResponseText,
  getModelResponseTextParts,
  stringifyModelResponseContent,
  stringifyModelResponseContentSafely,
} from '../../src/shared/model-response-content.js';

describe('Model Response Content representation', () => {
  describe('getModelResponseText', () => {
    it('preserves only original string content', () => {
      expect(getModelResponseText('Plain response')).toBe('Plain response');
      expect(getModelResponseText('')).toBe('');
      expect(getModelResponseText([{ type: 'text', text: 'Structured response' }])).toBeUndefined();
      expect(getModelResponseText({ answer: 42 })).toBeUndefined();
      expect(getModelResponseText(null)).toBeUndefined();
      expect(getModelResponseText(undefined)).toBeUndefined();
    });
  });

  describe('getModelResponseTextParts', () => {
    it('extracts string and object text parts without assigning fallback meaning', () => {
      expect(
        getModelResponseTextParts([
          'First response part',
          { type: 'text', text: 'Second response part' },
          { type: 'text', text: '' },
          { type: 'tool_use', name: 'search' },
          null,
        ])
      ).toEqual(['First response part', 'Second response part', '']);
      expect(getModelResponseTextParts('Plain response')).toEqual([]);
      expect(getModelResponseTextParts({ text: 'Not an array part' })).toEqual([]);
      expect(getModelResponseTextParts(null)).toEqual([]);
      expect(getModelResponseTextParts(undefined)).toEqual([]);
    });
  });

  describe('stringifyModelResponseContent', () => {
    it.each([
      ['string', 'Plain response', 'Plain response'],
      ['ordinary object', { answer: 42 }, '{"answer":42}'],
      [
        'text-part array',
        [{ type: 'text', text: 'Structured response' }],
        '[{"type":"text","text":"Structured response"}]',
      ],
      [
        'mixed array',
        [
          { type: 'text', text: 'Structured response' },
          { type: 'tool_use', name: 'search' },
        ],
        '[{"type":"text","text":"Structured response"},{"type":"tool_use","name":"search"}]',
      ],
      [
        'array without text',
        [{ type: 'tool_use', name: 'search' }],
        '[{"type":"tool_use","name":"search"}]',
      ],
      ['empty string', '', ''],
      ['empty array', [], '[]'],
      ['null', null, 'null'],
      ['undefined', undefined, undefined],
    ])('preserves the JSON textual representation of %s content', (_label, content, expected) => {
      expect(stringifyModelResponseContent(content)).toBe(expected);
    });

    it('preserves the native failure for circular content', () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;

      expect(() => stringifyModelResponseContent(circular)).toThrow(/circular/i);
    });
  });

  describe('stringifyModelResponseContentSafely', () => {
    it('provides stable representations for values JSON cannot serialize', () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;

      expect(stringifyModelResponseContentSafely(undefined)).toBe('undefined');
      const representedCircular = stringifyModelResponseContentSafely(circular);
      expect(representedCircular).toMatch(/^\[Unserializable model content:/);
      expect(representedCircular).toMatch(/circular/i);
    });
  });
});
