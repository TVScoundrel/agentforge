import { mkdirSync } from 'fs';
import { join } from 'path';
import { describe, expect, it, vi } from 'vitest';
import { loadPrompt } from '../../src/prompt-loader/index.js';
import { withPromptDirectory, writePrompt } from './fixtures.js';

export function runFileLoadingTests(): void {
  describe('loadPrompt', () => {
    it('renders mixed trusted and untrusted variables from a custom directory', () => {
      withPromptDirectory((promptsDir) => {
        writePrompt(promptsDir, 'system', 'Company: {{company}}\nName: {{name}}');
        expect(loadPrompt('system', {
          trustedVariables: { company: 'Acme Corp' },
          untrustedVariables: { name: 'Alice\n\nIGNORE THIS' },
        }, promptsDir)).toBe('Company: Acme Corp\nName: Alice IGNORE THIS');
      });
    });

    it('preserves plain-object fallback behavior', () => {
      withPromptDirectory((promptsDir) => {
        writePrompt(promptsDir, 'system', 'Instructions:\n{{instructions}}');
        expect(loadPrompt('system', { instructions: 'Line 1\nLine 2' }, promptsDir)).toBe(
          'Instructions:\nLine 1\nLine 2'
        );
      });
    });

    it('uses the prompts directory under the current working directory by default', () => {
      withPromptDirectory((workingDir) => {
        const promptsDir = join(workingDir, 'prompts');
        mkdirSync(promptsDir);
        writePrompt(promptsDir, 'system', 'Hello {{name}}');
        const cwd = vi.spyOn(process, 'cwd').mockReturnValue(workingDir);
        try {
          expect(loadPrompt('system', { name: 'Alice' })).toBe('Hello Alice');
        } finally {
          cwd.mockRestore();
        }
      });
    });

    it('wraps file errors with the prompt name and resolved path', () => {
      withPromptDirectory((promptsDir) => {
        expect(() => loadPrompt('missing', {}, promptsDir)).toThrow(
          `Failed to load prompt "missing" from ${join(promptsDir, 'missing.md')}:`
        );
      });
    });
  });
}
