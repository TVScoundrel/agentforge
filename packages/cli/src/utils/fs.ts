import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function ensureDir(dir: string): Promise<void> {
  await fs.ensureDir(dir);
}

export async function copyTemplate(
  templatePath: string,
  targetPath: string,
  replacements: Record<string, string> = {}
): Promise<void> {
  // Verify template path exists
  if (!(await fs.pathExists(templatePath))) {
    throw new Error(`Template path does not exist: ${templatePath}`);
  }

  await fs.ensureDir(targetPath);

  const files = await glob('**/*', {
    cwd: templatePath,
    dot: true,
    nodir: true,
  });

  if (files.length === 0) {
    throw new Error(`No files found in template: ${templatePath}`);
  }

  for (const file of files) {
    const sourcePath = path.join(templatePath, file);
    const destPath = path.join(targetPath, file);

    await fs.ensureDir(path.dirname(destPath));

    let content = await fs.readFile(sourcePath, 'utf-8');

    // Apply replacements
    for (const [key, value] of Object.entries(replacements)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    await fs.writeFile(destPath, content);
  }
}

export async function writeJson(filePath: string, data: any): Promise<void> {
  await fs.writeJson(filePath, data, { spaces: 2 });
}

export async function readJson<T = any>(filePath: string): Promise<T> {
  return fs.readJson(filePath);
}

export async function pathExists(filePath: string): Promise<boolean> {
  return fs.pathExists(filePath);
}

export async function removeDir(dir: string): Promise<void> {
  await fs.remove(dir);
}

export async function findFiles(
  pattern: string,
  cwd: string = process.cwd()
): Promise<string[]> {
  return glob(pattern, { cwd });
}

export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content);
}

export function getTemplatePath(template: string): string {
  // __dirname is in dist/, so we go up one level to the package root
  // then into templates directory
  return path.join(__dirname, '..', 'templates', template);
}

export async function isEmptyDir(dir: string): Promise<boolean> {
  if (!(await pathExists(dir))) {
    return true;
  }

  const files = await fs.readdir(dir);
  return files.length === 0;
}

