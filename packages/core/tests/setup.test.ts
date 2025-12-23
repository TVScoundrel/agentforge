import { describe, it, expect } from 'vitest';
import { ToolCategory } from '../src/tools/index.js';

describe('Setup', () => {
  it('should export ToolCategory', () => {
    expect(ToolCategory).toBeDefined();
    expect(ToolCategory.FILE_SYSTEM).toBe('file-system');
  });

  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });
});

