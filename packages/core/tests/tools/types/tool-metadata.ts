import { describe, expect, it } from 'vitest';
import {
  ToolCategory,
  validateToolMetadata,
  type ToolMetadata,
} from '../../../src/tools/index.js';

describe('ToolMetadataSchema', () => {
  it('should accept valid metadata with all fields', () => {
    const validMetadata: ToolMetadata = {
      name: 'read-file',
      displayName: 'Read File',
      description: 'Read the contents of a file from the file system',
      category: ToolCategory.FILE_SYSTEM,
      tags: ['file', 'read', 'io'],
      examples: [
        {
          description: 'Read a text file',
          input: { path: './README.md' },
        },
      ],
      usageNotes: 'Paths are relative to the current working directory',
      limitations: ['Cannot read files larger than 10MB'],
      version: '1.0.0',
      author: 'AgentForge Team',
      deprecated: false,
    };

    const result = validateToolMetadata(validMetadata);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validMetadata);
    }
  });

  it('should accept minimal valid metadata', () => {
    const minimalMetadata: ToolMetadata = {
      name: 'simple-tool',
      description: 'A simple tool for testing purposes',
      category: ToolCategory.UTILITY,
    };

    const result = validateToolMetadata(minimalMetadata);
    expect(result.success).toBe(true);
  });

  it('should reject metadata with invalid name', () => {
    const invalidMetadata = {
      name: 'Invalid Name',
      description: 'A tool with invalid name',
      category: ToolCategory.UTILITY,
    };

    const result = validateToolMetadata(invalidMetadata);
    expect(result.success).toBe(false);
  });

  it('should reject metadata with short description', () => {
    const invalidMetadata = {
      name: 'test-tool',
      description: 'Too short',
      category: ToolCategory.UTILITY,
    };

    const result = validateToolMetadata(invalidMetadata);
    expect(result.success).toBe(false);
  });

  it('should reject metadata with invalid version', () => {
    const invalidMetadata = {
      name: 'test-tool',
      description: 'A tool with invalid version',
      category: ToolCategory.UTILITY,
      version: 'v1.0',
    };

    const result = validateToolMetadata(invalidMetadata);
    expect(result.success).toBe(false);
  });

  it('should accept valid semantic versions', () => {
    const validVersions = ['1.0.0', '2.1.3', '0.1.0', '10.20.30', '1.0.0-beta', '2.0.0-alpha.1'];

    validVersions.forEach((version) => {
      const metadata = {
        name: 'test-tool',
        description: 'A tool for testing versions',
        category: ToolCategory.UTILITY,
        version,
      };

      const result = validateToolMetadata(metadata);
      expect(result.success).toBe(true);
    });
  });
});
