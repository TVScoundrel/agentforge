import { describe, it, expect } from 'vitest';
import {
  ReflectionState,
  ReflectionStateConfig,
  ReflectionSchema,
  RevisionSchema,
  ReflectionStatusSchema,
  QualityCriteriaSchema,
  type Reflection,
  type Revision,
} from '../../src/reflection/state.js';

describe('Reflection State', () => {
  describe('ReflectionSchema', () => {
    it('should validate a valid reflection', () => {
      const reflection: Reflection = {
        critique: 'Good overall, but needs more detail',
        issues: ['Too brief', 'Missing examples'],
        suggestions: ['Add more detail', 'Include examples'],
        score: 7,
        meetsStandards: false,
      };

      expect(() => ReflectionSchema.parse(reflection)).not.toThrow();
    });

    it('should validate reflection without optional fields', () => {
      const reflection = {
        critique: 'Excellent work',
        issues: [],
        suggestions: [],
        meetsStandards: true,
      };

      expect(() => ReflectionSchema.parse(reflection)).not.toThrow();
    });

    it('should reject invalid score', () => {
      const reflection = {
        critique: 'Test',
        issues: [],
        suggestions: [],
        score: 11, // Invalid: > 10
        meetsStandards: true,
      };

      expect(() => ReflectionSchema.parse(reflection)).toThrow();
    });
  });

  describe('RevisionSchema', () => {
    it('should validate a valid revision', () => {
      const revision: Revision = {
        content: 'Revised content here',
        iteration: 1,
      };

      expect(() => RevisionSchema.parse(revision)).not.toThrow();
    });

    it('should validate revision with reflection', () => {
      const revision: Revision = {
        content: 'Revised content',
        iteration: 2,
        basedOn: {
          critique: 'Needs improvement',
          issues: ['Issue 1'],
          suggestions: ['Fix issue 1'],
          meetsStandards: false,
        },
      };

      expect(() => RevisionSchema.parse(revision)).not.toThrow();
    });
  });

  describe('ReflectionStatusSchema', () => {
    it('should validate all status values', () => {
      const statuses = ['generating', 'reflecting', 'revising', 'completed', 'failed'];

      statuses.forEach(status => {
        expect(() => ReflectionStatusSchema.parse(status)).not.toThrow();
      });
    });

    it('should reject invalid status', () => {
      expect(() => ReflectionStatusSchema.parse('invalid')).toThrow();
    });
  });

  describe('QualityCriteriaSchema', () => {
    it('should validate quality criteria with defaults', () => {
      const criteria = {};

      const result = QualityCriteriaSchema.parse(criteria);
      expect(result.minScore).toBe(7);
      expect(result.requireAll).toBe(true);
    });

    it('should validate custom quality criteria', () => {
      const criteria = {
        minScore: 8,
        criteria: ['clarity', 'accuracy', 'completeness'],
        requireAll: false,
      };

      expect(() => QualityCriteriaSchema.parse(criteria)).not.toThrow();
    });
  });

  describe('ReflectionState', () => {
    it('should create state annotation', () => {
      expect(ReflectionState).toBeDefined();
      expect(ReflectionState.spec).toBeDefined();
    });

    it('should have all required channels', () => {
      const spec = ReflectionState.spec;

      expect(spec.input).toBeDefined();
      expect(spec.currentResponse).toBeDefined();
      expect(spec.reflections).toBeDefined();
      expect(spec.revisions).toBeDefined();
      expect(spec.iteration).toBeDefined();
      expect(spec.status).toBeDefined();
      expect(spec.qualityCriteria).toBeDefined();
      expect(spec.maxIterations).toBeDefined();
      expect(spec.response).toBeDefined();
      expect(spec.error).toBeDefined();
    });

    it('should have correct default values', () => {
      const config = ReflectionStateConfig;

      expect(config.input.default?.()).toBe('');
      expect(config.reflections.default?.()).toEqual([]);
      expect(config.revisions.default?.()).toEqual([]);
      expect(config.iteration.default?.()).toBe(0);
      expect(config.status.default?.()).toBe('generating');
      expect(config.maxIterations.default?.()).toBe(3);
    });

    it('should have correct reducers', () => {
      const config = ReflectionStateConfig;

      // Test reflections reducer
      const reflections1: Reflection[] = [
        { critique: 'First', issues: [], suggestions: [], meetsStandards: false },
      ];
      const reflections2: Reflection[] = [
        { critique: 'Second', issues: [], suggestions: [], meetsStandards: false },
      ];
      const mergedReflections = config.reflections.reducer?.(reflections1, reflections2);
      expect(mergedReflections).toHaveLength(2);

      // Test revisions reducer
      const revisions1: Revision[] = [{ content: 'First', iteration: 1 }];
      const revisions2: Revision[] = [{ content: 'Second', iteration: 2 }];
      const mergedRevisions = config.revisions.reducer?.(revisions1, revisions2);
      expect(mergedRevisions).toHaveLength(2);

      // Test iteration reducer
      const iteration = config.iteration.reducer?.(1, 1);
      expect(iteration).toBe(2);
    });
  });
});

