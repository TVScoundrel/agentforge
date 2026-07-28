import { createDirectoryOperationTools } from './file/directory/index.js';
import type { DirectoryOperationsConfig } from './file/directory/types.js';
import {
  createFileSystemPolicy,
  type FileSystemPolicyOptions,
} from './file/confinement.js';
import { createFileOperationTools } from './file/operations/index.js';
import type { FileOperationsConfig } from './file/operations/types.js';
import { DEFAULT_DESTINATION_POLICY, type DestinationPolicy } from './web/egress-policy.js';
import { createHttpTools } from './web/http/index.js';
import type { HttpToolsConfig } from './web/http/types.js';
import { createScraperTools } from './web/scraper/index.js';
import type { ScraperToolsConfig } from './web/scraper/types.js';

export interface ModelSafeToolPresetOptions {
  fileSystem?: FileSystemPolicyOptions;
  file?: Omit<FileOperationsConfig, 'policy'>;
  directory?: Omit<DirectoryOperationsConfig, 'policy'>;
  web?: {
    http?: Omit<HttpToolsConfig, 'destinationPolicy'>;
    scraper?: Omit<ScraperToolsConfig, 'destinationPolicy'>;
    destinationPolicy?: DestinationPolicy;
  };
}

type FileTool = ReturnType<typeof createFileOperationTools>[number];
type DirectoryTool = ReturnType<typeof createDirectoryOperationTools>[number];
type WebTool = ReturnType<typeof createHttpTools>[number] | ReturnType<typeof createScraperTools>[number];

export interface ModelSafeToolPreset {
  fileTools: FileTool[];
  directoryTools: DirectoryTool[];
  webTools: WebTool[];
  tools: Array<FileTool | DirectoryTool | WebTool>;
}

function requireFilesystemRoot(options: FileSystemPolicyOptions | undefined): FileSystemPolicyOptions {
  if (!options?.workspaceRoot && !options?.allowedRoots?.length) {
    throw new Error('Model-safe tool preset requires workspaceRoot or allowedRoots');
  }

  return {
    ...options,
    allowOutsideRoots: false,
    allowRootDeletion: false,
  };
}

function modelSafeDestinationPolicy(policy: DestinationPolicy = {}): DestinationPolicy {
  return {
    ...DEFAULT_DESTINATION_POLICY,
    ...policy,
    allowLocalhost: false,
    allowPrivateNetwork: false,
    allowLinkLocal: false,
    allowMetadata: false,
  };
}

/**
 * Create the recommended tool collection for model-controlled file and web access.
 *
 * A filesystem root is required, and privileged filesystem/network policy flags are
 * intentionally forced back to their safe defaults. Trusted automation should use
 * the existing standalone factories when it needs broader access.
 */
export function createModelSafeToolPreset(options: ModelSafeToolPresetOptions = {}): ModelSafeToolPreset {
  const fileSystemPolicy = createFileSystemPolicy(requireFilesystemRoot(options.fileSystem));
  const destinationPolicy = modelSafeDestinationPolicy(options.web?.destinationPolicy);
  const fileTools = createFileOperationTools({ ...options.file, policy: fileSystemPolicy });
  const directoryTools = createDirectoryOperationTools({ ...options.directory, policy: fileSystemPolicy });
  const webTools = [
    ...createHttpTools({ ...options.web?.http, destinationPolicy }),
    ...createScraperTools({ ...options.web?.scraper, destinationPolicy }),
  ];

  return {
    fileTools,
    directoryTools,
    webTools,
    tools: [...fileTools, ...directoryTools, ...webTools],
  };
}
