import { createLogger, LogLevel } from '@agentforge/core';
import type { SkillRegistry } from './registry.js';

export const activationLogger = createLogger('agentforge:skills:activation', {
  level: LogLevel.INFO,
});

export function buildMissingSkillMessage(registry: SkillRegistry, name: string): {
  availableCount: number;
  errorMessage: string;
} {
  const availableNames = registry.getNames();
  const suggestion = availableNames.length > 0
    ? ` Available skills: ${availableNames.join(', ')}`
    : ' No skills are currently registered.';

  return {
    availableCount: availableNames.length,
    errorMessage: `Skill "${name}" not found.${suggestion}`,
  };
}
