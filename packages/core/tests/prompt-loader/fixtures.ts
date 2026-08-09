import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

export function withPromptDirectory(run: (promptsDir: string) => void): void {
  const promptsDir = mkdtempSync(join(tmpdir(), 'tmp-prompt-loader-'));
  try {
    run(promptsDir);
  } finally {
    rmSync(promptsDir, { recursive: true, force: true });
  }
}

export function writePrompt(promptsDir: string, name: string, template: string): void {
  writeFileSync(join(promptsDir, `${name}.md`), template);
}
