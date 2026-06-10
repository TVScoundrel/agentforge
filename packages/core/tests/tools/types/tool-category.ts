import { describe, expect, it } from 'vitest';
import { ToolCategory, ToolCategorySchema } from '../../../src/tools/index.js';

describe('ToolCategory', () => {
  it('should have all expected categories', () => {
    expect(ToolCategory.FILE_SYSTEM).toBe('file-system');
    expect(ToolCategory.WEB).toBe('web');
    expect(ToolCategory.CODE).toBe('code');
    expect(ToolCategory.DATABASE).toBe('database');
    expect(ToolCategory.API).toBe('api');
    expect(ToolCategory.UTILITY).toBe('utility');
    expect(ToolCategory.CUSTOM).toBe('custom');
  });

  it('should validate valid categories', () => {
    expect(() => ToolCategorySchema.parse('file-system')).not.toThrow();
    expect(() => ToolCategorySchema.parse('web')).not.toThrow();
    expect(() => ToolCategorySchema.parse('code')).not.toThrow();
  });

  it('should reject invalid categories', () => {
    expect(() => ToolCategorySchema.parse('invalid')).toThrow();
    expect(() => ToolCategorySchema.parse('FILE_SYSTEM')).toThrow();
    expect(() => ToolCategorySchema.parse('')).toThrow();
    expect(() => ToolCategorySchema.parse(123)).toThrow();
  });
});
