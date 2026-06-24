import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export function createTempDir(): string {
  const dir = join(tmpdir(), `skill-activation-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function cleanupTempDirs(dirs: string[]): void {
  for (const dir of dirs) {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function createSkillFixture(
  root: string,
  dirName: string,
  frontmatter: string,
  body: string,
): string {
  const skillDir = join(root, dirName);
  mkdirSync(skillDir, { recursive: true });
  const content = `---\n${frontmatter}\n---\n${body}`;
  writeFileSync(join(skillDir, 'SKILL.md'), content, 'utf-8');
  return skillDir;
}

export function createResourceFile(skillDir: string, relativePath: string, content: string): string {
  const fullPath = join(skillDir, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, 'utf-8');
  return fullPath;
}
