import { describe, expect, it } from 'vitest';
import {
  ToolExampleSchema,
  ToolNameSchema,
  validateToolName,
  type ToolExample,
} from '../../../src/tools/index.js';

describe('ToolNameSchema', () => {
  it('should accept valid kebab-case names', () => {
    const validNames = ['read-file', 'http-request', 'query-database', 'tool123', 'my-tool-v2', 'ab'];

    validNames.forEach((name) => {
      expect(() => ToolNameSchema.parse(name)).not.toThrow();
      expect(validateToolName(name)).toBe(true);
    });
  });

  it('should reject invalid names', () => {
    const invalidNames = [
      'ReadFile',
      'read_file',
      'read file',
      '-read-file',
      'read-file-',
      'UPPERCASE',
      'a',
      'x'.repeat(51),
      '',
      '123-tool',
    ];

    invalidNames.forEach((name) => {
      expect(() => ToolNameSchema.parse(name)).toThrow();
      expect(validateToolName(name)).toBe(false);
    });
  });
});

describe('ToolExampleSchema', () => {
  it('should accept valid examples', () => {
    const validExample: ToolExample = {
      description: 'Read a text file',
      input: { path: './README.md', encoding: 'utf-8' },
      output: '# My Project',
      explanation: 'This reads the file and returns its contents',
    };

    expect(() => ToolExampleSchema.parse(validExample)).not.toThrow();
  });

  it('should accept minimal examples', () => {
    const minimalExample: ToolExample = {
      description: 'Simple example',
      input: { foo: 'bar' },
    };

    expect(() => ToolExampleSchema.parse(minimalExample)).not.toThrow();
  });

  it('should reject invalid examples', () => {
    expect(() =>
      ToolExampleSchema.parse({
        input: { foo: 'bar' },
      })
    ).toThrow();

    expect(() =>
      ToolExampleSchema.parse({
        description: '',
        input: { foo: 'bar' },
      })
    ).toThrow();

    expect(() =>
      ToolExampleSchema.parse({
        description: 'Test',
      })
    ).toThrow();

    expect(() =>
      ToolExampleSchema.parse({
        description: 'Test',
        input: 'not an object',
      })
    ).toThrow();
  });
});
