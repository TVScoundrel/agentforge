import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ensureDir,
  writeJson,
  readJson,
  pathExists,
  isEmptyDir,
  getTemplatePath,
  copyTemplate,
  removeDir,
  findFiles,
  readFile,
  writeFile,
} from '../../src/utils/fs.js';
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

vi.mock('fs-extra');
vi.mock('glob');

describe('File System Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureDir', () => {
    it('should ensure directory exists', async () => {
      vi.mocked(fs.ensureDir).mockResolvedValueOnce(undefined);

      await ensureDir('/test/dir');
      expect(fs.ensureDir).toHaveBeenCalledWith('/test/dir');
    });
  });

  describe('writeJson', () => {
    it('should write JSON file with formatting', async () => {
      vi.mocked(fs.writeJson).mockResolvedValueOnce(undefined);

      const data = { name: 'test', version: '1.0.0' };
      await writeJson('/test/package.json', data);

      expect(fs.writeJson).toHaveBeenCalledWith('/test/package.json', data, { spaces: 2 });
    });
  });

  describe('readJson', () => {
    it('should read and parse JSON file', async () => {
      const data = { name: 'test', version: '1.0.0' };
      vi.mocked(fs.readJson).mockResolvedValueOnce(data);

      const result = await readJson('/test/package.json');
      expect(result).toEqual(data);
      expect(fs.readJson).toHaveBeenCalledWith('/test/package.json');
    });

    it('should handle JSON with type parameter', async () => {
      interface PackageJson {
        name: string;
        version: string;
      }

      const data: PackageJson = { name: 'test', version: '1.0.0' };
      vi.mocked(fs.readJson).mockResolvedValueOnce(data);

      const result = await readJson<PackageJson>('/test/package.json');
      expect(result.name).toBe('test');
      expect(result.version).toBe('1.0.0');
    });
  });

  describe('pathExists', () => {
    it('should return true when path exists', async () => {
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true);

      const result = await pathExists('/test/file.txt');
      expect(result).toBe(true);
      expect(fs.pathExists).toHaveBeenCalledWith('/test/file.txt');
    });

    it('should return false when path does not exist', async () => {
      vi.mocked(fs.pathExists).mockResolvedValueOnce(false);

      const result = await pathExists('/test/missing.txt');
      expect(result).toBe(false);
    });
  });

  describe('isEmptyDir', () => {
    it('should return true when directory does not exist', async () => {
      vi.mocked(fs.pathExists).mockResolvedValueOnce(false);

      const result = await isEmptyDir('/test/missing');
      expect(result).toBe(true);
    });

    it('should return true when directory is empty', async () => {
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true);
      vi.mocked(fs.readdir).mockResolvedValueOnce([]);

      const result = await isEmptyDir('/test/empty');
      expect(result).toBe(true);
    });

    it('should return false when directory has files', async () => {
      vi.mocked(fs.pathExists).mockResolvedValueOnce(true);
      vi.mocked(fs.readdir).mockResolvedValueOnce(['file1.txt', 'file2.txt'] as any);

      const result = await isEmptyDir('/test/not-empty');
      expect(result).toBe(false);
    });
  });

  describe('getTemplatePath', () => {
    it('should return correct template path', () => {
      const result = getTemplatePath('minimal');
      expect(result).toContain('templates');
      expect(result).toContain('minimal');
    });

    it('should handle different template names', () => {
      const templates = ['minimal', 'full', 'api', 'cli'];
      templates.forEach((template) => {
        const result = getTemplatePath(template);
        expect(result).toContain(template);
      });
    });
  });

  describe('copyTemplate', () => {
    it('should copy template files without replacements', async () => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(glob).mockResolvedValueOnce(['file1.txt', 'file2.txt']);
      vi.mocked(fs.readFile).mockResolvedValue('content');
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await copyTemplate('/source', '/target');

      expect(fs.ensureDir).toHaveBeenCalledWith('/target');
      expect(glob).toHaveBeenCalledWith('**/*', {
        cwd: '/source',
        dot: true,
        nodir: true,
      });
      expect(fs.writeFile).toHaveBeenCalledTimes(2);
    });

    it('should copy template files with replacements', async () => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(glob).mockResolvedValueOnce(['package.json']);
      vi.mocked(fs.readFile).mockResolvedValue('{"name": "{{projectName}}"}');
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await copyTemplate('/source', '/target', { projectName: 'my-app' });

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        '{"name": "my-app"}'
      );
    });

    it('should handle multiple replacements', async () => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(glob).mockResolvedValueOnce(['README.md']);
      vi.mocked(fs.readFile).mockResolvedValue('# {{title}}\n{{description}}');
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await copyTemplate('/source', '/target', {
        title: 'My Project',
        description: 'A cool project',
      });

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        '# My Project\nA cool project'
      );
    });

    it('should create nested directories', async () => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(glob).mockResolvedValueOnce(['src/index.ts', 'src/utils/helper.ts']);
      vi.mocked(fs.readFile).mockResolvedValue('content');
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await copyTemplate('/source', '/target');

      expect(fs.ensureDir).toHaveBeenCalledWith('/target');
      expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('src'));
      expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('utils'));
    });
  });

  describe('removeDir', () => {
    it('should remove directory', async () => {
      vi.mocked(fs.remove).mockResolvedValue(undefined);

      await removeDir('/test/dir');
      expect(fs.remove).toHaveBeenCalledWith('/test/dir');
    });
  });

  describe('findFiles', () => {
    it('should find files with pattern', async () => {
      vi.mocked(glob).mockResolvedValueOnce(['file1.ts', 'file2.ts']);

      const result = await findFiles('**/*.ts', '/test');
      expect(result).toEqual(['file1.ts', 'file2.ts']);
      expect(glob).toHaveBeenCalledWith('**/*.ts', { cwd: '/test' });
    });

    it('should use process.cwd() as default', async () => {
      vi.mocked(glob).mockResolvedValueOnce(['file.ts']);

      await findFiles('**/*.ts');
      expect(glob).toHaveBeenCalledWith('**/*.ts', { cwd: process.cwd() });
    });
  });

  describe('readFile', () => {
    it('should read file content', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('file content' as any);

      const result = await readFile('/test/file.txt');
      expect(result).toBe('file content');
      expect(fs.readFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
    });
  });

  describe('writeFile', () => {
    it('should write file content', async () => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await writeFile('/test/dir/file.txt', 'content');

      expect(fs.ensureDir).toHaveBeenCalledWith('/test/dir');
      expect(fs.writeFile).toHaveBeenCalledWith('/test/dir/file.txt', 'content');
    });

    it('should create parent directories', async () => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await writeFile('/a/b/c/file.txt', 'content');

      expect(fs.ensureDir).toHaveBeenCalledWith('/a/b/c');
    });
  });
});

