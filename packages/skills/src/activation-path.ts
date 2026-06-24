import { isAbsolute, relative, resolve } from 'node:path';
import { realpathSync } from 'node:fs';

/**
 * Resolve a resource path within a skill root, blocking path traversal.
 *
 * @param skillPath - Absolute path to the skill directory
 * @param resourcePath - Relative path to the resource file
 * @returns Absolute path to the resource, or an error string
 */
export function resolveResourcePath(
  skillPath: string,
  resourcePath: string,
): { success: true; resolvedPath: string } | { success: false; error: string } {
  if (isAbsolute(resourcePath)) {
    return { success: false, error: 'Absolute resource paths are not allowed' };
  }

  const segments = resourcePath.split(/[/\\]/);
  if (segments.some((seg) => seg === '..')) {
    return { success: false, error: 'Path traversal is not allowed — resource paths must stay within the skill directory' };
  }

  const resolvedPath = resolve(skillPath, resourcePath);
  const resolvedSkillPath = resolve(skillPath);
  const rel = relative(resolvedSkillPath, resolvedPath);
  if (rel.startsWith('..') || resolve(resolvedSkillPath, rel) !== resolvedPath) {
    return { success: false, error: 'Path traversal is not allowed — resource paths must stay within the skill directory' };
  }

  try {
    const realSkillRoot = realpathSync(resolvedSkillPath);
    const realTarget = realpathSync(resolvedPath);
    const realRel = relative(realSkillRoot, realTarget);
    if (realRel.startsWith('..') || isAbsolute(realRel)) {
      return { success: false, error: 'Symlink target escapes the skill directory — access denied' };
    }
  } catch {
    // File doesn't exist yet (or can't be stat'd) — skip symlink check.
    // The caller will produce a clear error if the file is missing.
  }

  return { success: true, resolvedPath };
}
