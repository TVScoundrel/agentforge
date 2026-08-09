import type { PromptVariableMap, RenderTemplateOptions } from './contracts.js';
import {
  isRenderTemplateOptions,
  mergeVariableMaps,
  normalizeVariableMap,
  sanitizeVariableMap,
} from './variables.js';

/**
 * Render substitutions and conditional blocks with trusted/untrusted controls.
 * Trusted values are substituted unchanged, untrusted values are sanitized,
 * and conditional truthiness is evaluated against the original raw values.
 * Plain variable maps remain supported as trusted input for compatibility.
 */
export function renderTemplate(
  template: string,
  options: RenderTemplateOptions | PromptVariableMap
): string {
  let rawVariables: PromptVariableMap;
  let sanitizedVariables: PromptVariableMap;

  if (isRenderTemplateOptions(options)) {
    const trustedVariables = normalizeVariableMap(options.trustedVariables);
    const untrustedVariables = normalizeVariableMap(options.untrustedVariables);
    rawVariables = mergeVariableMaps(trustedVariables, untrustedVariables);
    sanitizedVariables = mergeVariableMaps(
      trustedVariables,
      sanitizeVariableMap(untrustedVariables)
    );
  } else {
    rawVariables = normalizeVariableMap(options);
    sanitizedVariables = rawVariables;
  }

  let result = template.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, variableName: string, content: string) => (rawVariables[variableName] ? content : '')
  );

  result = result.replace(/\{\{(\w+)\}\}/g, (_, variableName: string) => {
    const value = sanitizedVariables[variableName];
    return value === undefined || value === null ? '' : String(value);
  });

  return result;
}
