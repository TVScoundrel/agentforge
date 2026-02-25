/**
 * Skill Directory Scanner
 *
 * Scans configured skill roots for directories containing valid SKILL.md files.
 * Returns a list of candidate skill paths for the parser to process.
 */

import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { homedir } from 'node:os';
import { createLogger, LogLevel } from '@agentforge/core';

const logger = createLogger('agentforge:skills:scanner', { level: LogLevel.INFO });

/**
 * Discovered skill candidate — a directory containing a SKILL.md file.
 */
export interface SkillCandidate {
  /** Absolute path to the skill directory */
  skillPath: string;
  /** The parent directory name (expected to match the skill name) */
  dirName: string;
  /** Raw content of the SKILL.md file */
  content: string;
  /** Which configured root this came from */
  rootPath: string;
}

/**
 * Expand `~` prefix to the user's home directory.
 */
export function expandHome(p: string): string {
  if (p.startsWith('~/') || p === '~') {
    return resolve(homedir(), p.slice(2));
  }
  return p;
}

/**
 * Scan a single skill root for directories containing SKILL.md.
 *
 * @param rootPath - The root directory to scan (may not exist)
 * @returns Array of valid skill candidates found under this root
 */
export function scanSkillRoot(rootPath: string): SkillCandidate[] {
  const resolvedRoot = resolve(expandHome(rootPath));
  const candidates: SkillCandidate[] = [];

  if (!existsSync(resolvedRoot)) {
    logger.debug('Skill root does not exist, skipping', { rootPath: resolvedRoot });
    return candidates;
  }

  let entries: string[];
  try {
    entries = readdirSync(resolvedRoot);
  } catch (err) {
    logger.warn('Failed to read skill root directory', {
      rootPath: resolvedRoot,
      error: err instanceof Error ? err.message : String(err),
    });
    return candidates;
  }

  for (const entry of entries) {
    const entryPath = resolve(resolvedRoot, entry);

    // Only process directories
    let stat;
    try {
      stat = statSync(entryPath);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) {
      continue;
    }

    // Check for SKILL.md inside the directory
    const skillMdPath = resolve(entryPath, 'SKILL.md');
    if (!existsSync(skillMdPath)) {
      continue;
    }

    // Read the SKILL.md content
    try {
      const content = readFileSync(skillMdPath, 'utf-8');
      candidates.push({
        skillPath: entryPath,
        dirName: basename(entryPath),
        content,
        rootPath: resolvedRoot,
      });
    } catch (err) {
      logger.warn('Failed to read SKILL.md', {
        path: skillMdPath,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  logger.debug('Scanned skill root', {
    rootPath: resolvedRoot,
    candidatesFound: candidates.length,
  });

  return candidates;
}

/**
 * Scan multiple skill roots for directories containing SKILL.md.
 *
 * @param skillRoots - Array of root paths to scan
 * @returns Array of all skill candidates found across all roots
 */
export function scanAllSkillRoots(skillRoots: string[]): SkillCandidate[] {
  const allCandidates: SkillCandidate[] = [];

  for (const root of skillRoots) {
    const candidates = scanSkillRoot(root);
    allCandidates.push(...candidates);
  }

  logger.info('Skill discovery complete', {
    rootsScanned: skillRoots.length,
    totalCandidates: allCandidates.length,
  });

  return allCandidates;
}
