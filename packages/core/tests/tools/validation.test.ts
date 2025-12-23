/**
 * Tests for schema validation utilities
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  validateSchemaDescriptions,
  safeValidateSchemaDescriptions,
  getMissingDescriptions,
  MissingDescriptionError,
} from '../../src/tools/validation.js';

describe('validateSchemaDescriptions', () => {
  describe('primitive types', () => {
    it('should pass for string with description', () => {
      const schema = z.object({
        name: z.string().describe('User name'),
      });

      expect(() => validateSchemaDescriptions(schema)).not.toThrow();
    });

    it('should fail for string without description', () => {
      const schema = z.object({
        name: z.string(),
      });

      expect(() => validateSchemaDescriptions(schema)).toThrow(
        MissingDescriptionError
      );
    });

    it('should pass for number with description', () => {
      const schema = z.object({
        age: z.number().describe('User age'),
      });

      expect(() => validateSchemaDescriptions(schema)).not.toThrow();
    });

    it('should fail for number without description', () => {
      const schema = z.object({
        age: z.number(),
      });

      expect(() => validateSchemaDescriptions(schema)).toThrow(
        MissingDescriptionError
      );
    });

    it('should pass for boolean with description', () => {
      const schema = z.object({
        active: z.boolean().describe('Is user active'),
      });

      expect(() => validateSchemaDescriptions(schema)).not.toThrow();
    });

    it('should fail for empty description', () => {
      const schema = z.object({
        name: z.string().describe(''),
      });

      expect(() => validateSchemaDescriptions(schema)).toThrow(
        MissingDescriptionError
      );
    });

    it('should fail for whitespace-only description', () => {
      const schema = z.object({
        name: z.string().describe('   '),
      });

      expect(() => validateSchemaDescriptions(schema)).toThrow(
        MissingDescriptionError
      );
    });
  });

  describe('optional and nullable types', () => {
    it('should pass for optional with description', () => {
      const schema = z.object({
        email: z.string().optional().describe('User email'),
      });

      expect(() => validateSchemaDescriptions(schema)).not.toThrow();
    });

    it('should fail for optional without description', () => {
      const schema = z.object({
        email: z.string().optional(),
      });

      expect(() => validateSchemaDescriptions(schema)).toThrow(
        MissingDescriptionError
      );
    });

    it('should pass for nullable with description', () => {
      const schema = z.object({
        phone: z.string().nullable().describe('User phone'),
      });

      expect(() => validateSchemaDescriptions(schema)).not.toThrow();
    });

    it('should pass for default with description', () => {
      const schema = z.object({
        role: z.string().default('user').describe('User role'),
      });

      expect(() => validateSchemaDescriptions(schema)).not.toThrow();
    });
  });

  describe('arrays', () => {
    it('should pass for array with described elements', () => {
      const schema = z.object({
        tags: z.array(z.string().describe('Tag name')).describe('List of tags'),
      });

      expect(() => validateSchemaDescriptions(schema)).not.toThrow();
    });

    it('should fail for array with undescribed elements', () => {
      const schema = z.object({
        tags: z.array(z.string()).describe('List of tags'),
      });

      expect(() => validateSchemaDescriptions(schema)).toThrow(
        MissingDescriptionError
      );
    });
  });

  describe('nested objects', () => {
    it('should pass for nested object with all descriptions', () => {
      const schema = z.object({
        user: z
          .object({
            name: z.string().describe('User name'),
            age: z.number().describe('User age'),
          })
          .describe('User information'),
      });

      expect(() => validateSchemaDescriptions(schema)).not.toThrow();
    });

    it('should fail for nested object missing inner description', () => {
      const schema = z.object({
        user: z
          .object({
            name: z.string().describe('User name'),
            age: z.number(), // Missing description!
          })
          .describe('User information'),
      });

      expect(() => validateSchemaDescriptions(schema)).toThrow(
        MissingDescriptionError
      );
    });
  });
});

describe('safeValidateSchemaDescriptions', () => {
  it('should return success for valid schema', () => {
    const schema = z.object({
      name: z.string().describe('User name'),
    });

    const result = safeValidateSchemaDescriptions(schema);
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return error for invalid schema', () => {
    const schema = z.object({
      name: z.string(),
    });

    const result = safeValidateSchemaDescriptions(schema);
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(MissingDescriptionError);
  });
});

describe('getMissingDescriptions', () => {
  it('should return empty array for valid schema', () => {
    const schema = z.object({
      name: z.string().describe('User name'),
      age: z.number().describe('User age'),
    });

    const missing = getMissingDescriptions(schema);
    expect(missing).toEqual([]);
  });

  it('should return field paths for missing descriptions', () => {
    const schema = z.object({
      name: z.string(), // Missing
      age: z.number().describe('User age'),
      email: z.string(), // Missing
    });

    const missing = getMissingDescriptions(schema);
    expect(missing).toContain('name');
    expect(missing).toContain('email');
    expect(missing).not.toContain('age');
  });
});

describe('MissingDescriptionError', () => {
  it('should include field path in error message', () => {
    const error = new MissingDescriptionError(['user', 'name'], 'ZodString');

    expect(error.message).toContain('user.name');
    expect(error.message).toContain('ZodString');
    expect(error.fieldPath).toEqual(['user', 'name']);
    expect(error.fieldType).toBe('ZodString');
  });
});

