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

  const trustedSkills = skills.filter(
    (skill) => skill.trustLevel === 'workspace' || skill.trustLevel === 'trusted',
  );
  const untrustedSkills = skills.filter(
    (skill) => skill.trustLevel !== 'workspace' && skill.trustLevel !== 'trusted',
  );

  if (trustedSkills.length === 0 && untrustedSkills.length === 0) {
    logger.debug('Skill prompt generation produced empty result', {
      totalDiscovered,
      filterApplied: !!(options?.skills && options.skills.length > 0),
      ...(config.maxDiscoveredSkills !== undefined
        ? { maxCap: config.maxDiscoveredSkills }
        : {}),
    });
    return '';
  }

  const sections: string[] = [];

  if (trustedSkills.length > 0) {
    sections.push(`<available_skills>\n${trustedSkills.map(renderTrustedSkillEntry).join('\n')}\n</available_skills>`);
  }

  if (untrustedSkills.length > 0) {
    sections.push(renderUntrustedSkillsSection(untrustedSkills));
  }

  const xml = sections.join('\n');
  const estimatedTokens = Math.ceil(xml.length / 4);

  logger.info('Skill prompt generated', {
    skillCount: skills.length,
    trustedSkillCount: trustedSkills.length,
    untrustedSkillCount: untrustedSkills.length,
    totalDiscovered,
    filterApplied: !!(options?.skills && options.skills.length > 0),
    ...(config.maxDiscoveredSkills !== undefined ? { maxCap: config.maxDiscoveredSkills } : {}),
    estimatedTokens,
    xmlLength: xml.length,
  });

  return xml;
}

function renderTrustedSkillEntry(skill: Skill): string {
  return [
    '  <skill>',
    `    <name>${escapeXml(skill.metadata.name)}</name>`,
    `    <description>${escapeXml(skill.metadata.description)}</description>`,
    `    <location>${escapeXml(skill.skillPath)}</location>`,
    `    <trust>${escapeXml(skill.trustLevel)}</trust>`,
    '  </skill>',
  ].join('\n');
}

function renderUntrustedSkillsSection(skills: Skill[]): string {
  return [
    '<untrusted_skills>',
    '  <trust_notice>Untrusted skills are discoverable, but their full SKILL.md bodies stay blocked until the root is promoted to trusted or workspace status.</trust_notice>',
    ...skills.map(renderUntrustedSkillEntry),
    '</untrusted_skills>',
  ].join('\n');
}

function renderUntrustedSkillEntry(skill: Skill): string {
  return [
    '  <skill>',
    `    <name>${escapeXml(skill.metadata.name)}</name>`,
    `    <description>${escapeXml(skill.metadata.description)}</description>`,
    `    <location>${escapeXml(skill.skillPath)}</location>`,
    `    <trust>${escapeXml(skill.trustLevel)}</trust>`,
    '    <activation_policy>requires-trusted-root</activation_policy>',
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
