import { readFileSync } from 'fs';
import { join } from 'path';
import type { PromptVariableMap, RenderTemplateOptions } from './contracts.js';
import { renderTemplate } from './renderer.js';

/**
 * Load and render a Markdown prompt template from a custom directory or the
 * `prompts` directory beneath the current working directory.
 */
export function loadPrompt(
  promptName: string,
  options: RenderTemplateOptions | PromptVariableMap = {},
  promptsDir?: string
): string {
  const baseDir = promptsDir || join(process.cwd(), 'prompts');
  const promptPath = join(baseDir, `${promptName}.md`);

  try {
    const template = readFileSync(promptPath, 'utf-8');
    return renderTemplate(template, options);
  } catch (error) {
    throw new Error(
      `Failed to load prompt "${promptName}" from ${promptPath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
