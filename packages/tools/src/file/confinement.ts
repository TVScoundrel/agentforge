import { promises as fs } from 'node:fs';
import * as path from 'node:path';

export type FileSystemPolicyErrorCode = 'FILE_SYSTEM_POLICY_VIOLATION';

export class FileSystemPolicyError extends Error {
  readonly code: FileSystemPolicyErrorCode = 'FILE_SYSTEM_POLICY_VIOLATION';

  constructor(
    message: string,
    readonly operation: string,
    readonly inputPath: string,
  ) {
    super(message);
    this.name = 'FileSystemPolicyError';
  }
}

export interface FileSystemPolicyOptions {
  allowedRoots?: readonly string[];
  workspaceRoot?: string;
  allowOutsideRoots?: boolean;
  allowRootDeletion?: boolean;
}

export type FileSystemPolicyInput = FileSystemPolicy | FileSystemPolicyOptions;

function containsTraversal(inputPath: string): boolean {
  return inputPath.split(/[\\/]+/).includes('..');
}

function isWithinRoot(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

async function resolveWithMissingTail(inputPath: string): Promise<string> {
  let currentPath = inputPath;
  const missingSegments: string[] = [];

  while (true) {
    try {
      const resolvedPath = await fs.realpath(currentPath);
      return path.join(resolvedPath, ...missingSegments);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT' && code !== 'ENOTDIR') {
        throw error;
      }

      const parentPath = path.dirname(currentPath);
      if (parentPath === currentPath) {
        throw error;
      }

      missingSegments.unshift(path.basename(currentPath));
      currentPath = parentPath;
    }
  }
}

export class FileSystemPolicy {
  readonly allowedRoots: readonly string[];
  readonly allowOutsideRoots: boolean;
  readonly allowRootDeletion: boolean;
  private readonly baseDirectory: string;

  constructor(options: FileSystemPolicyOptions = {}) {
    const configuredRoots = [
      ...(options.allowedRoots ?? []),
      ...(options.workspaceRoot ? [options.workspaceRoot] : []),
    ];

    this.allowedRoots = [...new Set(configuredRoots.map((root) => path.resolve(root)))];
    this.baseDirectory = path.resolve(options.workspaceRoot ?? process.cwd());
    this.allowOutsideRoots = options.allowOutsideRoots ?? this.allowedRoots.length === 0;
    this.allowRootDeletion = options.allowRootDeletion ?? this.allowOutsideRoots;
  }

  async resolvePath(inputPath: string, operation: string): Promise<string> {
    const absolutePath = path.resolve(this.baseDirectory, inputPath);

    if (this.allowOutsideRoots) {
      return absolutePath;
    }

    if (containsTraversal(inputPath)) {
      throw new FileSystemPolicyError(
        `Filesystem policy blocked ${operation}: path traversal is not allowed`,
        operation,
        inputPath,
      );
    }

    let resolvedPath: string;
    try {
      resolvedPath = await resolveWithMissingTail(absolutePath);
    } catch {
      throw new FileSystemPolicyError(
        `Filesystem policy could not resolve ${operation} path`,
        operation,
        inputPath,
      );
    }

    const resolvedRoots = await this.resolveRoots(operation, inputPath);
    if (!resolvedRoots.some((root) => isWithinRoot(root, resolvedPath))) {
      throw new FileSystemPolicyError(
        `Filesystem policy blocked ${operation}: path is outside the allowed roots`,
        operation,
        inputPath,
      );
    }

    return resolvedPath;
  }

  async resolveDeletePath(inputPath: string, recursive: boolean): Promise<string> {
    const resolvedPath = await this.resolvePath(inputPath, 'directory deletion');

    if (recursive && !this.allowRootDeletion) {
      const resolvedRoots = await this.resolveRoots('directory deletion', inputPath);
      if (resolvedRoots.some((root) => root === resolvedPath)) {
        throw new FileSystemPolicyError(
          'Filesystem policy blocked directory deletion: recursive deletion of an allowed root is not permitted',
          'directory deletion',
          inputPath,
        );
      }
    }

    return resolvedPath;
  }

  private async resolveRoots(operation: string, inputPath: string): Promise<string[]> {
    try {
      return await Promise.all(this.allowedRoots.map((root) => fs.realpath(root)));
    } catch {
      throw new FileSystemPolicyError(
        `Filesystem policy could not resolve an allowed root for ${operation}`,
        operation,
        inputPath,
      );
    }
  }
}

export const DEFAULT_FILE_SYSTEM_POLICY = new FileSystemPolicy();

export function createFileSystemPolicy(options: FileSystemPolicyOptions = {}): FileSystemPolicy {
  return new FileSystemPolicy(options);
}

export function resolveFileSystemPolicy(policy?: FileSystemPolicyInput): FileSystemPolicy {
  if (!policy) {
    return DEFAULT_FILE_SYSTEM_POLICY;
  }

  return policy instanceof FileSystemPolicy ? policy : createFileSystemPolicy(policy);
}
