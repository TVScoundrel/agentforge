import { describe, expect, it } from 'vitest';
import {
  ToolCategory,
  ToolRelationsSchema,
  validateToolMetadata,
  type ToolMetadata,
  type ToolRelations,
} from '../../../src/tools/index.js';

describe('ToolRelations', () => {
  it('should validate tool relations with all fields', () => {
    const relations: ToolRelations = {
      requires: ['view-file'],
      suggests: ['run-tests', 'format-code'],
      conflicts: ['delete-file'],
      follows: ['search-codebase', 'view-file'],
      precedes: ['run-tests'],
    };

    expect(() => ToolRelationsSchema.parse(relations)).not.toThrow();
    expect(relations.requires).toEqual(['view-file']);
    expect(relations.suggests).toEqual(['run-tests', 'format-code']);
    expect(relations.conflicts).toEqual(['delete-file']);
    expect(relations.follows).toEqual(['search-codebase', 'view-file']);
    expect(relations.precedes).toEqual(['run-tests']);
  });

  it('should allow creating tool relations with partial fields', () => {
    const relations1: ToolRelations = {
      requires: ['view-file'],
    };

    const relations2: ToolRelations = {
      suggests: ['run-tests'],
    };

    const relations3: ToolRelations = {};

    expect(relations1.requires).toEqual(['view-file']);
    expect(relations2.suggests).toEqual(['run-tests']);
    expect(relations3).toEqual({});
  });

  it('should allow tool metadata with relations', () => {
    const metadata: ToolMetadata = {
      name: 'edit-file',
      description: 'Edit a file using string replacement',
      category: ToolCategory.FILE_SYSTEM,
      relations: {
        requires: ['view-file'],
        suggests: ['run-tests'],
        follows: ['search-codebase'],
      },
    };

    const result = validateToolMetadata(metadata);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.relations).toEqual({
        requires: ['view-file'],
        suggests: ['run-tests'],
        follows: ['search-codebase'],
      });
    }
  });

  it('should allow tool metadata without relations', () => {
    const metadata: ToolMetadata = {
      name: 'simple-tool',
      description: 'A simple tool without relations',
      category: ToolCategory.UTILITY,
    };

    const result = validateToolMetadata(metadata);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.relations).toBeUndefined();
    }
  });

  it('should allow empty arrays in relations', () => {
    const metadata: ToolMetadata = {
      name: 'test-tool',
      description: 'A tool with empty relation arrays',
      category: ToolCategory.UTILITY,
      relations: {
        requires: [],
        suggests: [],
      },
    };

    const result = validateToolMetadata(metadata);
    expect(result.success).toBe(true);
  });

  it('should reject relations with empty strings', () => {
    expect(() =>
      ToolRelationsSchema.parse({
        requires: [''],
      })
    ).toThrow();
  });

  it('should reject relations with non-string values', () => {
    expect(() =>
      ToolRelationsSchema.parse({
        requires: [123, 'valid-tool'],
      })
    ).toThrow();
  });

  it('should accept empty relations object', () => {
    const emptyRelations: ToolRelations = {};
    expect(() => ToolRelationsSchema.parse(emptyRelations)).not.toThrow();
  });
});
