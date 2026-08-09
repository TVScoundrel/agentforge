export type PromptVariableValue = unknown;
export type PromptVariableMap = Record<string, PromptVariableValue>;

/** Options for rendering templates with trusted and untrusted variables. */
export interface RenderTemplateOptions {
  /** Variables from trusted sources. These values are not sanitized. */
  trustedVariables?: PromptVariableMap;
  /** Variables from untrusted sources. These values are sanitized. */
  untrustedVariables?: PromptVariableMap;
}
