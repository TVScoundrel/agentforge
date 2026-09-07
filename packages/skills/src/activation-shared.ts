import { createLogger, LogLevel } from '@agentforge/core';

export const activationLogger = createLogger('agentforge:skills:activation', {
  level: LogLevel.INFO,
});

export function formatMissingSkillMessage(name: string, availableNames: string[]): string {
  const suggestion = availableNames.length > 0
    ? ` Available skills: ${availableNames.join(', ')}`
    : ' No skills are currently registered.';

  return `Skill "${name}" not found.${suggestion}`;
}
