import { createLogger, LogLevel } from '@agentforge/core';
import type { Skill, SkillPromptOptions, SkillRegistryConfig } from './types.js';

const logger = createLogger('agentforge:skills:registry', { level: LogLevel.INFO });

export function generateSkillPrompt(
  config: SkillRegistryConfig,
  allSkills: Skill[],
  totalDiscovered: number,
  options?: SkillPromptOptions,
): string {
  if (!config.enabled) {
    logger.debug('Skill prompt generation skipped (disabled)', {
      enabled: config.enabled ?? false,
    });
    return '';
  }

  let skills = allSkills;

  if (options?.skills && options.skills.length > 0) {
    const requested = new Set(options.skills);
    skills = skills.filter((skill) => requested.has(skill.metadata.name));
  }

  if (config.maxDiscoveredSkills !== undefined && config.maxDiscoveredSkills >= 0) {
    skills = skills.slice(0, config.maxDiscoveredSkills);
  }

  if (skills.length === 0) {
    logger.debug('Skill prompt generation produced empty result', {
      totalDiscovered,
      filterApplied: !!(options?.skills && options.skills.length > 0),
      ...(config.maxDiscoveredSkills !== undefined
        ? { maxCap: config.maxDiscoveredSkills }
        : {}),
    });
    return '';
  }

  const xml = `<available_skills>\n${skills.map(renderSkillEntry).join('\n')}\n</available_skills>`;
  const estimatedTokens = Math.ceil(xml.length / 4);

  logger.info('Skill prompt generated', {
    skillCount: skills.length,
    totalDiscovered,
    filterApplied: !!(options?.skills && options.skills.length > 0),
    ...(config.maxDiscoveredSkills !== undefined ? { maxCap: config.maxDiscoveredSkills } : {}),
    estimatedTokens,
    xmlLength: xml.length,
  });

  return xml;
}

function renderSkillEntry(skill: Skill): string {
  return [
    '  <skill>',
    `    <name>${escapeXml(skill.metadata.name)}</name>`,
    `    <description>${escapeXml(skill.metadata.description)}</description>`,
    `    <location>${escapeXml(skill.skillPath)}</location>`,
    '  </skill>',
  ].join('\n');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
