import { resolve as resolvePath } from 'node:path';
import { createLogger, LogLevel } from '@agentforge/core';
import { parseSkillContent } from './parser.js';
import { scanAllSkillRoots, expandHome } from './scanner.js';
import { normalizeRootConfig } from './trust.js';
import type { Skill, SkillRegistryConfig, TrustLevel } from './types.js';
import { SkillRegistryEvent } from './types.js';
import type { RegistryEmit, ScanError } from './registry-internal.js';

const logger = createLogger('agentforge:skills:registry', { level: LogLevel.INFO });

export function discoverSkills(
  config: Pick<SkillRegistryConfig, 'skillRoots'>,
  skills: Map<string, Skill>,
  rootTrustMap: Map<string, TrustLevel>,
  emit: RegistryEmit,
): ScanError[] {
  skills.clear();
  rootTrustMap.clear();
  const scanErrors: ScanError[] = [];

  const normalizedRoots = config.skillRoots.map(normalizeRootConfig);
  const plainPaths = normalizedRoots.map((root) => root.path);

  for (const root of normalizedRoots) {
    const resolvedPath = resolvePath(expandHome(root.path));
    rootTrustMap.set(resolvedPath, root.trust);
  }

  const candidates = scanAllSkillRoots(plainPaths);

  let successCount = 0;
  let warningCount = 0;

  for (const candidate of candidates) {
    const result = parseSkillContent(candidate.content, candidate.dirName);

    if (!result.success) {
      warningCount++;
      recordScanError(scanErrors, candidate.skillPath, result.error || 'Unknown parse error');
      emit(SkillRegistryEvent.SKILL_WARNING, {
        skillPath: candidate.skillPath,
        rootPath: candidate.rootPath,
        error: result.error,
      });
      logger.warn('Skipping invalid skill', {
        skillPath: candidate.skillPath,
        ...(result.error ? { error: result.error } : {}),
      });
      continue;
    }

    const skill: Skill = {
      metadata: result.metadata!,
      skillPath: candidate.skillPath,
      rootPath: candidate.rootPath,
      trustLevel: rootTrustMap.get(candidate.rootPath) ?? 'untrusted',
    };

    if (skills.has(skill.metadata.name)) {
      warningCount++;
      const existing = skills.get(skill.metadata.name)!;
      const warningMessage =
        `Duplicate skill name "${skill.metadata.name}" from "${candidate.rootPath}" — ` +
        `keeping version from "${existing.rootPath}" (first root takes precedence)`;

      recordScanError(scanErrors, candidate.skillPath, warningMessage);
      emit(SkillRegistryEvent.SKILL_WARNING, {
        skillPath: candidate.skillPath,
        rootPath: candidate.rootPath,
        duplicateOf: existing.skillPath,
        error: warningMessage,
      });
      logger.warn('Duplicate skill name, keeping first', {
        name: skill.metadata.name,
        kept: existing.skillPath,
        skipped: candidate.skillPath,
      });
      continue;
    }

    skills.set(skill.metadata.name, skill);
    successCount++;
    emit(SkillRegistryEvent.SKILL_DISCOVERED, skill);
    logger.debug('Skill discovered', {
      name: skill.metadata.name,
      description: skill.metadata.description.slice(0, 80),
      skillPath: skill.skillPath,
    });
  }

  logger.info('Skill registry populated', {
    rootsScanned: config.skillRoots.length,
    skillsDiscovered: successCount,
    warnings: warningCount,
  });

  return scanErrors;
}

function recordScanError(scanErrors: ScanError[], path: string, error: string): void {
  scanErrors.push({ path, error });
}
