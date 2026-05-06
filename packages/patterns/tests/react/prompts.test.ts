import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  formatScratchpad,
  formatThoughts,
  formatToolsForPrompt,
} from '../../src/react/prompts.js';

describe('ReAct prompt helpers', () => {
  it('formats tool descriptors without changing order or labels', () => {
    const formatted = formatToolsForPrompt([
      {
        name: 'search-web',
        description: 'Search the web for information',
        schema: z.object({ query: z.string() }),
      },
      {
        name: 'read-file',
        description: 'Read a file from disk',
        schema: z.object({ path: z.string() }),
      },
    ]);

    expect(formatted).toBe(
      '1. search-web: Search the web for information\n2. read-file: Read a file from disk'
    );
  });

  it('formats scratchpad entries with thought, action, and observation blocks', () => {
    const formatted = formatScratchpad([
      {
        step: 1,
        thought: 'Need external context',
        action: 'search-web({"query":"agentforge"})',
        observation: 'Found docs',
      },
    ]);

    expect(formatted).toContain('Step 1:');
    expect(formatted).toContain('Thought: Need external context');
    expect(formatted).toContain('Action: search-web({"query":"agentforge"})');
    expect(formatted).toContain('Observation: Found docs');
  });

  it('formats thoughts in order and preserves empty fallbacks', () => {
    expect(formatThoughts([])).toBe('No previous thoughts.');
    expect(formatThoughts([{ content: 'first' }, { content: 'second' }])).toBe('1. first\n2. second');
  });
});
