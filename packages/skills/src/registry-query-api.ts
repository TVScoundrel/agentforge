import type { Skill } from './types.js';
import type { ScanError } from './registry-internal.js';

export function getSkill(skills: Map<string, Skill>, name: string): Skill | undefined {
  return skills.get(name);
}

export function getAllSkills(skills: Map<string, Skill>): Skill[] {
  return Array.from(skills.values());
}

export function hasSkill(skills: Map<string, Skill>, name: string): boolean {
  return skills.has(name);
}

export function getSkillCount(skills: Map<string, Skill>): number {
  return skills.size;
}

export function getSkillNames(skills: Map<string, Skill>): string[] {
  return Array.from(skills.keys());
}

export function getScanErrors(scanErrors: ScanError[]): ReadonlyArray<ScanError> {
  return scanErrors;
}

export function getAllowedTools(skills: Map<string, Skill>, name: string): string[] | undefined {
  return skills.get(name)?.metadata.allowedTools;
}
