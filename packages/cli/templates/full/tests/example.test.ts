import { describe, it, expect } from 'vitest';
import { exampleTool } from '../src/tools/example.js';

describe('Example Tool', () => {
  it('should greet a user by name', async () => {
    const result = await exampleTool.invoke({ name: 'Alice' });
    expect(result).toContain('Alice');
    expect(result).toContain('Hello');
  });

  it('should have correct metadata', () => {
    expect(exampleTool.name).toBe('example-tool');
    expect(exampleTool.description).toBeDefined();
    expect(exampleTool.category).toBe('utility');
  });
});

