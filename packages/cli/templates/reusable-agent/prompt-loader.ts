import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Simple template variable substitution
 * Supports: {{variable}} and {{#if variable}}...{{/if}}
 */
export function renderTemplate(template: string, variables: Record<string, any>): string {
  let result = template;

  // Replace simple variables: {{variableName}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] !== undefined ? String(variables[varName]) : match;
  });

  // Handle conditional blocks: {{#if variableName}}...{{/if}}
  result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, content) => {
    return variables[varName] ? content : '';
  });

  return result;
}

/**
 * Load a prompt template from the prompts directory
 */
export function loadPromptTemplate(name: string): string {
  const promptPath = join(__dirname, '..', 'prompts', `${name}.md`);
  return readFileSync(promptPath, 'utf-8');
}

/**
 * Load and render a prompt with variables
 */
export function loadPrompt(name: string, variables: Record<string, any> = {}): string {
  const template = loadPromptTemplate(name);
  return renderTemplate(template, variables);
}

