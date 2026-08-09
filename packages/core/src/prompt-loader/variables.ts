import type { PromptVariableMap, RenderTemplateOptions } from './contracts.js';

const MAX_VARIABLE_LENGTH = 500;

function createPromptVariableMap(): PromptVariableMap {
  return Object.create(null) as PromptVariableMap;
}

function isPromptVariableMap(value: unknown): value is PromptVariableMap {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isRenderTemplateOptions(value: unknown): value is RenderTemplateOptions {
  return (
    isPromptVariableMap(value) &&
    (Object.prototype.hasOwnProperty.call(value, 'trustedVariables') ||
      Object.prototype.hasOwnProperty.call(value, 'untrustedVariables'))
  );
}

export function normalizeVariableMap(value: unknown): PromptVariableMap {
  if (!isPromptVariableMap(value)) return createPromptVariableMap();
  return Object.assign(createPromptVariableMap(), value);
}

export function sanitizeVariableMap(variables: PromptVariableMap): PromptVariableMap {
  const sanitizedVariables = createPromptVariableMap();
  for (const [key, value] of Object.entries(variables)) {
    sanitizedVariables[key] = sanitizeValue(value);
  }
  return sanitizedVariables;
}

export function mergeVariableMaps(
  baseVariables: PromptVariableMap,
  overrideVariables: PromptVariableMap
): PromptVariableMap {
  return Object.assign(createPromptVariableMap(), baseVariables, overrideVariables);
}

/**
 * Sanitize an untrusted value before prompt substitution.
 *
 * Removes Markdown header markers and line breaks, collapses whitespace,
 * and limits output to 500 characters plus an ellipsis.
 */
export function sanitizeValue(value: unknown): string {
  if (value === undefined || value === null) return '';

  let sanitized = String(value);
  sanitized = sanitized.replace(/^#+\s*/gm, '');
  sanitized = sanitized.replace(/[\r\n]+/g, ' ');
  sanitized = sanitized.trim().replace(/\s+/g, ' ');

  if (sanitized.length > MAX_VARIABLE_LENGTH) {
    sanitized = `${sanitized.substring(0, MAX_VARIABLE_LENGTH)}...`;
  }
  return sanitized;
}
