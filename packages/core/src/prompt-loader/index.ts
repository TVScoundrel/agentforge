/**
 * Prompt Template Loader
 *
 * Utility for loading and rendering prompt templates from .md files.
 * Supports variable substitution and conditional blocks.
 *
 * SECURITY: This module includes protection against prompt injection attacks
 * by sanitizing variable values before substitution.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Maximum length for a single variable value to prevent prompt bloat
 */
const MAX_VARIABLE_LENGTH = 500;

/**
 * Options for rendering templates with security controls
 */
export interface RenderTemplateOptions {
  /**
   * Variables from trusted sources (config files, hardcoded values)
   * These will NOT be sanitized
   */
  trustedVariables?: Record<string, any>;
  
  /**
   * Variables from untrusted sources (user input, API calls, databases)
   * These WILL be sanitized to prevent prompt injection
   */
  untrustedVariables?: Record<string, any>;
}

/**
 * Sanitize a value to prevent prompt injection attacks
 * 
 * Protections:
 * - Removes markdown headers (prevents structure hijacking)
 * - Removes newlines (prevents multi-line injection)
 * - Limits length (prevents prompt bloat)
 * 
 * @param value - The value to sanitize
 * @returns Sanitized string safe for use in prompts
 */
export function sanitizeValue(value: any): string {
  if (value === undefined || value === null) return '';
  
  let sanitized = String(value);
  
  // Remove markdown headers FIRST (before newline removal)
  // This catches patterns like "Acme\n\n# New System Prompt"
  sanitized = sanitized.replace(/^#+\s*/gm, '');
  
  // Remove newlines and carriage returns (prevents multi-line injection)
  sanitized = sanitized.replace(/[\r\n]+/g, ' ');
  
  // Trim excessive whitespace
  sanitized = sanitized.trim().replace(/\s+/g, ' ');
  
  // Limit length to prevent prompt bloat
  if (sanitized.length > MAX_VARIABLE_LENGTH) {
    sanitized = sanitized.substring(0, MAX_VARIABLE_LENGTH) + '...';
  }
  
  return sanitized;
}

/**
 * Render a template string with variable substitution
 *
 * Supports:
 * - Simple variables: {{variableName}}
 * - Conditional blocks: {{#if variableName}}...{{/if}}
 *
 * SECURITY: Distinguishes between trusted and untrusted variables.
 * - Trusted variables (from config) are used as-is
 * - Untrusted variables (from user input) are sanitized
 *
 * @param template - Template string with {{variable}} placeholders
 * @param options - Variables and security options
 * @returns Rendered template string
 *
 * @example
 * ```typescript
 * // Safe: Trusted variables from config
 * const result = renderTemplate(template, {
 *   trustedVariables: {
 *     companyName: 'Acme Corp',  // From config file
 *     premium: true
 *   }
 * });
 *
 * // Safe: Untrusted variables are sanitized
 * const result = renderTemplate(template, {
 *   untrustedVariables: {
 *     userName: req.body.name,  // User input - will be sanitized
 *   }
 * });
 *
 * // Mixed: Some trusted, some untrusted
 * const result = renderTemplate(template, {
 *   trustedVariables: {
 *     companyName: 'Acme Corp',  // From config
 *   },
 *   untrustedVariables: {
 *     userName: req.body.name,  // User input
 *   }
 * });
 * ```
 */
export function renderTemplate(
  template: string,
  options: RenderTemplateOptions | Record<string, any>
): string {
  // Backwards compatibility: if options is a plain object without
  // trustedVariables/untrustedVariables, treat all as trusted
  let allVariables: Record<string, any>;
  
  if ('trustedVariables' in options || 'untrustedVariables' in options) {
    const opts = options as RenderTemplateOptions;
    
    // Sanitize untrusted variables
    const sanitizedUntrusted: Record<string, any> = {};
    if (opts.untrustedVariables) {
      for (const [key, value] of Object.entries(opts.untrustedVariables)) {
        sanitizedUntrusted[key] = sanitizeValue(value);
      }
    }
    
    // Merge: trusted variables are used as-is, untrusted are sanitized
    allVariables = {
      ...opts.trustedVariables,
      ...sanitizedUntrusted,
    };
  } else {
    // Backwards compatible: treat all as trusted
    allVariables = options as Record<string, any>;
  }

  let result = template;

  // Handle conditional blocks: {{#if variable}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, varName, content) => {
    return allVariables[varName] ? content : '';
  });

  // Handle simple variable substitution: {{variable}}
  result = result.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
    const value = allVariables[varName];
    if (value === undefined || value === null) return '';
    return String(value);
  });

  return result;
}

/**
 * Load and render a prompt template from a .md file
 *
 * Looks for prompts in a `prompts/` directory relative to the caller's location.
 *
 * @param promptName - Name of the prompt file (without .md extension)
 * @param options - Variables and security options
 * @param promptsDir - Optional custom prompts directory path
 * @returns Rendered prompt string
 *
 * @example
 * ```typescript
 * // Backwards compatible: all variables treated as trusted
 * loadPrompt('system', { companyName: 'Acme' });
 *
 * // Explicit: separate trusted and untrusted
 * loadPrompt('system', {
 *   trustedVariables: { companyName: 'Acme' },
 *   untrustedVariables: { userName: userInput }
 * });
 *
 * // Custom prompts directory
 * loadPrompt('system', { companyName: 'Acme' }, '/path/to/prompts');
 * ```
 */
export function loadPrompt(
  promptName: string,
  options: RenderTemplateOptions | Record<string, any> = {},
  promptsDir?: string
): string {
  // Default to 'prompts' directory relative to caller
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

