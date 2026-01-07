import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isGitInstalled,
  isGitRepository,
  getGitUserInfo,
} from '../../src/utils/git.js';
import { execa } from 'execa';

vi.mock('execa');
vi.mock('fs-extra');

describe('Git Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isGitInstalled', () => {
    it('should return true when git is installed', async () => {
      vi.mocked(execa).mockResolvedValueOnce({ stdout: 'git version 2.39.0' } as any);

      const result = await isGitInstalled();
      expect(result).toBe(true);
      expect(execa).toHaveBeenCalledWith('git', ['--version']);
    });

    it('should return false when git is not installed', async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error('git not found'));

      const result = await isGitInstalled();
      expect(result).toBe(false);
    });
  });

  describe('isGitRepository', () => {
    it('should return true when directory is a git repository', async () => {
      vi.mocked(execa).mockResolvedValueOnce({ stdout: '.git' } as any);

      const result = await isGitRepository('/test/repo');
      expect(result).toBe(true);
      expect(execa).toHaveBeenCalledWith('git', ['rev-parse', '--git-dir'], { cwd: '/test/repo' });
    });

    it('should return false when directory is not a git repository', async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error('not a git repository'));

      const result = await isGitRepository('/test/not-repo');
      expect(result).toBe(false);
    });
  });

  describe('getGitUserInfo', () => {
    it('should return user name and email', async () => {
      vi.mocked(execa)
        .mockResolvedValueOnce({ stdout: 'John Doe' } as any)
        .mockResolvedValueOnce({ stdout: 'john@example.com' } as any);

      const result = await getGitUserInfo();
      expect(result).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect(execa).toHaveBeenCalledWith('git', ['config', 'user.name']);
      expect(execa).toHaveBeenCalledWith('git', ['config', 'user.email']);
    });

    it('should return empty object when git config fails', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('git config failed'));

      const result = await getGitUserInfo();
      expect(result).toEqual({});
    });

    it('should handle partial git config', async () => {
      vi.mocked(execa)
        .mockResolvedValueOnce({ stdout: 'John Doe' } as any)
        .mockRejectedValueOnce(new Error('email not configured'));

      const result = await getGitUserInfo();
      expect(result).toEqual({});
    });
  });
});

