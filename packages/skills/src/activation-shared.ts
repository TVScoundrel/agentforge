import { createLogger, LogLevel } from '@agentforge/core';
import type { SkillRegistry } from './registry.js';

export const activationLogger = createLogger('agentforge:skills:activation', {
  level: LogLevel.INFO,
});

export function formatMissingSkillMessage(name: string, availableNames: string[]): string {
  const suggestion = availableNames.length > 0
    ? ` Available skills: ${availableNames.join(', ')}`
    : ' No skills are currently registered.';

  return `Skill "${name}" not found.${suggestion}`;
}

export function buildMissingSkillMessage(registry: SkillRegistry, name: string): {
  availableCount: number;
  errorMessage: string;
} {
  const availableNames = registry.getNames();
  return {
    availableCount: availableNames.length,
    errorMessage: formatMissingSkillMessage(name, availableNames),
  };
}
