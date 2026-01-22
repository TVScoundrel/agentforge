/**
 * Prompt loader utility for loading and rendering prompts from .md files
 * with {{variable}} placeholder support
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Simple template renderer that supports:
 * - {{variable}} - simple variable substitution
 * - {{#if variable}}...{{/if}} - conditional blocks
 * 
 * @param template - Template string with placeholders
 * @param variables - Object with variable values
 * @returns Rendered template
 */
export function renderTemplate(template: string, variables: Record<string, any>): string {
  let result = template;
  
  // Handle conditional blocks: {{#if variable}}...{{/if}}
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  result = result.replace(conditionalRegex, (match, varName, content) => {
    const value = variables[varName];
    // Include content if variable is truthy
    return value ? content : '';
  });
  
  // Handle simple variable substitution: {{variable}}
  const variableRegex = /\{\{(\w+)\}\}/g;
  result = result.replace(variableRegex, (match, varName) => {
    const value = variables[varName];
    return value !== undefined && value !== null ? String(value) : '';
  });
  
  return result;
}

/**
 * Load a prompt template from a .md file
 * 
 * @param promptName - Name of the prompt file (without .md extension)
 * @returns Template string
 */
export function loadPromptTemplate(promptName: string): string {
  const promptPath = join(__dirname, '..', 'prompts', `${promptName}.md`);
  return readFileSync(promptPath, 'utf-8');
}

/**
 * Load and render a prompt template with variables
 * 
 * @param promptName - Name of the prompt file (without .md extension)
 * @param variables - Variables to substitute in the template
 * @returns Rendered prompt
 */
export function loadPrompt(promptName: string, variables: Record<string, any> = {}): string {
  const template = loadPromptTemplate(promptName);
  return renderTemplate(template, variables);
}

