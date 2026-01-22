/**
 * Prompt Template Loader
 * 
 * Utility for loading and rendering prompt templates from .md files.
 * Supports variable substitution and conditional blocks.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Render a template string with variable substitution
 * 
 * Supports:
 * - Simple variables: {{variableName}}
 * - Conditional blocks: {{#if variableName}}...{{/if}}
 */
export function renderTemplate(template: string, variables: Record<string, any>): string {
  let result = template;
  
  // Handle conditional blocks: {{#if variable}}...{{/if}}
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  result = result.replace(conditionalRegex, (match, varName, content) => {
    const value = variables[varName];
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
 * Load a prompt template from the prompts directory
 */
export function loadPromptTemplate(promptName: string): string {
  const promptPath = join(__dirname, '..', 'prompts', `${promptName}.md`);
  return readFileSync(promptPath, 'utf-8');
}

/**
 * Load and render a prompt template with variables
 */
export function loadPrompt(promptName: string, variables: Record<string, any> = {}): string {
  const template = loadPromptTemplate(promptName);
  return renderTemplate(template, variables);
}

