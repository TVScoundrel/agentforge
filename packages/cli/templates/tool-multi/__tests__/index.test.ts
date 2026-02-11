import { describe, it, expect } from 'vitest';
import { {{TOOL_NAME_CAMEL}}Tool } from '../index.js';

describe('{{TOOL_NAME_PASCAL}} Tool', () => {
  it('should have correct metadata', () => {
    expect({{TOOL_NAME_CAMEL}}Tool.metadata.name).toBe('{{TOOL_NAME}}');
    expect({{TOOL_NAME_CAMEL}}Tool.metadata.description).toBe('{{TOOL_DESCRIPTION}}');
    expect({{TOOL_NAME_CAMEL}}Tool.metadata.category).toBe('{{TOOL_CATEGORY}}');
  });

  it('should validate input schema', async () => {
    // Valid input
    const validInput = {
      input: 'test input',
    };
    
    const result = await {{TOOL_NAME_CAMEL}}Tool.invoke(validInput);
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it('should reject invalid input', async () => {
    // Invalid input (empty string)
    const invalidInput = {
      input: '',
    };
    
    await expect({{TOOL_NAME_CAMEL}}Tool.invoke(invalidInput)).rejects.toThrow();
  });

  it('should execute successfully with valid input', async () => {
    const input = {
      input: 'test',
    };

    const result = await {{TOOL_NAME_CAMEL}}Tool.invoke(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    // TODO: Add error handling tests
    // Example: Test with invalid API key, network errors, etc.
  });

  // TODO: Add more specific tests for your tool
});

